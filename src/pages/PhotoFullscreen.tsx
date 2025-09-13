import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

export default function PhotoFullscreen() {
  const [searchParams] = useSearchParams();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const src = searchParams.get('src');
  const alt = searchParams.get('alt') || '图片';

  useEffect(() => {
    // 设置页面标题
    document.title = `${alt} - 摄影分享小营地`;
    
    // 阻止默认的键盘快捷键
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.close();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleReset();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [alt]);

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

  const handleDownload = () => {
    if (!src) return;
    const link = document.createElement('a');
    link.href = src;
    link.download = alt || 'photo';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 如果没有图片源，显示错误
  if (!src) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">图片未找到</h1>
          <Button onClick={() => window.close()}>关闭窗口</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-4 bg-card/50 backdrop-blur-sm border-b">
        <h1 className="text-lg font-medium truncate max-w-md">{alt}</h1>
        
        <div className="flex items-center gap-2">
          {/* 缩放比例显示 */}
          <div className="bg-muted px-3 py-1 rounded text-sm">
            {Math.round(scale * 100)}%
          </div>
          
          <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={scale <= 0.5}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={scale >= 5}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => window.close()}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 图片展示区域 - 移动端优化 */}
      <div 
        className="flex-1 flex items-center justify-center overflow-hidden bg-transparent"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-none max-h-none transition-transform duration-100 select-none"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
            maxWidth: '100vw',
            maxHeight: '100vh',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
          }}
          draggable={false}
          onClick={(e) => {
            e.stopPropagation();
            if (scale === 1) {
              handleZoomIn();
            }
          }}
        />
      </div>

      {/* 底部说明 - 移除边框 */}
      <div className="p-4 bg-card/30 backdrop-blur-sm">
        <div className="text-center text-sm text-muted-foreground">
          滚轮缩放 • 拖拽移动 • 点击图片放大 • ESC或点击X关闭
        </div>
      </div>
    </div>
  );
}