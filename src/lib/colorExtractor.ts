export interface ColorInfo {
  color: string;
  count: number;
}

export const extractDominantColors = async (img: HTMLImageElement): Promise<string[]> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      resolve(['hsl(var(--muted))', 'hsl(var(--muted-foreground))']);
      return;
    }

    // Use a smaller canvas for performance
    const sampleSize = 50;
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    
    ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
    
    try {
      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
      const colors = extractColorsFromImageData(imageData);
      
      // Convert to HSL and filter out very dark/light colors
      const hslColors = colors
        .map(color => rgbToHsl(color.r, color.g, color.b))
        .filter(hsl => hsl.l > 0.1 && hsl.l < 0.9) // Filter out very dark/light
        .slice(0, 3); // Take top 3 colors
      
      if (hslColors.length === 0) {
        resolve(['hsl(var(--muted))', 'hsl(var(--muted-foreground))']);
        return;
      }
      
      const hslStrings = hslColors.map(hsl => 
        `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`
      );
      
      resolve(hslStrings);
    } catch (error) {
      console.warn('Error extracting colors:', error);
      resolve(['hsl(var(--muted))', 'hsl(var(--muted-foreground))']);
    }
  });
};

const extractColorsFromImageData = (imageData: ImageData): Array<{r: number, g: number, b: number}> => {
  const colorMap = new Map<string, number>();
  const data = imageData.data;
  
  // Sample every 4th pixel for performance
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // Skip transparent pixels
    if (a < 128) continue;
    
    // Group similar colors (reduce precision)
    const roundedR = Math.round(r / 32) * 32;
    const roundedG = Math.round(g / 32) * 32;
    const roundedB = Math.round(b / 32) * 32;
    
    const colorKey = `${roundedR},${roundedG},${roundedB}`;
    colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
  }
  
  // Sort by frequency and return top colors
  return Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([colorKey]) => {
      const [r, g, b] = colorKey.split(',').map(Number);
      return { r, g, b };
    });
};

const rgbToHsl = (r: number, g: number, b: number): {h: number, s: number, l: number} => {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h /= 6;
  }
  
  return {
    h: h * 360,
    s: s,
    l: l
  };
};