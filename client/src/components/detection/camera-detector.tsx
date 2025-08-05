import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Camera, 
  Square, 
  Play, 
  Pause, 
  RotateCcw,
  Zap,
  Palette,
  MapPin
} from "lucide-react";
import { detectObjects } from "@/lib/tensorflow";
import { extractDominantColor } from "@/lib/colorExtraction";

interface DetectedObject {
  class: string;
  confidence: number;
  bbox: number[];
  color?: string;
  shape?: string;
}

interface CameraDetectorProps {
  onObjectsDetected: (objects: DetectedObject[], imageData: string) => void;
  isActive: boolean;
  onToggle: () => void;
}

export default function CameraDetector({ onObjectsDetected, isActive, onToggle }: CameraDetectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [permissionState, setPermissionState] = useState<'checking' | 'granted' | 'denied'>('checking');
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const initializeCamera = useCallback(async () => {
    try {
      setPermissionState('checking');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Use back camera on mobile
        },
        audio: false
      });

      setStream(mediaStream);
      setPermissionState('granted');
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      toast({
        title: "Camera Ready",
        description: "Live object detection is now available",
      });

    } catch (error) {
      console.error('Camera initialization error:', error);
      setPermissionState('denied');
      
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to use object detection",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setIsDetecting(false);
  }, [stream]);

  const captureFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  const performDetection = useCallback(async () => {
    if (!videoRef.current || !isDetecting) return;

    try {
      const imageData = await captureFrame();
      if (!imageData) return;

      // Run TensorFlow.js object detection
      const rawObjects = await detectObjects(videoRef.current);
      
      // Enhance objects with additional analysis
      const enhancedObjects = await Promise.all(
        rawObjects.map(async (obj: any) => {
          const enhanced: DetectedObject = {
            ...obj,
            color: await extractDominantColor(imageData, obj.bbox),
            shape: analyzeShape(obj.bbox)
          };
          return enhanced;
        })
      );

      setDetectedObjects(enhancedObjects);

      // Notify parent component with results
      if (enhancedObjects.length > 0) {
        onObjectsDetected(enhancedObjects, imageData);
      }

    } catch (error) {
      console.error('Detection error:', error);
    }
  }, [isDetecting, captureFrame, onObjectsDetected]);

  const analyzeShape = (bbox: number[]): string => {
    const [x, y, width, height] = bbox;
    const aspectRatio = width / height;
    
    if (aspectRatio > 1.2) return 'rectangular';
    if (aspectRatio < 0.8) return 'tall';
    return 'square';
  };

  const startDetection = useCallback(() => {
    setIsDetecting(true);
    
    // Run detection every 2 seconds to balance performance and accuracy
    detectionIntervalRef.current = setInterval(performDetection, 2000);
    
    toast({
      title: "Detection Started",
      description: "AI is now analyzing your camera feed",
    });
  }, [performDetection, toast]);

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    setDetectedObjects([]);
  }, []);

  useEffect(() => {
    if (isActive && permissionState === 'checking') {
      initializeCamera();
    } else if (!isActive) {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive, permissionState, initializeCamera, stopCamera]);

  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  if (permissionState === 'checking') {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6 text-center">
          <Camera className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Requesting Camera Access
          </h3>
          <p className="text-blue-700">
            Please allow camera access to enable object detection
          </p>
        </CardContent>
      </Card>
    );
  }

  if (permissionState === 'denied') {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6 text-center">
          <Camera className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Camera Access Required
          </h3>
          <p className="text-red-700 mb-4">
            Object detection requires camera access to function
          </p>
          <Button onClick={initializeCamera} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Camera Feed */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-0">
          <div className="relative aspect-video bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Detection Overlay */}
            {isDetecting && detectedObjects.length > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                {detectedObjects.map((obj, index) => (
                  <div
                    key={index}
                    className="absolute border-2 border-green-400 bg-green-400/20"
                    style={{
                      left: `${obj.bbox[0]}%`,
                      top: `${obj.bbox[1]}%`,
                      width: `${obj.bbox[2]}%`,
                      height: `${obj.bbox[3]}%`,
                    }}
                  >
                    <div className="absolute -top-6 left-0 bg-green-400 text-white text-xs px-2 py-1 rounded">
                      {obj.class} ({Math.round(obj.confidence * 100)}%)
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Detection Status Indicator */}
            {isDetecting && (
              <div className="absolute top-4 right-4 bg-red-500 w-3 h-3 rounded-full animate-pulse"></div>
            )}
          </div>

          {/* Camera Controls */}
          <div className="p-4 bg-white border-t">
            <div className="flex justify-center space-x-3">
              <Button
                onClick={isDetecting ? stopDetection : startDetection}
                variant={isDetecting ? "destructive" : "default"}
                size="lg"
                className="flex-1 max-w-48"
              >
                {isDetecting ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Stop Detection
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Detection
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detection Results */}
      {detectedObjects.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                Live Detection Results
              </h3>
              <Badge variant="secondary">
                {detectedObjects.length} objects
              </Badge>
            </div>
            
            <div className="space-y-3">
              {detectedObjects.map((obj, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Square className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground capitalize">
                        {obj.class}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{Math.round(obj.confidence * 100)}% confidence</span>
                        {obj.color && (
                          <span className="flex items-center">
                            <Palette className="w-3 h-3 mr-1" />
                            {obj.color}
                          </span>
                        )}
                        {obj.shape && (
                          <span className="flex items-center">
                            <Square className="w-3 h-3 mr-1" />
                            {obj.shape}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Badge 
                    variant={obj.confidence > 0.8 ? "default" : "secondary"}
                    className="ml-2"
                  >
                    {obj.confidence > 0.8 ? "High" : "Medium"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden canvas for image processing */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />
    </div>
  );
}