import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Sparkles, 
  Target, 
  Palette, 
  Square, 
  Zap,
  Crown,
  Tag,
  Clock,
  MapPin
} from "lucide-react";

export interface DetectionResult {
  label: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  category: string;
  brand?: string;
  logo?: string;
  colors: string[];
  dominantColor: string;
  shape: string;
  size: 'small' | 'medium' | 'large';
  timestamp: number;
  type: 'object' | 'logo';
}

interface DetectionResultsProps {
  results: DetectionResult[];
  title?: string;
  showBoundingBoxes?: boolean;
  imageUrl?: string;
}

export default function DetectionResults({ 
  results, 
  title = "Detection Results",
  showBoundingBoxes = false,
  imageUrl 
}: DetectionResultsProps) {
  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  const getSizeIcon = (size: string) => {
    switch (size) {
      case 'small': return '🔸';
      case 'medium': return '🔶';
      case 'large': return '🔷';
      default: return '⚪';
    }
  };

  const getShapeIcon = (shape: string) => {
    switch (shape) {
      case 'rectangular': return '⬛';
      case 'circular': return '⚫';
      case 'triangular': return '🔺';
      case 'logo': return '🏷️';
      default: return '🔳';
    }
  };

  if (results.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No objects detected</p>
            <p className="text-sm">Upload an image or use the camera to start detecting</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Separate objects and logos
  const objects = results.filter(r => r.type === 'object');
  const logos = results.filter(r => r.type === 'logo');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-primary" />
          {title}
        </h3>
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          {results.length} detected
        </Badge>
      </div>

      {/* Detection Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">Objects</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {objects.length}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-800">Brands</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {logos.length}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Objects Section */}
      {objects.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-foreground flex items-center">
            <Target className="w-4 h-4 mr-2" />
            Objects ({objects.length})
          </h4>
          
          <div className="space-y-2">
            {objects.map((result, index) => (
              <Card key={index} className="border-l-4" style={{ borderLeftColor: result.dominantColor }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <h5 className="font-semibold text-lg capitalize">{result.label}</h5>
                      <Badge variant="outline" className="text-xs">
                        {formatConfidence(result.confidence)}
                      </Badge>
                    </div>
                    <Badge variant="secondary">
                      {result.category}
                    </Badge>
                  </div>

                  {/* Object Properties */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {/* Brand Information */}
                    {result.brand && (
                      <div className="flex items-center space-x-2">
                        <Crown className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium text-yellow-700">{result.brand}</span>
                      </div>
                    )}

                    {/* Size */}
                    <div className="flex items-center space-x-2">
                      <span>{getSizeIcon(result.size)}</span>
                      <span className="text-muted-foreground">
                        Size: <span className="font-medium capitalize">{result.size}</span>
                      </span>
                    </div>

                    {/* Shape */}
                    <div className="flex items-center space-x-2">
                      <span>{getShapeIcon(result.shape)}</span>
                      <span className="text-muted-foreground">
                        Shape: <span className="font-medium capitalize">{result.shape}</span>
                      </span>
                    </div>

                    {/* Dominant Color */}
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: result.dominantColor }}
                      />
                      <span className="text-muted-foreground">
                        Color: <span className="font-medium">{result.dominantColor}</span>
                      </span>
                    </div>
                  </div>

                  {/* Additional Colors */}
                  {result.colors.length > 1 && (
                    <div className="mt-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Palette className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Color Palette</span>
                      </div>
                      <div className="flex space-x-1">
                        {result.colors.slice(0, 5).map((color, colorIndex) => (
                          <div
                            key={colorIndex}
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bounding Box Info */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Square className="w-3 h-3 mr-1" />
                        Position: {Math.round(result.boundingBox.x)}%, {Math.round(result.boundingBox.y)}%
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Logos Section */}
      {logos.length > 0 && (
        <div className="space-y-3">
          <Separator />
          <h4 className="font-medium text-foreground flex items-center">
            <Tag className="w-4 h-4 mr-2" />
            Brand Logos ({logos.length})
          </h4>
          
          <div className="grid gap-2">
            {logos.map((logo, index) => (
              <Card key={index} className="border-green-200 bg-green-50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border">
                        🏷️
                      </div>
                      <div>
                        <h5 className="font-semibold text-green-800">{logo.brand}</h5>
                        <p className="text-xs text-green-600">
                          Logo detected with {formatConfidence(logo.confidence)} confidence
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {formatConfidence(logo.confidence)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Detection Statistics */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <h5 className="font-medium mb-3 flex items-center">
            <Zap className="w-4 h-4 mr-2" />
            Detection Summary
          </h5>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Detections:</span>
              <span className="font-semibold ml-2">{results.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Avg Confidence:</span>
              <span className="font-semibold ml-2">
                {formatConfidence(results.reduce((acc, r) => acc + r.confidence, 0) / results.length)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Categories:</span>
              <span className="font-semibold ml-2">
                {new Set(results.map(r => r.category)).size}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Brands Found:</span>
              <span className="font-semibold ml-2">
                {new Set(results.filter(r => r.brand).map(r => r.brand)).size}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}