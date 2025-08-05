import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ObjectDetector from "@/components/detection/object-detector";
import { 
  ArrowLeft, 
  Camera, 
  Settings,
  RotateCcw,
  Zap,
  Images,
  Save,
  RotateCw
} from "lucide-react";

type DetectionState = 'camera' | 'processing' | 'results';

interface DetectedObject {
  label: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  category: string;
  brand?: string;
}

interface DetectionResults {
  objects: DetectedObject[];
  colors: { dominant: string; palette: string[] };
  shapes: Array<{ type: string; confidence: number }>;
}

export default function ObjectDetection() {
  const [, setLocation] = useLocation();
  const [detectionState, setDetectionState] = useState<DetectionState>('camera');
  const [currentImage, setCurrentImage] = useState<string>('https://images.unsplash.com/photo-1554995207-c18c203602cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600');
  const [detectionResults, setDetectionResults] = useState<DetectionResults | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveDetectionMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest('POST', '/api/objects', formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Objects saved successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/objects"] });
      setLocation('/');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save detected objects. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCurrentImage(e.target?.result as string);
        startObjectAnalysis();
      };
      reader.readAsDataURL(file);
    }
  };

  const captureImage = () => {
    startObjectAnalysis();
  };

  const startObjectAnalysis = () => {
    setDetectionState('processing');
    
    // Simulate ML processing
    setTimeout(() => {
      const mockResults: DetectionResults = {
        objects: [
          {
            label: 'Sofa',
            confidence: 0.92,
            boundingBox: { x: 15, y: 30, width: 45, height: 35 },
            category: 'Furniture',
          },
          {
            label: 'Coffee Table',
            confidence: 0.87,
            boundingBox: { x: 25, y: 55, width: 30, height: 20 },
            category: 'Furniture',
          },
          {
            label: 'Television',
            confidence: 0.94,
            boundingBox: { x: 60, y: 20, width: 25, height: 25 },
            category: 'Electronics',
            brand: 'Samsung',
          },
        ],
        colors: {
          dominant: '#8B7355',
          palette: ['#8B7355', '#5D4E37', '#1A1A1A', '#F5F5DC'],
        },
        shapes: [
          { type: 'rectangle', confidence: 0.95 },
          { type: 'rectangle', confidence: 0.89 },
          { type: 'rectangle', confidence: 0.91 },
        ],
      };
      
      setDetectionResults(mockResults);
      setDetectionState('results');
    }, 2000);
  };

  const handleSaveDetection = () => {
    if (!detectionResults) return;

    const formData = new FormData();
    formData.append('objects', JSON.stringify(detectionResults.objects));
    formData.append('mlMetadata', JSON.stringify({
      processingTime: 2000,
      confidence: 0.91,
      timestamp: new Date().toISOString(),
    }));
    formData.append('gpsLocation', JSON.stringify({
      latitude: 24.4055,
      longitude: 81.8683,
      accuracy: 10,
      timestamp: new Date().toISOString(),
      address: "Sidhi, Madhya Pradesh, India"
    }));
    formData.append('colors', JSON.stringify(detectionResults.colors));
    formData.append('shapes', JSON.stringify(detectionResults.shapes));

    // Convert image to blob
    if (currentImage.startsWith('data:')) {
      const base64Data = currentImage.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      formData.append('image', blob, 'detected-objects.jpg');
    }

    saveDetectionMutation.mutate(formData);
  };

  const retakePhoto = () => {
    setDetectionState('camera');
    setDetectionResults(null);
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-white border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
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
        <Button variant="ghost" size="icon" className="rounded-lg">
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      {/* Camera Interface */}
      <div className="relative">
        <div className="detection-preview bg-black aspect-[4/3] relative overflow-hidden">
          <img 
            src={currentImage} 
            alt="Camera preview" 
            className="w-full h-full object-cover"
          />
          
          {/* Detection Overlays */}
          {detectionState === 'results' && detectionResults && (
            <div className="absolute inset-0">
              {detectionResults.objects.map((obj, index) => (
                <div
                  key={index}
                  className="detection-box"
                  style={{
                    top: `${obj.boundingBox.y}%`,
                    left: `${obj.boundingBox.x}%`,
                    width: `${obj.boundingBox.width}%`,
                    height: `${obj.boundingBox.height}%`,
                  }}
                >
                  <div className="absolute -top-6 left-0 bg-accent text-accent-foreground px-2 py-1 rounded text-xs font-medium">
                    {obj.label} ({Math.round(obj.confidence * 100)}%)
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Scanning Line */}
          {detectionState === 'processing' && (
            <div className="scanning-line"></div>
          )}

          {/* Camera Controls */}
          {detectionState === 'camera' && (
            <>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <Button
                  onClick={captureImage}
                  size="icon"
                  className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 hover:border-primary"
                >
                  <div className="w-12 h-12 bg-primary rounded-full"></div>
                </Button>
              </div>

              <div className="absolute top-4 right-4 space-y-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="w-10 h-10 rounded-full bg-black/50 border-none hover:bg-black/70"
                >
                  <RotateCw className="w-4 h-4 text-white" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => setIsFlashOn(!isFlashOn)}
                  className={`w-10 h-10 rounded-full border-none ${
                    isFlashOn ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-black/50 hover:bg-black/70'
                  }`}
                >
                  <Zap className={`w-4 h-4 ${isFlashOn ? 'text-black' : 'text-white'}`} />
                </Button>
              </div>

              <div className="absolute bottom-4 left-4">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-12 h-12 rounded-xl bg-black/50 border-none hover:bg-black/70"
                >
                  <Images className="w-5 h-5 text-white" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />

      {/* Detection Results */}
      {detectionState === 'results' && detectionResults && (
        <div className="p-6 space-y-4 slide-up">
          <h3 className="text-lg font-semibold text-foreground">Detection Results</h3>
          
          <div className="space-y-3">
            {detectionResults.objects.map((obj, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      obj.category === 'Furniture' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      <Camera className={`w-5 h-5 ${
                        obj.category === 'Furniture' ? 'text-primary' : 'text-accent'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{obj.label}</h4>
                      <div className="text-sm text-muted-foreground space-y-1 mt-1">
                        <p><span className="font-medium">Category:</span> {obj.category}</p>
                        {obj.brand && <p><span className="font-medium">Brand:</span> {obj.brand}</p>}
                        <p><span className="font-medium">Confidence:</span> {Math.round(obj.confidence * 100)}%</p>
                        <p><span className="font-medium">Colors:</span> {detectionResults.colors.palette.slice(0, 2).join(', ')}</p>
                        <p><span className="font-medium">Location:</span> 24.4055°N, 81.8683°E</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex space-x-3">
            <Button 
              onClick={handleSaveDetection}
              disabled={saveDetectionMutation.isPending}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveDetectionMutation.isPending ? 'Saving...' : 'Save Objects'}
            </Button>
            <Button 
              onClick={retakePhoto}
              variant="outline"
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake
            </Button>
          </div>
        </div>
      )}

      {/* Processing State */}
      {detectionState === 'processing' && (
        <div className="p-6 text-center">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6 text-primary animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Analyzing Objects</h3>
              <p className="text-muted-foreground">AI is processing your image...</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {detectionState === 'camera' && (
        <div className="p-6 space-y-3">
          <Button 
            onClick={startObjectAnalysis}
            className="w-full bg-accent hover:bg-accent/90"
            size="lg"
          >
            Start Real-time Detection
          </Button>
          <Button 
            variant="outline"
            className="w-full"
            size="lg"
            onClick={() => toast({ title: "Coming Soon", description: "Batch upload feature will be available soon!" })}
          >
            Batch Upload Images
          </Button>
        </div>
      )}
    </div>
  );
}
