import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePhotos, SortOrder, PhotoFilter } from '@/hooks/usePhotos';
import { useFriends } from '@/hooks/useFriends';
import { useLikes } from '@/hooks/useLikes';
import { useProfile } from '@/hooks/useProfiles';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Heart, 
  MessageCircle, 
  TrendingUp, 
  Upload, 
  User, 
  LogOut,
  Camera,
  CalendarDays,
  Eye,
  Images,
  ChevronLeft,
  ChevronRight,
  ZoomIn
} from 'lucide-react';
import UploadPhotoDialog from './UploadPhotoDialog';
import PhotoComments from './PhotoComments';
import PhotoRating from './PhotoRating';
import SortFilter from './SortFilter';
import ImageZoom from './ImageZoom';

export default function PhotoGrid() {
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');
  const [filter, setFilter] = useState<PhotoFilter>('all');

  const { user, signOut } = useAuth();
  const { data: userProfile } = useProfile();
  const { data: friends } = useFriends();
  const { data: photos, isLoading, error } = usePhotos(sortOrder, filter);

  const filteredPhotos = photos || [];

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const handleProfileClick = () => {
    window.location.href = '/profile';
  };

  const handleAuthClick = () => {
    window.location.href = '/auth';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载作品中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">加载失败</h2>
          <p className="text-muted-foreground">请刷新页面重试</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
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
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  欢迎, {userProfile?.display_name || user.email}
                </span>
                <Button variant="ghost" size="sm" onClick={handleProfileClick}>
                  <User className="h-4 w-4 mr-2" />
                  个人资料
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setUploadDialogOpen(true)}
                  className="bg-gradient-to-r from-primary to-accent text-background hover:opacity-90 transition-all"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  发布作品
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  退出
                </Button>
              </>
            ) : (
              <Button 
                variant="default" 
                size="sm"
                onClick={handleAuthClick}
                className="bg-gradient-to-r from-primary to-accent"
              >
                登录/注册
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <SortFilter 
          sortOrder={sortOrder}
          filter={filter}
          onSortChange={setSortOrder}
          onFilterChange={setFilter}
        />

        {filteredPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Camera className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">暂无作品</h3>
            <p className="text-muted-foreground mb-6">还没有人分享作品</p>
            {user && (
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                发布首个作品
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPhotos.map((photo) => (
              <PhotoCard 
                key={photo.id} 
                photo={photo} 
                onClick={() => {
                  setSelectedPhoto(photo);
                  setCurrentImageIndex(0);
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={(open) => {
          if (!open) {
            setSelectedPhoto(null);
            setCurrentImageIndex(0);
          }
        }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPhoto.title}</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Image Gallery */}
              <div className="relative">
                <img
                  src={selectedPhoto.image_urls ? selectedPhoto.image_urls[currentImageIndex] : selectedPhoto.image_url}
                  alt={selectedPhoto.title}
                  className="w-full h-64 object-cover rounded-lg cursor-pointer"
                  onClick={() => setShowImageZoom(true)}
                />
                
                {/* Zoom button */}
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setShowImageZoom(true)}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                
                {/* Navigation for multiple images */}
                {selectedPhoto.image_urls && selectedPhoto.image_urls.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute left-2 top-1/2 -translate-y-1/2"
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === 0 ? selectedPhoto.image_urls!.length - 1 : prev - 1
                      )}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute right-12 top-1/2 -translate-y-1/2"
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === selectedPhoto.image_urls!.length - 1 ? 0 : prev + 1
                      )}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    
                    {/* Image counter */}
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                      {currentImageIndex + 1} / {selectedPhoto.image_urls.length}
                    </div>
                  </>
                )}
              </div>
              
              {/* Thumbnail navigation for multiple images */}
              {selectedPhoto.image_urls && selectedPhoto.image_urls.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {selectedPhoto.image_urls.map((url: string, index: number) => (
                    <img
                      key={index}
                      src={url}
                      alt={`${selectedPhoto.title} ${index + 1}`}
                      className={`h-16 w-16 object-cover rounded cursor-pointer flex-shrink-0 border-2 ${
                        index === currentImageIndex ? 'border-primary' : 'border-transparent'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              )}
              
              <PhotoActions photo={selectedPhoto} />
            </div>
            
            <div className="space-y-4">
              {selectedPhoto.description && (
                <div>
                  <h4 className="font-medium mb-2">作品描述</h4>
                  <p className="text-muted-foreground">{selectedPhoto.description}</p>
                </div>
              )}
              
              {selectedPhoto.camera_equipment && (
                <div>
                  <h4 className="font-medium mb-2">相机设备</h4>
                  <p className="text-muted-foreground">{selectedPhoto.camera_equipment}</p>
                </div>
              )}
              
              <Separator />
              
              <PhotoRating photoId={selectedPhoto.id} />
              
              <Separator />
              
              <PhotoComments photoId={selectedPhoto.id} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      )}

      {/* Image Zoom Modal */}
      {showImageZoom && selectedPhoto && (
        <ImageZoom
          src={selectedPhoto.image_urls ? selectedPhoto.image_urls[currentImageIndex] : selectedPhoto.image_url}
          alt={selectedPhoto.title}
          onClose={() => setShowImageZoom(false)}
        />
      )}

      <UploadPhotoDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
      />
    </div>
  );
}

// PhotoCard component
interface PhotoCardProps {
  photo: any;
  onClick: () => void;
}

const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onClick }) => {
  const imageUrls = photo.image_urls && photo.image_urls.length > 0 ? photo.image_urls : [photo.image_url];
  const isGallery = imageUrls.length > 1;
  
  return (
    <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-0">
        <div className="relative overflow-hidden rounded-t-lg">
          <img
            src={imageUrls[0]}
            alt={photo.title}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
            onClick={onClick}
          />
          
          {/* Gallery indicator */}
          {isGallery && (
            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <Images className="h-3 w-3" />
              {imageUrls.length}
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold mb-2 line-clamp-1">{photo.title}</h3>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={photo.profiles?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {photo.profiles?.display_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {photo.profiles?.display_name || '匿名用户'}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Heart className="h-4 w-4" />
                <span>{photo.likes_count || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="h-4 w-4" />
                <span>{photo.comments_count || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{photo.views_count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// PhotoActions component
interface PhotoActionsProps {
  photo: any;
}

function PhotoActions({ photo }: PhotoActionsProps) {
  const { user } = useAuth();
  const { likesCount, userHasLiked, toggleLike, isToggling } = useLikes(photo.id);

  const handleLike = () => {
    if (!user) return;
    toggleLike();
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          disabled={!user || isToggling}
          className={userHasLiked ? "text-red-500 hover:text-red-600" : ""}
        >
          <Heart 
            className={`h-4 w-4 mr-1 ${userHasLiked ? "fill-current" : ""}`} 
          />
          {likesCount}
        </Button>
        <div className="flex items-center space-x-1 text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm">评论</span>
        </div>
      </div>
      <div className="flex items-center space-x-1 text-muted-foreground">
        <Eye className="h-4 w-4" />
        <span className="text-sm">{photo.views_count || 0} 次浏览</span>
      </div>
    </div>
  );
}