import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePhotos, SortOrder, PhotoFilter, Photo, calculateHotness } from "@/hooks/usePhotos";
import { useFriends } from "@/hooks/useFriends";
import { useProfile } from "@/hooks/useProfiles";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Eye, Camera, User, Upload, LogOut, LogIn, Flame } from "lucide-react";
import UploadPhotoDialog from "./UploadPhotoDialog";
import PhotoComments from "./PhotoComments";
import SortFilter from "./SortFilter";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useLikes } from "@/hooks/useLikes";

export default function PhotoGrid() {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');
  const [filter, setFilter] = useState<PhotoFilter>('all');
  
  const { user, signOut, loading: authLoading } = useAuth();
  const { data: userProfile } = useProfile();
  const { data: friends } = useFriends();
  const { data: photos, isLoading, error } = usePhotos(sortOrder, filter);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Filter photos based on current filter and friend status
  const filteredPhotos = useMemo(() => {
    if (!photos) return [];

    let filtered = photos;

    // Apply filter
    switch (filter) {
      case 'friends':
        if (!user || !friends) return [];
        const friendIds = friends.map(f => f.friend_id);
        filtered = photos.filter(photo => friendIds.includes(photo.photographer_id));
        break;
      case 'mine':
        if (!user) return [];
        filtered = photos.filter(photo => photo.photographer_id === user.id);
        break;
      case 'all':
      default:
        // For authenticated users, prioritize friends' posts
        if (user && friends) {
          const friendIds = friends.map(f => f.friend_id);
          const friendPosts = photos.filter(photo => friendIds.includes(photo.photographer_id));
          const otherPosts = photos.filter(photo => !friendIds.includes(photo.photographer_id) && photo.photographer_id !== user.id);
          const myPosts = photos.filter(photo => photo.photographer_id === user.id);
          
          // Prioritize: my posts, friends' posts, then others
          filtered = [...myPosts, ...friendPosts, ...otherPosts];
        }
        break;
    }

    return filtered;
  }, [photos, filter, friends, user]);

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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">初始化中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Photos loading error:', error);
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/profile')}
                >
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
                  上传作品
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
                <LogIn className="h-4 w-4 mr-2" />
                登录/注册
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Sort and Filter Controls */}
        <SortFilter 
          sortOrder={sortOrder}
          filter={filter}
          onSortChange={setSortOrder}
          onFilterChange={setFilter}
        />

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">加载作品中...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredPhotos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Camera className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">暂无作品</h3>
            <p className="text-muted-foreground mb-6">
              {filter === 'friends' 
                ? '您的朋友还没有发布任何作品' 
                : filter === 'mine'
                ? '您还没有上传任何作品'
                : '还没有人分享作品'}
            </p>
            {user && (
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                上传首个作品
              </Button>
            )}
          </div>
        )}

        {/* Photo Grid */}
        {!isLoading && filteredPhotos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPhotos.map((photo) => (
              <PhotoCard 
                key={photo.id} 
                photo={photo} 
                onClick={() => setSelectedPhoto(photo)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{selectedPhoto.title}</span>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedPhoto.profiles?.avatar_url || undefined} />
                    <AvatarFallback>
                      {selectedPhoto.profiles?.display_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {selectedPhoto.profiles?.display_name || '匿名用户'}
                  </span>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Photo */}
              <div className="space-y-4">
                <AspectRatio ratio={4/3}>
                  <img
                    src={selectedPhoto.image_url}
                    alt={selectedPhoto.title}
                    className="rounded-lg object-cover w-full h-full"
                  />
                </AspectRatio>
                
                <PhotoActions photo={selectedPhoto} />
              </div>
              
              {/* Details */}
              <div className="space-y-4">
                {selectedPhoto.description && (
                  <div>
                    <h4 className="font-medium mb-2">作品描述</h4>
                    <p className="text-muted-foreground">{selectedPhoto.description}</p>
                  </div>
                )}
                
                {selectedPhoto.camera_equipment && (
                  <div>
                    <h4 className="font-medium mb-2">拍摄设备</h4>
                    <p className="text-muted-foreground">{selectedPhoto.camera_equipment}</p>
                  </div>
                )}
                
                {(() => {
                  const exposureInfo = getExposureInfo(selectedPhoto.exposure_settings);
                  return exposureInfo && (
                    <div>
                      <h4 className="font-medium mb-2">拍摄参数</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>ISO: {exposureInfo.iso}</div>
                        <div>光圈: {exposureInfo.aperture}</div>
                        <div>快门: {exposureInfo.shutter}</div>
                        <div>焦距: {exposureInfo.focal}</div>
                      </div>
                    </div>
                  );
                })()}
                
                <div>
                  <h4 className="font-medium mb-2">发布时间</h4>
                  <p className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(selectedPhoto.created_at), { 
                      addSuffix: true, 
                      locale: zhCN 
                    })}
                  </p>
                </div>
                
                <Separator />
                
                <PhotoComments photoId={selectedPhoto.id} />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Upload Dialog */}
      <UploadPhotoDialog 
        open={uploadDialogOpen} 
        onOpenChange={setUploadDialogOpen}
      />
    </div>
  );
}

// PhotoCard component
interface PhotoCardProps {
  photo: Photo;
  onClick: () => void;
}

function PhotoCard({ photo, onClick }: PhotoCardProps) {
  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <AspectRatio ratio={4/3}>
          <img
            src={photo.image_url}
            alt={photo.title}
            className="rounded-t-lg object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        </AspectRatio>
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
                <span>{photo.likes_count}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="h-4 w-4" />
                <span>{photo.comments_count || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Flame className="h-4 w-4" />
                <span>{Math.round(calculateHotness(photo))}</span>
              </div>
            </div>
            {photo.camera_equipment && (
              <span className="text-xs truncate max-w-[120px]">
                {photo.camera_equipment}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// PhotoActions component
interface PhotoActionsProps {
  photo: Photo;
}

function PhotoActions({ photo }: PhotoActionsProps) {
  const { user } = useAuth();
  const { userHasLiked, toggleLike, isToggling } = useLikes(photo.id);

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
          {photo.likes_count}
        </Button>
        <div className="flex items-center space-x-1 text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm">评论</span>
        </div>
      </div>
      <div className="flex items-center space-x-1 text-muted-foreground">
        <Eye className="h-4 w-4" />
        <span className="text-sm">{photo.views_count} 次浏览</span>
      </div>
    </div>
  );
}