export interface ColorPalette {
  dominant: string;
  palette: string[];
  names: string[];
}

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

// Color name mapping for common colors
const COLOR_NAMES: Record<string, string> = {
  '#FF0000': 'Red',
  '#00FF00': 'Green',
  '#0000FF': 'Blue',
  '#FFFF00': 'Yellow',
  '#FF00FF': 'Magenta',
  '#00FFFF': 'Cyan',
  '#000000': 'Black',
  '#FFFFFF': 'White',
  '#808080': 'Gray',
  '#FFA500': 'Orange',
  '#800080': 'Purple',
  '#FFC0CB': 'Pink',
  '#A52A2A': 'Brown',
  '#F5F5DC': 'Beige',
  '#000080': 'Navy',
  '#008000': 'Dark Green',
  '#800000': 'Maroon',
  '#808000': 'Olive',
  '#40E0D0': 'Turquoise',
  '#EE82EE': 'Violet',
};

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('')}`.toUpperCase();
}

export function hexToRgb(hex: string): RGBColor | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function getColorDistance(color1: RGBColor, color2: RGBColor): number {
  const dr = color1.r - color2.r;
  const dg = color1.g - color2.g;
  const db = color1.b - color2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export function getClosestColorName(hex: string): string {
  const inputColor = hexToRgb(hex);
  if (!inputColor) return 'Unknown';

  let closestName = 'Unknown';
  let minDistance = Infinity;

  for (const [colorHex, name] of Object.entries(COLOR_NAMES)) {
    const namedColor = hexToRgb(colorHex);
    if (namedColor) {
      const distance = getColorDistance(inputColor, namedColor);
      if (distance < minDistance) {
        minDistance = distance;
        closestName = name;
      }
    }
  }

  return closestName;
}

// Extract dominant color from image data with bounding box
export const extractDominantColor = async (imageDataUrl: string, bbox: number[]): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve('gray');
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Extract region based on bounding box
      const x = Math.floor((bbox[0] / 100) * img.width);
      const y = Math.floor((bbox[1] / 100) * img.height);
      const width = Math.floor((bbox[2] / 100) * img.width);
      const height = Math.floor((bbox[3] / 100) * img.height);
      
      try {
        const imageData = ctx.getImageData(x, y, width, height);
        const colorCounts = new Map<string, number>();
        
        // Sample pixels and count colors
        for (let i = 0; i < imageData.data.length; i += 40) {
          const r = imageData.data[i];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];
          const alpha = imageData.data[i + 3];
          
          if (alpha < 128) continue;
          
          const hex = rgbToHex(r, g, b);
          colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
        }
        
        // Get most common color
        const sortedColors = Array.from(colorCounts.entries())
          .sort(([,a], [,b]) => b - a);
        
        const dominantHex = sortedColors[0]?.[0] || '#808080';
        const colorName = getClosestColorName(dominantHex);
        resolve(colorName.toLowerCase());
      } catch (error) {
        resolve('gray');
      }
    };
    img.src = imageDataUrl;
  });
};

export function extractColorsFromImage(imageElement: HTMLImageElement): Promise<ColorPalette> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      resolve({
        dominant: '#808080',
        palette: ['#808080'],
        names: ['Gray'],
      });
      return;
    }

    // Resize image for faster processing
    const maxSize = 100;
    const scale = Math.min(maxSize / imageElement.width, maxSize / imageElement.height);
    canvas.width = imageElement.width * scale;
    canvas.height = imageElement.height * scale;

    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const colors = extractColorPalette(imageData);
      resolve(colors);
    } catch (error) {
      console.error('Error extracting colors:', error);
      // Return mock colors for demo
      resolve({
        dominant: '#8B7355',
        palette: ['#8B7355', '#5D4E37', '#1A1A1A', '#F5F5DC'],
        names: ['Brown', 'Dark Brown', 'Black', 'Beige'],
      });
    }
  });
}

function extractColorPalette(imageData: ImageData): ColorPalette {
  const colors: Map<string, number> = new Map();
  const data = imageData.data;

  // Sample every 4th pixel for performance
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const alpha = data[i + 3];

    // Skip transparent pixels
    if (alpha < 128) continue;

    // Quantize colors to reduce palette size
    const quantizedR = Math.round(r / 32) * 32;
    const quantizedG = Math.round(g / 32) * 32;
    const quantizedB = Math.round(b / 32) * 32;

    const hex = rgbToHex(quantizedR, quantizedG, quantizedB);
    colors.set(hex, (colors.get(hex) || 0) + 1);
  }

  // Sort colors by frequency and take top 5
  const sortedColors = Array.from(colors.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([color]) => color);

  const palette = sortedColors.length > 0 ? sortedColors : ['#808080'];
  const dominant = palette[0];
  const names = palette.map(getClosestColorName);

  return {
    dominant,
    palette,
    names,
  };
}

// Mock color extraction for demo purposes
export function getMockColorPalette(): ColorPalette {
  const mockPalettes = [
    {
      dominant: '#8B7355',
      palette: ['#8B7355', '#5D4E37', '#1A1A1A', '#F5F5DC'],
      names: ['Brown', 'Dark Brown', 'Black', 'Beige'],
    },
    {
      dominant: '#3B82F6',
      palette: ['#3B82F6', '#1E40AF', '#FFFFFF', '#E5E7EB'],
      names: ['Blue', 'Dark Blue', 'White', 'Light Gray'],
    },
    {
      dominant: '#EF4444',
      palette: ['#EF4444', '#991B1B', '#000000', '#F3F4F6'],
      names: ['Red', 'Dark Red', 'Black', 'Light Gray'],
    },
    {
      dominant: '#10B981',
      palette: ['#10B981', '#047857', '#374151', '#F9FAFB'],
      names: ['Green', 'Dark Green', 'Dark Gray', 'Off White'],
    },
  ];

  return mockPalettes[Math.floor(Math.random() * mockPalettes.length)];
}
