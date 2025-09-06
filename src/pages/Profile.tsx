import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUpdateProfile } from '@/hooks/useProfiles';
import { usePhotos } from '@/hooks/usePhotos';
import { useFollowCounts } from '@/hooks/useFollows';
import { useFriends } from '@/hooks/useFriends';
import { useDeletePhoto } from '@/hooks/useDeletePhoto';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Quote, 
  CameraIcon, 
  ArrowLeft, 
  Award, 
  Star, 
  Eye, 
  Heart, 
  MessageCircle,
  UserPlus,
  Users,
  Trash2,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeletePhotoDialog from '@/components/DeletePhotoDialog';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { data: userPhotos } = usePhotos('latest', 'mine');
  const { data: friends } = useFriends();
  const { data: followCounts } = useFollowCounts(user?.id || '');
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { mutate: deletePhoto, isPending: isDeleting } = useDeletePhoto();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [favoriteCamera, setFavoriteCamera] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<any>(null);
  
  // Calculate user statistics
  const myPhotos = userPhotos || [];
  const mostPopularPhoto = myPhotos.length > 0 
    ? myPhotos.reduce((max, photo) => (photo.likes_count || 0) > (max.likes_count || 0) ? photo : max)
    : null;
  
  const averageRating = myPhotos.length > 0 
    ? myPhotos.reduce((sum, photo) => sum + (photo.average_rating || 0), 0) / myPhotos.length
    : 0;
  const totalViews = myPhotos.reduce((sum, photo) => sum + (photo.views_count || 0), 0);
  const totalLikes = myPhotos.reduce((sum, photo) => sum + (photo.likes_count || 0), 0);
  const totalComments = myPhotos.reduce((sum, photo) => sum + (photo.comments_count || 0), 0);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setFavoriteCamera(profile.favorite_camera || '');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      toast({
        title: "请输入昵称",
        description: "昵称不能为空",
        variant: "destructive",
      });
      return;
    }

    updateProfile({
      display_name: displayName.trim(),
      bio: bio.trim() || undefined,
      favorite_camera: favoriteCamera.trim() || undefined,
    }, {
      onSuccess: () => {
        toast({
          title: "资料更新成功！",
          description: "您的个人信息已保存",
        });
      },
      onError: (error) => {
        console.error('Profile update error:', error);
        toast({
          title: "更新失败",
          description: "请稍后重试",
          variant: "destructive",
        });
      }
    });
  };

  const handleDeletePhoto = (photo: any) => {
    setPhotoToDelete(photo);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (!photoToDelete) return;
    
    deletePhoto(photoToDelete.id, {
      onSuccess: () => {
        toast({
          title: "作品删除成功",
          description: `作品 "${photoToDelete.title}" 已被删除`,
        });
        setShowDeleteDialog(false);
        setPhotoToDelete(null);
      },
      onError: () => {
        toast({
          title: "删除失败",
          description: "请稍后重试",
          variant: "destructive",
        });
      }
    });
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <h1 className="text-2xl font-bold">个人资料</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 作品展示卡片 */}
          <div className="lg:col-span-1 space-y-4">
            {/* 个人统计 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  作品统计
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">发布作品</span>
                  <Badge variant="secondary">{myPhotos.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">总浏览量</span>
                  <Badge variant="secondary">{totalViews}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">总点赞数</span>
                  <Badge variant="secondary">{totalLikes}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">总评论数</span>
                  <Badge variant="secondary">{totalComments}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">平均评分</span>
                  <Badge variant="outline" className="bg-gradient-to-r from-primary to-accent text-white">
                    <Star className="h-3 w-3 mr-1" />
                    {averageRating.toFixed(1)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* 社交统计 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  社交统计
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">关注的人</span>
                  <Badge variant="secondary">{followCounts?.followingCount || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">关注者</span>
                  <Badge variant="secondary">{followCounts?.followersCount || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">好友数量</span>
                  <Badge variant="secondary">{friends?.length || 0}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* 最受欢迎作品 */}
            {mostPopularPhoto && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    最受欢迎作品
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="relative">
                      <img
                        src={(mostPopularPhoto as any).image_urls && (mostPopularPhoto as any).image_urls.length > 0 
                          ? (mostPopularPhoto as any).image_urls[0] 
                          : mostPopularPhoto.image_url}
                        alt={mostPopularPhoto.title}
                        className="w-full h-32 object-cover rounded-lg cursor-pointer"
                        onClick={() => navigate(`/photo/${mostPopularPhoto.id}`)}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute top-2 right-2"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDeletePhoto(mostPopularPhoto)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            删除作品
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div>
                      <h4 className="font-medium">{mostPopularPhoto.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {mostPopularPhoto.likes_count || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {mostPopularPhoto.views_count || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {mostPopularPhoto.comments_count || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 所有作品列表 */}
            {myPhotos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CameraIcon className="h-5 w-5" />
                    我的作品 ({myPhotos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {myPhotos.map((photo) => (
                      <div key={photo.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <img
                          src={(photo as any).image_urls && (photo as any).image_urls.length > 0 
                            ? (photo as any).image_urls[0] 
                            : photo.image_url}
                          alt={photo.title}
                          className="w-12 h-12 object-cover rounded cursor-pointer"
                          onClick={() => navigate(`/photo/${photo.id}`)}
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium truncate cursor-pointer" onClick={() => navigate(`/photo/${photo.id}`)}>
                            {photo.title}
                          </h5>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {photo.likes_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {photo.views_count || 0}
                            </span>
                            {photo.average_rating && photo.average_rating > 0 && (
                              <span className="flex items-center gap-1 text-primary">
                                <Star className="h-3 w-3" />
                                {photo.average_rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleDeletePhoto(photo)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除作品
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 编辑表单 */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              <div className="flex items-center justify-center mb-8">
                <User className="h-12 w-12 text-primary mr-3" />
                <h2 className="text-xl font-semibold">编辑个人信息</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="email" className="text-sm text-muted-foreground">
                    邮箱地址
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="mt-1 bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    邮箱地址不可修改
                  </p>
                </div>

                <div>
                  <Label htmlFor="displayName" className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    昵称 <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="mt-1"
                    placeholder="请输入您的昵称"
                    maxLength={50}
                  />
                </div>

                <div>
                  <Label htmlFor="favoriteCamera" className="flex items-center">
                    <CameraIcon className="h-4 w-4 mr-2" />
                    常用相机
                  </Label>
                  <Input
                    id="favoriteCamera"
                    type="text"
                    value={favoriteCamera}
                    onChange={(e) => setFavoriteCamera(e.target.value)}
                    className="mt-1"
                    placeholder="如：Canon EOS R5, Sony A7R IV"
                    maxLength={100}
                  />
                </div>

                <div>
                  <Label htmlFor="bio" className="flex items-center">
                    <Quote className="h-4 w-4 mr-2" />
                    座右铭
                  </Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="mt-1"
                    placeholder="分享您的摄影理念或座右铭..."
                    maxLength={200}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {bio.length}/200
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/')}
                  >
                    取消
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isPending || !displayName.trim()}
                  >
                    {isPending ? '保存中...' : '保存更改'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>

      <DeletePhotoDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleConfirmDelete}
        photoTitle={photoToDelete?.title || ''}
        isLoading={isDeleting}
      />
    </div>
  );
}