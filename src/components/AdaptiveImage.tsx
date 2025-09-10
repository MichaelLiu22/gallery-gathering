import React, { useState, useEffect, useRef } from 'react';
import { extractDominantColors } from '@/lib/colorExtractor';

interface AdaptiveImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: number;
  enableBackgroundExtension?: boolean;
  isThumbnail?: boolean;
  onClick?: () => void;
}

export const AdaptiveImage: React.FC<AdaptiveImageProps> = ({
  src,
  alt,
  className = '',
  aspectRatio,
  enableBackgroundExtension = true,
  isThumbnail = false,
  onClick
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [backgroundColors, setBackgroundColors] = useState<{ dominant: string; secondary: string }>({ dominant: '', secondary: '' });
  const [calculatedAspectRatio, setCalculatedAspectRatio] = useState(aspectRatio || 4/3);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = async () => {
      // Skip dynamic aspect ratio calculation for thumbnails
      if (!isThumbnail) {
        const ratio = img.naturalWidth / img.naturalHeight;
        setCalculatedAspectRatio(ratio);
      }
      
      if (enableBackgroundExtension && !isThumbnail) {
        try {
          const colors = await extractDominantColors(img);
          if (colors && colors.length >= 2) {
            setBackgroundColors({
              dominant: colors[0],
              secondary: colors[1]
            });
          }
        } catch (error) {
          console.warn('Failed to extract colors:', error);
        }
      }
      
      setImageLoaded(true);
    };
    
    img.src = src;
  }, [src, enableBackgroundExtension, isThumbnail]);

  // Mobile-optimized container style - transparent background to prevent black frames
  const containerStyle = {
    aspectRatio: `${calculatedAspectRatio}`,
    background: enableBackgroundExtension && backgroundColors.dominant && !isThumbnail 
      ? `linear-gradient(135deg, ${backgroundColors.dominant}, ${backgroundColors.secondary})` 
      : 'transparent'
  };

  return (
    <div 
      className={`relative bg-transparent ${className}`} 
      style={containerStyle}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onClick={onClick}
        className={`w-full h-auto object-contain bg-transparent transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        } ${onClick ? 'cursor-pointer' : ''}`}
        onLoad={handleImageLoad}
      />
      
      {!imageLoaded && (
        <div className="absolute inset-0 bg-transparent animate-pulse rounded" />
      )}
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};