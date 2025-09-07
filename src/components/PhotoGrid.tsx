import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePhotos, usePhotosCount, SortOrder, PhotoFilter } from '@/hooks/usePhotos';
import { useFriends } from '@/hooks/useFriends';
import { useLikes } from '@/hooks/useLikes';
import { useProfile } from '@/hooks/useProfiles';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Heart, 
  MessageCircle, 
  TrendingUp, 
  Upload, 
  User, 
  LogOut,
  Camera,
  Eye,
  Images,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import UploadPhotoDialog from './UploadPhotoDialog';
import SortFilter from './SortFilter';
import NotificationBadge from './NotificationBadge';
import FriendManagement from './FriendManagement';
import { useDeletePhoto } from '@/hooks/useDeletePhoto';

export default function PhotoGrid() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');
  const [filter, setFilter] = useState<PhotoFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const photosPerPage = 8;

  const { user, signOut } = useAuth();
  const { data: userProfile } = useProfile();
  const { data: friends } = useFriends();
  const { data: photos, isLoading, error } = usePhotos(sortOrder, filter, currentPage, photosPerPage);
  const { data: totalCount } = usePhotosCount(filter);

  const filteredPhotos = photos || [];
  const totalPages = Math.ceil((totalCount || 0) / photosPerPage);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = (newFilter: PhotoFilter) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleSortChange = (newSort: SortOrder) => {
    setSortOrder(newSort);
    setCurrentPage(1); // Reset to first page when sort changes
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
          <p className="text-muted-foreground">
            {currentPage > 1 ? `加载第 ${currentPage} 页...` : '加载作品中...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Camera className="h-16 w-16 text-muted-foreground mb-4 mx-auto" />
          <h2 className="text-2xl font-bold mb-2">网络连接问题</h2>
          <p className="text-muted-foreground mb-4">
            无法加载作品，请检查网络连接
          </p>
          <div className="space-y-2">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              刷新页面
            </Button>
            <p className="text-xs text-muted-foreground">
              如果问题持续存在，请稍后再试
            </p>
          </div>
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
                <NotificationBadge />
                <FriendManagement />
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
          onSortChange={handleSortChange}
          onFilterChange={handleFilterChange}
        />

        {/* Pagination Info */}
        {totalCount > 0 && (
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-muted-foreground">
              共 {totalCount} 个作品，第 {currentPage} / {totalPages} 页
            </p>
            <div className="text-sm text-muted-foreground">
              每页显示 {photosPerPage} 个作品
            </div>
          </div>
        )}

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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPhotos.map((photo) => (
                <PhotoCard 
                  key={photo.id} 
                  photo={photo} 
                  onClick={() => {
                    window.location.href = `/photo/${photo.id}`;
                  }}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>上一页</span>
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center space-x-1"
                >
                  <span>下一页</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>

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
            {photo.average_rating > 0 && (
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-primary font-medium">{photo.average_rating.toFixed(1)}</span>
              </div>
            )}
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
  const { mutate: deletePhoto, isPending: isDeleting } = useDeletePhoto();
  
  const isOwner = user?.id === photo.photographer_id;

  const handleLike = () => {
    if (!user) return;
    toggleLike();
  };

  const handleDelete = () => {
    if (!isOwner) return;
    
    if (window.confirm('确定要删除这个作品吗？此操作不可恢复。')) {
      deletePhoto(photo.id);
    }
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
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1 text-muted-foreground">
          <Eye className="h-4 w-4" />
          <span className="text-sm">{photo.views_count || 0} 次浏览</span>
        </div>
        {isOwner && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}