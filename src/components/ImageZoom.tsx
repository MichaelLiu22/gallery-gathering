import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, X } from 'lucide-react';

interface ImageZoomProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export default function ImageZoom({ src, alt, onClose }: ImageZoomProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.5, Math.min(5, prev * delta)));
  };

  // Reset position when scale changes
  useEffect(() => {
    if (scale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          handleReset();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      {/* Controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomOut}
          disabled={scale <= 0.5}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomIn}
          disabled={scale >= 5}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleReset}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Scale indicator */}
      <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
        {Math.round(scale * 100)}%
      </div>

      {/* Image container */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className="max-w-none transition-transform duration-100 select-none"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          }}
          draggable={false}
        />
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded text-sm">
        滚轮缩放 • 拖拽移动 • ESC退出
      </div>
    </div>
  );
}