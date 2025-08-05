import {
  users,
  rooms,
  detectedObjects,
  searchCache,
  type User,
  type UpsertUser,
  type Room,
  type InsertRoom,
  type DetectedObject,
  type InsertDetectedObject,
  type SearchCriteria,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, inArray, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Room operations
  createRoom(room: InsertRoom): Promise<Room>;
  getRoomsByUserId(userId: string): Promise<Room[]>;
  getRoomById(id: string, userId: string): Promise<Room | undefined>;
  updateRoom(id: string, userId: string, data: Partial<InsertRoom>): Promise<Room | undefined>;
  deleteRoom(id: string, userId: string): Promise<boolean>;
  
  // Detected objects operations
  createDetectedObject(object: InsertDetectedObject): Promise<DetectedObject>;
  getDetectedObjectsByUserId(userId: string): Promise<DetectedObject[]>;
  getDetectedObjectById(id: string, userId: string): Promise<DetectedObject | undefined>;
  deleteDetectedObject(id: string, userId: string): Promise<boolean>;
  
  // Search operations
  searchObjects(userId: string, criteria: SearchCriteria): Promise<DetectedObject[]>;
  cacheSearchResults(queryHash: string, results: DetectedObject[]): Promise<void>;
  getCachedSearchResults(queryHash: string): Promise<DetectedObject[] | null>;
  
  // Statistics
  getUserStats(userId: string): Promise<{
    totalRooms: number;
    totalObjects: number;
    recentActivity: Array<{
      type: 'room' | 'object';
      name: string;
      timestamp: string;
    }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Room operations
  async createRoom(room: InsertRoom): Promise<Room> {
    const [newRoom] = await db.insert(rooms).values(room).returning();
    return newRoom;
  }

  async getRoomsByUserId(userId: string): Promise<Room[]> {
    return await db
      .select()
      .from(rooms)
      .where(eq(rooms.userId, userId))
      .orderBy(desc(rooms.createdAt));
  }

  async getRoomById(id: string, userId: string): Promise<Room | undefined> {
    const [room] = await db
      .select()
      .from(rooms)
      .where(and(eq(rooms.id, id), eq(rooms.userId, userId)));
    return room;
  }

  async updateRoom(id: string, userId: string, data: Partial<InsertRoom>): Promise<Room | undefined> {
    const [updatedRoom] = await db
      .update(rooms)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(rooms.id, id), eq(rooms.userId, userId)))
      .returning();
    return updatedRoom;
  }

  async deleteRoom(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(rooms)
      .where(and(eq(rooms.id, id), eq(rooms.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Detected objects operations
  async createDetectedObject(object: InsertDetectedObject): Promise<DetectedObject> {
    const [newObject] = await db.insert(detectedObjects).values(object).returning();
    return newObject;
  }

  async getDetectedObjectsByUserId(userId: string): Promise<DetectedObject[]> {
    return await db
      .select()
      .from(detectedObjects)
      .where(eq(detectedObjects.userId, userId))
      .orderBy(desc(detectedObjects.createdAt));
  }

  async getDetectedObjectById(id: string, userId: string): Promise<DetectedObject | undefined> {
    const [object] = await db
      .select()
      .from(detectedObjects)
      .where(and(eq(detectedObjects.id, id), eq(detectedObjects.userId, userId)));
    return object;
  }

  async deleteDetectedObject(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(detectedObjects)
      .where(and(eq(detectedObjects.id, id), eq(detectedObjects.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Search operations
  async searchObjects(userId: string, criteria: SearchCriteria): Promise<DetectedObject[]> {
    // Apply filters based on criteria
    const conditions = [eq(detectedObjects.userId, userId)];

    if (criteria.textQuery) {
      conditions.push(
        sql`${detectedObjects.objects}::text ILIKE ${`%${criteria.textQuery}%`}`
      );
    }

    if (criteria.category) {
      conditions.push(
        sql`${detectedObjects.objects}::jsonb @> ${JSON.stringify([{ category: criteria.category }])}`
      );
    }

    if (criteria.brand) {
      conditions.push(
        sql`${detectedObjects.objects}::jsonb @> ${JSON.stringify([{ brand: criteria.brand }])}`
      );
    }

    if (criteria.roomId) {
      conditions.push(eq(detectedObjects.roomId, criteria.roomId));
    }

    const query = db
      .select()
      .from(detectedObjects)
      .where(and(...conditions))
      .orderBy(desc(detectedObjects.createdAt))
      .limit(50);

    return await query;
  }

  async cacheSearchResults(queryHash: string, results: DetectedObject[]): Promise<void> {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db
      .insert(searchCache)
      .values({
        queryHash,
        results,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: searchCache.queryHash,
        set: {
          results,
          createdAt: new Date(),
          expiresAt,
        },
      });
  }

  async getCachedSearchResults(queryHash: string): Promise<DetectedObject[] | null> {
    const [cached] = await db
      .select()
      .from(searchCache)
      .where(and(
        eq(searchCache.queryHash, queryHash),
        sql`${searchCache.expiresAt} > NOW()`
      ));
    return cached ? cached.results as DetectedObject[] : null;
  }

  async getUserStats(userId: string): Promise<{
    totalRooms: number;
    totalObjects: number;
    recentActivity: Array<{
      type: 'room' | 'object';
      name: string;
      timestamp: string;
    }>;
  }> {
    const [roomCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(rooms)
      .where(eq(rooms.userId, userId));

    const [objectCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(detectedObjects)
      .where(eq(detectedObjects.userId, userId));

    const recentRooms = await db
      .select({
        name: rooms.name,
        createdAt: rooms.createdAt,
      })
      .from(rooms)
      .where(eq(rooms.userId, userId))
      .orderBy(desc(rooms.createdAt))
      .limit(3);

    const recentObjects = await db
      .select({
        objects: detectedObjects.objects,
        createdAt: detectedObjects.createdAt,
      })
      .from(detectedObjects)
      .where(eq(detectedObjects.userId, userId))
      .orderBy(desc(detectedObjects.createdAt))
      .limit(3);

    const recentActivity = [
      ...recentRooms.map(room => ({
        type: 'room' as const,
        name: room.name,
        timestamp: room.createdAt?.toISOString() || '',
      })),
      ...recentObjects.map(obj => ({
        type: 'object' as const,
        name: (obj.objects as any)?.[0]?.label || 'Unknown object',
        timestamp: obj.createdAt?.toISOString() || '',
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    return {
      totalRooms: roomCount.count,
      totalObjects: objectCount.count,
      recentActivity,
    };
  }
}

export const storage = new DatabaseStorage();
