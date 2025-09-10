import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFriends, useSendFriendRequest, useFriendRequests } from '@/hooks/useFriends';
import { useFollowUser, useUnfollowUser, useIsFollowing } from '@/hooks/useFollows';
import { useProfile } from '@/hooks/useProfiles';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  MessageCircle, 
  Eye,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  UserPlus,
  UserCheck,
  Clock,
  TrendingUp,
  UserMinus
} from 'lucide-react';
import PhotoComments from '@/components/PhotoComments';
import PhotoRating from '@/components/PhotoRating';
import AddFriendDialog from '@/components/AddFriendDialog';
import { useLikes } from '@/hooks/useLikes';
import { useToast } from '@/hooks/use-toast';
import { AdaptiveImage } from '@/components/AdaptiveImage';
import { ThumbnailImage } from '@/components/ThumbnailImage';

interface Photo {
  id: number;
  title: string;
  description: string | null;
  image_url: string;
  image_urls: any;
  image_count: number;
  photographer_id: string;
  camera_equipment: string | null;
  likes_count: number;
  views_count: number;
  average_rating: number;
  ratings_count: number;
  created_at: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function PhotoView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showAddFriendDialog, setShowAddFriendDialog] = useState(false);

  const { data: friends } = useFriends();
  const { data: friendRequests } = useFriendRequests();
  const { mutate: sendFriendRequest, isPending: isSendingRequest } = useSendFriendRequest();
  const { mutate: followUser, isPending: isFollowing } = useFollowUser();
  const { mutate: unfollowUser, isPending: isUnfollowing } = useUnfollowUser();
  const { data: isFollowingUser } = useIsFollowing(photo?.photographer_id || '');
  const { likesCount, userHasLiked, toggleLike, isToggling } = useLikes(id ? parseInt(id) : 0);

  // Check friend status
  const getFriendStatus = () => {
    if (!user || !photo) return 'none';
    if (photo.photographer_id === user.id) return 'self';
    
    const isFriend = friends?.some(f => f.friend_id === photo.photographer_id || f.user_id === photo.photographer_id);
    if (isFriend) return 'friend';
    
    const hasSentRequest = friendRequests?.some(
      req => req.receiver_id === photo.photographer_id && req.status === 'pending'
    );
    if (hasSentRequest) return 'pending';
    
    const hasReceivedRequest = friendRequests?.some(
      req => req.sender_id === photo.photographer_id && req.status === 'pending'
    );
    if (hasReceivedRequest) return 'received';
    
    return 'none';
  };

  const friendStatus = getFriendStatus();

  useEffect(() => {
    if (!id) return;
    
    const fetchPhoto = async () => {
      const { data, error } = await supabase
        .from('photos')
        .select(`
          *,
          profiles (
            display_name,
            avatar_url
          )
        `)
        .eq('id', parseInt(id))
        .single();

      if (error) {
        console.error('Error fetching photo:', error);
        navigate('/');
        return;
      }

      setPhoto(data);
      setLoading(false);

      // Update view count
      await supabase
        .from('photos')
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', parseInt(id));
    };

    fetchPhoto();
  }, [id, navigate]);

  const handleAddFriend = () => {
    setShowAddFriendDialog(true);
  };

  const handleConfirmAddFriend = () => {
    if (!photo || !user) return;
    
    sendFriendRequest(photo.photographer_id, {
      onSuccess: () => {
        toast({
          title: "好友请求已发送",
          description: `已向 ${photo.profiles?.display_name || '该用户'} 发送好友请求`,
        });
        setShowAddFriendDialog(false);
      },
      onError: () => {
        toast({
          title: "发送失败",
          description: "请稍后重试",
          variant: "destructive",
        });
        setShowAddFriendDialog(false);
      }
    });
  };

  const handleFollow = () => {
    if (!photo || !user) return;
    
    if (isFollowingUser) {
      unfollowUser(photo.photographer_id, {
        onSuccess: () => {
          toast({
            title: "已取消关注",
            description: `已取消关注 ${photo.profiles?.display_name || '该用户'}`,
          });
        },
      });
    } else {
      followUser(photo.photographer_id, {
        onSuccess: () => {
          toast({
            title: "关注成功",
            description: `已关注 ${photo.profiles?.display_name || '该用户'}`,
          });
        },
      });
    }
  };

  const handleImageZoom = (delta: number) => {
    const newZoom = Math.max(0.5, Math.min(3, imageZoom + delta));
    setImageZoom(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (imageZoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && imageZoom > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetImageView = () => {
    setImageZoom(1);
    setImagePosition({ x: 0, y: 0 });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载作品中...</p>
        </div>
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">作品不存在</h2>
          <Button onClick={() => navigate('/')}>返回首页</Button>
        </div>
      </div>
    );
  }

  const imageUrls = (photo.image_urls && Array.isArray(photo.image_urls) && photo.image_urls.length > 0) 
    ? photo.image_urls as string[] 
    : [photo.image_url];
  const currentImage = imageUrls[currentImageIndex];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回首页
          </Button>
          
          {friendStatus !== 'self' && (
            <div className="flex items-center space-x-2">
              {/* Follow Button */}
              <Button
                onClick={handleFollow}
                disabled={isFollowing || isUnfollowing}
                variant={isFollowingUser ? "outline" : "default"}
                className={!isFollowingUser ? "bg-gradient-to-r from-primary to-accent" : ""}
              >
                {isFollowingUser ? (
                  <>
                    <UserMinus className="h-4 w-4 mr-2" />
                    取消关注
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    关注
                  </>
                )}
              </Button>

              {/* Friend Button */}
              {friendStatus === 'none' && (
                <Button 
                  onClick={handleAddFriend}
                  disabled={isSendingRequest}
                  variant="outline"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  添加好友
                </Button>
              )}
              
              {friendStatus === 'friend' && (
                <Button variant="secondary" disabled>
                  <UserCheck className="h-4 w-4 mr-2" />
                  已是好友
                </Button>
              )}
              
              {friendStatus === 'pending' && (
                <Button variant="secondary" disabled>
                  <Clock className="h-4 w-4 mr-2" />
                  已发送请求
                </Button>
              )}
            </div>
          )}
        </div>

        {/* 移动端和桌面端不同的布局 */}
        <div className="space-y-6">
          {/* Image Display */}
          <Card className="border-0 shadow-none">
            <CardContent className="p-0">
              <div className="relative bg-transparent overflow-hidden">
                {/* 移动端优化：让图片完全显示 */}
                <div className="w-full" style={{ 
                  minHeight: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <AdaptiveImage
                    src={currentImage}
                    alt={photo.title}
                    className="w-full max-w-full cursor-pointer transition-all duration-300 hover:opacity-90"
                    enableBackgroundExtension={false}
                    onClick={() => {
                      // 点击图片跳转到新页面全屏展示
                      window.open(`/photo-fullscreen?src=${encodeURIComponent(currentImage)}&alt=${encodeURIComponent(photo.title)}`, '_blank');
                    }}
                  />
                </div>
                
                {/* Image counter for multiple images */}
                {imageUrls.length > 1 && (
                  <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {imageUrls.length}
                  </div>
                )}
              </div>
              
              {/* Thumbnail navigation - centered without borders */}
              {imageUrls.length > 1 && (
                <div className="p-4 flex gap-2 justify-center items-center overflow-x-auto">
                  {imageUrls.map((url, index) => (
                    <ThumbnailImage
                      key={index}
                      src={url}
                      alt={`${photo.title} ${index + 1}`}
                      className={`h-16 w-16 rounded-lg cursor-pointer flex-shrink-0 transition-all hover:scale-105 ${
                        index === currentImageIndex 
                          ? 'ring-2 ring-primary/50 opacity-100' 
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 移动端和桌面端不同的内容布局 - 根据图片大小自动调整 */}
          <div className="flex flex-col lg:grid lg:grid-cols-3 lg:gap-8 space-y-6 lg:space-y-0">
            {/* Photo Info & Actions - 在移动端自动跟随在图片下方 */}
            <div className="w-full lg:col-span-1 lg:order-2 space-y-6">
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <h1 className="text-2xl font-bold mb-4">{photo.title}</h1>
                  
                  {/* Photographer Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={photo.profiles?.avatar_url || undefined} />
                        <AvatarFallback>
                          {photo.profiles?.display_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{photo.profiles?.display_name || '匿名用户'}</p>
                        <p className="text-sm text-muted-foreground">摄影师</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4 opacity-30" />
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Heart className={`h-4 w-4 ${userHasLiked ? 'fill-current text-red-500' : ''}`} />
                        <span className="font-medium">{likesCount}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">点赞</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Eye className="h-4 w-4" />
                        <span className="font-medium">{photo.views_count || 0}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">浏览</p>
                    </div>
                    {photo.average_rating > 0 && (
                      <div className="text-center col-span-2">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <span className="font-medium text-primary">{photo.average_rating.toFixed(1)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{photo.ratings_count} 个评分</p>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    className="w-full"
                    onClick={() => toggleLike()}
                    disabled={!user || isToggling}
                    variant={userHasLiked ? "default" : "outline"}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${userHasLiked ? 'fill-current' : ''}`} />
                    {userHasLiked ? '取消点赞' : '点赞'}
                  </Button>
                </CardContent>
              </Card>

              {/* Description */}
              {photo.description && (
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <h3 className="font-medium mb-2">作品描述</h3>
                    <p className="text-muted-foreground leading-relaxed">{photo.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Camera Equipment */}
              {photo.camera_equipment && (
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <h3 className="font-medium mb-2">拍摄设备</h3>
                    <p className="text-muted-foreground">{photo.camera_equipment}</p>
                  </CardContent>
                </Card>
              )}

              {/* Rating - 在移动端也显示 */}
              <Card className="lg:hidden border-0 shadow-md">
                <CardContent className="p-6">
                  <PhotoRating photoId={parseInt(id!)} />
                </CardContent>
              </Card>
            </div>

            {/* Comments and Rating - 在移动端位于右侧 */}
            <div className="w-full lg:col-span-2 lg:order-1 space-y-6">
              {/* Rating - 只在桌面端显示 */}
              <Card className="hidden lg:block border-0 shadow-md">
                <CardContent className="p-6">
                  <PhotoRating photoId={parseInt(id!)} />
                </CardContent>
              </Card>

              {/* Comments */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <PhotoComments photoId={parseInt(id!)} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <AddFriendDialog
        open={showAddFriendDialog}
        onOpenChange={setShowAddFriendDialog}
        onConfirm={handleConfirmAddFriend}
        userName={photo?.profiles?.display_name || '该用户'}
        isLoading={isSendingRequest}
      />
    </div>
  );
}