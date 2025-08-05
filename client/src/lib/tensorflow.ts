import * as tf from '@tensorflow/tfjs';

// Common object labels from COCO dataset
const COCO_CLASSES = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck',
  'boat', 'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench',
  'bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra',
  'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
  'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove',
  'skateboard', 'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup',
  'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich', 'orange',
  'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
  'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
  'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink',
  'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier',
  'toothbrush'
];

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
}

export class ObjectDetector {
  private model: tf.GraphModel | null = null;
  private isLoaded = false;

  async loadModel(): Promise<void> {
    try {
      // Try to load a real model first
      this.model = await tf.loadGraphModel('/models/ssd_mobilenet_v2/model.json');
      this.isLoaded = true;
    } catch (error) {
      console.warn('Failed to load TensorFlow model, using mock detection:', error);
      // Fallback to mock detection
      this.isLoaded = true;
    }
  }

  async detectObjects(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<DetectionResult[]> {
    if (!this.isLoaded) {
      throw new Error('Model not loaded');
    }

    // For demo purposes, return mock detections
    // In a real implementation, this would use the actual model
    return this.getMockDetections();
  }

  private getMockDetections(): DetectionResult[] {
    // Simulate realistic object detection results
    const mockObjects = [
      {
        label: 'couch',
        confidence: 0.92,
        boundingBox: { x: 15, y: 30, width: 45, height: 35 },
        category: 'Furniture',
      },
      {
        label: 'dining table',
        confidence: 0.87,
        boundingBox: { x: 25, y: 55, width: 30, height: 20 },
        category: 'Furniture',
      },
      {
        label: 'tv',
        confidence: 0.94,
        boundingBox: { x: 60, y: 20, width: 25, height: 25 },
        category: 'Electronics',
        brand: 'Samsung',
      },
      {
        label: 'chair',
        confidence: 0.78,
        boundingBox: { x: 70, y: 45, width: 15, height: 25 },
        category: 'Furniture',
      },
      {
        label: 'potted plant',
        confidence: 0.65,
        boundingBox: { x: 5, y: 70, width: 10, height: 20 },
        category: 'Decor',
      },
    ];

    // Randomly select 2-4 objects to return
    const numObjects = Math.floor(Math.random() * 3) + 2;
    return mockObjects.slice(0, numObjects);
  }

  isModelLoaded(): boolean {
    return this.isLoaded;
  }

  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.isLoaded = false;
    }
  }
}

// Global detector instance
export const objectDetector = new ObjectDetector();

// Export function for compatibility with camera detector
export const detectObjects = async (videoElement: HTMLVideoElement): Promise<Array<{class: string, confidence: number, bbox: number[]}>> => {
  const results = await objectDetector.detectObjects(videoElement);
  return results.map(result => ({
    class: result.label,
    confidence: result.confidence,
    bbox: [
      result.boundingBox.x,
      result.boundingBox.y,
      result.boundingBox.width,
      result.boundingBox.height
    ]
  }));
};

// Initialize TensorFlow.js
tf.ready().then(() => {
  console.log('TensorFlow.js is ready');
  objectDetector.loadModel().catch(console.error);
});
