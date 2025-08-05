import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Camera, 
  Upload, 
  Zap, 
  MapPin,
  Palette,
  Square,
  Save,
  Video,
  Image as ImageIcon,
  Sparkles,
  Clock,
  Target
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import CameraDetector from "@/components/detection/camera-detector";
import { advancedDetector, type AdvancedDetectionResult } from "@/lib/advancedDetection";

interface DetectedObject {
  class: string;
  confidence: number;
  bbox: number[];
  color?: string;
  shape?: string;
}

export default function ObjectDetection() {
  const [, setLocation] = useLocation();
  const [detectionMode, setDetectionMode] = useState<'camera' | 'upload'>('camera');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadResults, setUploadResults] = useState<AdvancedDetectionResult[]>([]);
  const [roomId, setRoomId] = useState('');
  const [notes, setNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch rooms for dropdown
  const { data: rooms = [] } = useQuery({
    queryKey: ["/api/rooms"],
  });

  // Save detection results mutation
  const saveDetectionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/detected-objects', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Objects saved successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/detected-objects"] });
      
      // Reset form
      setDetectedObjects([]);
      setCapturedImage(null);
      setUploadedImage(null);
      setUploadResults([]);
      setRoomId('');
      setNotes('');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save objects. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCameraToggle = () => {
    setIsCameraActive(!isCameraActive);
    if (isCameraActive) {
      setDetectedObjects([]);
      setCapturedImage(null);
    }
  };

  const handleObjectsDetected = (objects: DetectedObject[], imageData: string) => {
    setDetectedObjects(objects);
    setCapturedImage(imageData);
    
    toast({
      title: "Objects Detected",
      description: `Found ${objects.length} objects in the scene`,
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageDataUrl = e.target?.result as string;
      setUploadedImage(imageDataUrl);
      
      try {
        // Create image element for detection
        const img = new Image();
        img.onload = async () => {
          const results = await advancedDetector.detectObjects(img);
          setUploadResults(results);
          setIsAnalyzing(false);
          
          toast({
            title: "Analysis Complete",
            description: `Detected ${results.length} objects in the image`,
          });
        };
        img.src = imageDataUrl;
      } catch (error) {
        setIsAnalyzing(false);
        toast({
          title: "Analysis Failed",
          description: "Could not analyze the uploaded image",
          variant: "destructive",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDetection = () => {
    const objectsToSave = detectionMode === 'camera' ? detectedObjects : uploadResults;
    const imageToSave = detectionMode === 'camera' ? capturedImage : uploadedImage;
    
    if (objectsToSave.length === 0) {
      toast({
        title: "No Objects",
        description: "No objects detected to save.",
        variant: "destructive",
      });
      return;
    }

    if (!roomId) {
      toast({
        title: "Select Room",
        description: "Please select a room for these objects.",
        variant: "destructive",
      });
      return;
    }

    // Prepare data for saving
    const detectionData = {
      roomId,
      objects: objectsToSave.map(obj => ({
        name: detectionMode === 'camera' ? obj.class : obj.label,
        category: detectionMode === 'camera' ? getCategoryFromClass(obj.class) : obj.category,
        confidence: obj.confidence,
        boundingBox: detectionMode === 'camera' ? obj.bbox : [
          obj.boundingBox.x,
          obj.boundingBox.y,
          obj.boundingBox.width,
          obj.boundingBox.height
        ],
        color: detectionMode === 'camera' ? obj.color : 'detected',
        shape: detectionMode === 'camera' ? obj.shape : 'rectangular',
        brand: detectionMode === 'camera' ? null : obj.brand || null,
      })),
      imageData: imageToSave,
      gpsLocation: {
        latitude: 24.4055,
        longitude: 81.8683,
        accuracy: 10,
        timestamp: new Date().toISOString(),
        address: "Sidhi, Madhya Pradesh, India"
      },
      detectionMethod: detectionMode,
      notes: notes || `Objects detected using ${detectionMode} on ${new Date().toLocaleDateString()}`
    };

    saveDetectionMutation.mutate(detectionData);
  };

  const getCategoryFromClass = (className: string): string => {
    const categories: Record<string, string> = {
      'chair': 'Furniture', 'couch': 'Furniture', 'bed': 'Furniture', 'dining table': 'Furniture',
      'tv': 'Electronics', 'laptop': 'Electronics', 'cell phone': 'Electronics', 'keyboard': 'Electronics',
      'book': 'Accessories', 'clock': 'Accessories', 'vase': 'Decor', 'potted plant': 'Decor',
      'person': 'People', 'bottle': 'Items', 'cup': 'Items', 'bowl': 'Items'
    };
    return categories[className] || 'Other';
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-white border-b border-border p-4 flex items-center space-x-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/')}
          className="rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold text-foreground">Object Detection</h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Detection Mode Tabs */}
        <Tabs value={detectionMode} onValueChange={(value) => setDetectionMode(value as 'camera' | 'upload')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="camera" className="flex items-center space-x-2">
              <Video className="w-4 h-4" />
              <span>Live Camera</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <ImageIcon className="w-4 h-4" />
              <span>Upload Image</span>
            </TabsTrigger>
          </TabsList>

          {/* Live Camera Detection */}
          <TabsContent value="camera" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="w-5 h-5" />
                  <span>Real-Time Object Detection</span>
                  {isCameraActive && (
                    <Badge variant="destructive" className="ml-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
                      LIVE
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <Button
                    onClick={handleCameraToggle}
                    variant={isCameraActive ? "destructive" : "default"}
                    size="lg"
                    className="w-full max-w-sm"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {isCameraActive ? 'Stop Camera' : 'Start Camera Detection'}
                  </Button>
                </div>

                {isCameraActive && (
                  <CameraDetector
                    onObjectsDetected={handleObjectsDetected}
                    isActive={isCameraActive}
                    onToggle={handleCameraToggle}
                  />
                )}

                {/* Live Detection Summary */}
                {detectedObjects.length > 0 && (
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-green-900 flex items-center">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Detection Summary
                        </h3>
                        <Badge variant="secondary">
                          {detectedObjects.length} objects
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {detectedObjects.slice(0, 4).map((obj, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white rounded">
                            <span className="capitalize font-medium">{obj.class}</span>
                            <span className="text-muted-foreground">
                              {Math.round(obj.confidence * 100)}%
                            </span>
                          </div>
                        ))}
                      </div>
                      {detectedObjects.length > 4 && (
                        <p className="text-sm text-green-700 mt-2">
                          +{detectedObjects.length - 4} more objects detected
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upload Image Detection */}
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Upload & Analyze</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Card 
                  className="border-2 border-dashed border-muted-foreground/25 hover:border-primary transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <CardContent className="p-8 text-center">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Click to upload an image for analysis</p>
                    <p className="text-sm text-muted-foreground mt-1">Supports JPG, PNG files</p>
                  </CardContent>
                </Card>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />

                {/* Uploaded Image Preview */}
                {uploadedImage && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <img 
                          src={uploadedImage} 
                          alt="Uploaded for analysis" 
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        
                        {isAnalyzing && (
                          <div className="flex items-center justify-center p-4">
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            <span className="text-muted-foreground">Analyzing image...</span>
                          </div>
                        )}

                        {uploadResults.length > 0 && !isAnalyzing && (
                          <div className="space-y-3">
                            <h3 className="font-semibold text-foreground flex items-center">
                              <Target className="w-4 h-4 mr-2" />
                              Detected Objects ({uploadResults.length})
                            </h3>
                            <div className="space-y-2">
                              {uploadResults.map((result, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                      <Square className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-foreground capitalize">
                                        {result.label}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {result.category} • {Math.round(result.confidence * 100)}% confidence
                                      </p>
                                    </div>
                                  </div>
                                  <Badge variant={result.confidence > 0.8 ? "default" : "secondary"}>
                                    {result.confidence > 0.8 ? "High" : "Medium"}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Detection Results */}
        {((detectionMode === 'camera' && detectedObjects.length > 0) || 
          (detectionMode === 'upload' && uploadResults.length > 0)) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Save className="w-5 h-5" />
                <span>Save Detection Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="room-select">Select Room *</Label>
                <Select value={roomId} onValueChange={setRoomId}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose a room for these objects" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room: any) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes about these objects..."
                  className="mt-2"
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleSaveDetection}
                disabled={saveDetectionMutation.isPending}
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveDetectionMutation.isPending ? 'Saving...' : 'Save Objects to Room'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}