import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Heart, Eye, Upload, LogOut, LogIn } from 'lucide-react';
import { usePhotos, Photo } from '@/hooks/usePhotos';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function PhotoGrid() {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const { data: photos, isLoading, error } = usePhotos();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "已退出登录",
      description: "您已成功退出账户",
    });
  };

  const handleAuthClick = () => {
    navigate('/auth');
  };

  // Helper function to parse exposure settings
  const getExposureInfo = (settings: any) => {
    if (!settings) return null;
    
    try {
      const parsed = typeof settings === 'string' ? JSON.parse(settings) : settings;
      return {
        iso: parsed.iso || 'N/A',
        aperture: parsed.aperture || 'N/A',
        shutter: parsed.shutter || 'N/A',
        focal: parsed.focal || 'N/A'
      };
    } catch {
      return {
        iso: 'N/A',
        aperture: 'N/A', 
        shutter: 'N/A',
        focal: 'N/A'
      };
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">加载失败</h2>
          <p className="text-muted-foreground">请稍后重试</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Camera className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              摄影作品集
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  欢迎, {user.email}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-gradient-to-r from-primary to-accent text-background hover:opacity-90 transition-all"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  上传作品
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  退出
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={handleAuthClick}>
                <LogIn className="h-4 w-4 mr-2" />
                登录
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Photo Grid */}
      <main className="container mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">加载中...</p>
            </div>
          </div>
        ) : !photos || photos.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">暂无作品</h3>
            <p className="text-muted-foreground mb-6">
              {user ? '开始上传您的第一张摄影作品吧！' : '请先登录查看摄影作品'}
            </p>
            {!user && (
              <Button onClick={handleAuthClick}>
                <LogIn className="h-4 w-4 mr-2" />
                立即登录
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="bg-card rounded-lg overflow-hidden transition-all duration-300 hover:shadow-glow hover:scale-[1.02]">
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={photo.image_url}
                      alt={photo.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white font-semibold text-lg mb-1">{photo.title}</h3>
                        <p className="text-white/80 text-sm">
                          {photo.profiles?.display_name || '匿名摄影师'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Heart className="h-4 w-4" />
                          <span>{photo.likes_count}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>{photo.views_count}</span>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {photo.camera_equipment || '未知设备'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="bg-card rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={selectedPhoto.image_url}
                alt={selectedPhoto.title}
                className="w-full h-64 md:h-96 object-cover rounded-t-xl"
              />
              <Button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
              >
                ×
              </Button>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-2xl font-bold mb-2">{selectedPhoto.title}</h2>
                  <p className="text-muted-foreground mb-4">
                    {selectedPhoto.description || '暂无描述'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    摄影师：{selectedPhoto.profiles?.display_name || '匿名摄影师'}
                  </p>
                </div>
                <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4" />
                    <span>{selectedPhoto.likes_count} 赞</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span>{selectedPhoto.views_count} 浏览</span>
                  </div>
                </div>
              </div>

              {/* Camera Settings */}
              <div className="border-t border-border pt-4">
                <h3 className="text-lg font-semibold mb-3">拍摄参数</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">相机</p>
                    <p className="font-medium">{selectedPhoto.camera_equipment || '未知'}</p>
                  </div>
                  {(() => {
                    const exposure = getExposureInfo(selectedPhoto.exposure_settings);
                    if (!exposure) return null;
                    
                    return (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">ISO</p>
                          <p className="font-medium">{exposure.iso}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">光圈</p>
                          <p className="font-medium">{exposure.aperture}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">快门</p>
                          <p className="font-medium">{exposure.shutter}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">焦距</p>
                          <p className="font-medium">{exposure.focal}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}