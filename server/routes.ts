import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { detectionService } from "./detectionService";
import { insertRoomSchema, insertDetectedObjectSchema, type SearchCriteria } from "@shared/schema";
import { createHash } from "crypto";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Room routes
  app.get('/api/rooms', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const rooms = await storage.getRoomsByUserId(userId);
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  app.post('/api/rooms', isAuthenticated, upload.single('layoutImage'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const roomData = insertRoomSchema.parse({
        ...req.body,
        userId,
        layoutImageUri: req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : null,
        gpsLocation: req.body.gpsLocation ? JSON.parse(req.body.gpsLocation) : null,
        furniture: req.body.furniture ? JSON.parse(req.body.furniture) : [],
        planData: req.body.planData ? JSON.parse(req.body.planData) : null,
      });

      const room = await storage.createRoom(roomData);
      res.json(room);
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(400).json({ message: "Failed to create room" });
    }
  });

  app.get('/api/rooms/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const room = await storage.getRoomById(req.params.id, userId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      console.error("Error fetching room:", error);
      res.status(500).json({ message: "Failed to fetch room" });
    }
  });

  app.patch('/api/rooms/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updateData = insertRoomSchema.partial().parse(req.body);
      const room = await storage.updateRoom(req.params.id, userId, updateData);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      console.error("Error updating room:", error);
      res.status(400).json({ message: "Failed to update room" });
    }
  });

  app.delete('/api/rooms/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const success = await storage.deleteRoom(req.params.id, userId);
      if (!success) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json({ message: "Room deleted successfully" });
    } catch (error) {
      console.error("Error deleting room:", error);
      res.status(500).json({ message: "Failed to delete room" });
    }
  });

  // Advanced image analysis endpoint
  app.post('/api/analyze-image', isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      // Use detection service for comprehensive analysis
      const detectionResults = await detectionService.detectObjectsAndLogos(
        req.file.buffer, 
        req.file.mimetype
      );

      res.json(detectionResults);
    } catch (error) {
      console.error("Error analyzing image:", error);
      res.status(500).json({ message: "Failed to analyze image" });
    }
  });

  // Object detection routes
  app.get('/api/objects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const objects = await storage.getDetectedObjectsByUserId(userId);
      res.json(objects);
    } catch (error) {
      console.error("Error fetching objects:", error);
      res.status(500).json({ message: "Failed to fetch objects" });
    }
  });

  app.post('/api/objects', isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      const objectData = insertDetectedObjectSchema.parse({
        ...req.body,
        userId,
        imageUri: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        objects: req.body.objects ? JSON.parse(req.body.objects) : [],
        mlMetadata: req.body.mlMetadata ? JSON.parse(req.body.mlMetadata) : {},
        gpsLocation: req.body.gpsLocation ? JSON.parse(req.body.gpsLocation) : {},
        colors: req.body.colors ? JSON.parse(req.body.colors) : {},
        shapes: req.body.shapes ? JSON.parse(req.body.shapes) : {},
      });

      const detectedObject = await storage.createDetectedObject(objectData);
      res.json(detectedObject);
    } catch (error) {
      console.error("Error creating detected object:", error);
      res.status(400).json({ message: "Failed to create detected object" });
    }
  });

  app.get('/api/objects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const object = await storage.getDetectedObjectById(req.params.id, userId);
      if (!object) {
        return res.status(404).json({ message: "Object not found" });
      }
      res.json(object);
    } catch (error) {
      console.error("Error fetching object:", error);
      res.status(500).json({ message: "Failed to fetch object" });
    }
  });

  app.delete('/api/objects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const success = await storage.deleteDetectedObject(req.params.id, userId);
      if (!success) {
        return res.status(404).json({ message: "Object not found" });
      }
      res.json({ message: "Object deleted successfully" });
    } catch (error) {
      console.error("Error deleting object:", error);
      res.status(500).json({ message: "Failed to delete object" });
    }
  });

  // MagicPlan callback endpoint
  app.post('/api/magicplan-callback', async (req, res) => {
    try {
      const { project_name, scan_data, layout_image } = req.body;
      
      // In a real implementation, you'd process the MagicPlan data
      // For now, we'll store it temporarily and redirect back to the app
      
      res.json({ 
        success: true, 
        message: 'Scan data received',
        redirect_url: `/room-scanner?scan_complete=true&project=${project_name}`
      });
    } catch (error) {
      console.error('MagicPlan callback error:', error);
      res.status(500).json({ error: 'Failed to process scan data' });
    }
  });

  // Search routes
  app.post('/api/search', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const criteria: SearchCriteria = req.body;
      
      // Create cache key
      const queryHash = createHash('md5')
        .update(JSON.stringify({ userId, ...criteria }))
        .digest('hex');

      // Check cache first
      const cachedResults = await storage.getCachedSearchResults(queryHash);
      if (cachedResults) {
        return res.json(cachedResults);
      }

      // Perform search
      const results = await storage.searchObjects(userId, criteria);
      
      // Cache results
      await storage.cacheSearchResults(queryHash, results);
      
      res.json(results);
    } catch (error) {
      console.error("Error performing search:", error);
      res.status(500).json({ message: "Failed to perform search" });
    }
  });

  // Export routes
  app.get('/api/export/objects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const objects = await storage.getDetectedObjectsByUserId(userId);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="detected-objects.json"');
      res.json(objects);
    } catch (error) {
      console.error("Error exporting objects:", error);
      res.status(500).json({ message: "Failed to export objects" });
    }
  });

  app.get('/api/export/rooms', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const rooms = await storage.getRoomsByUserId(userId);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="rooms.json"');
      res.json(rooms);
    } catch (error) {
      console.error("Error exporting rooms:", error);
      res.status(500).json({ message: "Failed to export rooms" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
