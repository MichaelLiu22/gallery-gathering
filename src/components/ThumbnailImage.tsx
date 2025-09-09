import React, { useState } from 'react';

interface ThumbnailImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export const ThumbnailImage: React.FC<ThumbnailImageProps> = ({
  src,
  alt,
  className = '',
  onClick
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div 
      className={`relative overflow-hidden bg-muted ${className}`}
      onClick={onClick}
    >
      {/* Main image */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setImageLoaded(true)}
      />
      
      {/* Loading placeholder */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};