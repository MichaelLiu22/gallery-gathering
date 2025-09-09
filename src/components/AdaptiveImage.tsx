import React, { useState, useEffect, useRef } from 'react';
import { extractDominantColors } from '@/lib/colorExtractor';

interface AdaptiveImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: number;
  enableBackgroundExtension?: boolean;
  onClick?: () => void;
}

export const AdaptiveImage: React.FC<AdaptiveImageProps> = ({
  src,
  alt,
  className = '',
  aspectRatio,
  enableBackgroundExtension = true,
  onClick
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [backgroundColors, setBackgroundColors] = useState<string[]>([]);
  const [calculatedAspectRatio, setCalculatedAspectRatio] = useState(aspectRatio || 1);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = async () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      setCalculatedAspectRatio(ratio);
      
      if (enableBackgroundExtension) {
        try {
          const colors = await extractDominantColors(img);
          setBackgroundColors(colors);
        } catch (error) {
          console.warn('Failed to extract colors:', error);
        }
      }
      
      setImageLoaded(true);
    };
    
    img.src = src;
  }, [src, enableBackgroundExtension]);

  const containerStyle = {
    aspectRatio: calculatedAspectRatio.toString(),
    background: enableBackgroundExtension && backgroundColors.length > 0 
      ? `linear-gradient(135deg, ${backgroundColors[0]}, ${backgroundColors[1] || backgroundColors[0]})`
      : 'hsl(var(--background))'
  };

  return (
    <div 
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={containerStyle}
      onClick={onClick}
    >
      {/* Background blur effect */}
      {enableBackgroundExtension && backgroundColors.length > 0 && (
        <div 
          className="absolute inset-0 opacity-30 blur-md scale-110"
          style={{
            background: `linear-gradient(135deg, ${backgroundColors[0]}, ${backgroundColors[1] || backgroundColors[0]})`
          }}
        />
      )}
      
      {/* Main image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`relative z-10 w-full h-full object-contain transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setImageLoaded(true)}
      />
      
      {/* Loading placeholder */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
        </div>
      )}
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};