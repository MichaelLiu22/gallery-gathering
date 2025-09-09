import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  useFriends, 
  useFriendRequests, 
  useSendFriendRequest, 
  useAcceptFriendRequest, 
  useRejectFriendRequest,
  useRemoveFriend 
} from '@/hooks/useFriends';
import { useProfile } from '@/hooks/useProfiles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Users, Check, X, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FriendManagementProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultTab?: string;
}

export default function FriendManagement({ open, onOpenChange, defaultTab = 'friends' }: FriendManagementProps) {
  const [searchEmail, setSearchEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const { user } = useAuth();
  const { data: friends = [] } = useFriends();
  const { data: friendRequests = [] } = useFriendRequests();
  const { mutate: sendFriendRequest } = useSendFriendRequest();
  const { mutate: acceptFriendRequest } = useAcceptFriendRequest();
  const { mutate: rejectFriendRequest } = useRejectFriendRequest();
  const { mutate: removeFriend } = useRemoveFriend();
  const { toast } = useToast();

  const pendingRequests = friendRequests.filter(req => req.receiver_id === user?.id && req.status === 'pending');
  const sentRequests = friendRequests.filter(req => req.sender_id === user?.id && req.status === 'pending');

  const handleSendFriendRequest = async () => {
    if (!searchEmail.trim()) return;
    
    setIsSearching(true);
    try {
      // Find user by display name
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .ilike('display_name', `%${searchEmail}%`)
        .limit(1);

      if (error) throw error;
      
      if (profiles && profiles.length > 0) {
        const targetUserId = profiles[0].user_id;
        
        // Check if already friends
        const { data: existingFriendship } = await supabase
          .from('friendships')
          .select('id')
          .or(`and(user_id.eq.${user?.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${user?.id})`)
          .eq('status', 'accepted')
          .maybeSingle();

        if (existingFriendship) {
          toast({
            title: "已经是好友",
            description: "您已经和该用户是好友了",
            variant: "destructive",
          });
          return;
        }

        // Check if friend request already sent
        const { data: existingRequest } = await supabase
          .from('friend_requests')
          .select('id')
          .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user?.id})`)
          .eq('status', 'pending')
          .maybeSingle();

        if (existingRequest) {
          toast({
            title: "请求已存在",
            description: "已经有待处理的好友请求",
            variant: "destructive",
          });
          return;
        }

        // Check if trying to add self
        if (targetUserId === user?.id) {
          toast({
            title: "不能添加自己",
            description: "不能添加自己为好友",
            variant: "destructive",
          });
          return;
        }

        sendFriendRequest(targetUserId, {
          onSuccess: () => {
            toast({
              title: "好友请求已发送",
              description: `已向 "${profiles[0].display_name}" 发送好友请求`,
            });
            setSearchEmail('');
          },
          onError: (error: any) => {
            toast({
              title: "发送失败",
              description: error.message || "请稍后重试",
              variant: "destructive",
            });
          }
        });
      } else {
        toast({
          title: "未找到用户",
          description: "请检查用户名是否正确",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Search user error:', error);
      toast({
        title: "搜索失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Users className="h-4 w-4 mr-2" />
          好友
          {pendingRequests.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {pendingRequests.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>好友管理</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">
              好友列表 ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              好友请求 
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="add">添加好友</TabsTrigger>
          </TabsList>
          
          <TabsContent value="friends" className="mt-4">
            <div className="space-y-4">
              {friends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  还没有好友，快去添加吧！
                </div>
              ) : (
                friends.map((friend) => (
                  <Card key={friend.id}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={friend.friend_profile?.avatar_url} />
                              <AvatarFallback>
                                {friend.friend_profile?.display_name?.[0]?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">
                                {friend.friend_profile?.display_name || '未知用户'}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                摄影总分: {friend.friend_profile?.photo_score?.toFixed(2) || '0.00'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(friend.created_at).toLocaleDateString('zh-CN')} 成为好友
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFriend(friend.friend_id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="requests" className="mt-4">
            <div className="space-y-6">
              {/* 收到的好友请求 */}
              <div>
                <h3 className="font-medium mb-3">收到的请求</h3>
                <div className="space-y-3">
                  {pendingRequests.length === 0 ? (
                    <p className="text-muted-foreground text-sm">暂无好友请求</p>
                  ) : (
                    pendingRequests.map((request) => (
                      <Card key={request.id}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={request.sender_profile?.avatar_url} />
                                  <AvatarFallback>
                                    {request.sender_profile?.display_name?.[0]?.toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-medium">
                                    {request.sender_profile?.display_name || '未知用户'}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(request.created_at).toLocaleDateString('zh-CN')} 发送请求
                                  </p>
                                </div>
                              </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => acceptFriendRequest(request.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectFriendRequest(request.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
              
              {/* 发送的好友请求 */}
              <div>
                <h3 className="font-medium mb-3">已发送的请求</h3>
                <div className="space-y-3">
                  {sentRequests.length === 0 ? (
                    <p className="text-muted-foreground text-sm">暂无发送的请求</p>
                  ) : (
                    sentRequests.map((request) => (
                      <Card key={request.id}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={request.receiver_profile?.avatar_url} />
                                  <AvatarFallback>
                                    {request.receiver_profile?.display_name?.[0]?.toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-medium">
                                    {request.receiver_profile?.display_name || '未知用户'}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(request.created_at).toLocaleDateString('zh-CN')} 发送
                                  </p>
                                </div>
                              </div>
                            <Badge variant="secondary">等待回复</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="add" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  添加好友
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="输入用户名搜索..."
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendFriendRequest()}
                  />
                  <Button 
                    onClick={handleSendFriendRequest}
                    disabled={isSearching || !searchEmail.trim()}
                  >
                    {isSearching ? '搜索中...' : '发送请求'}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  通过用户名搜索并添加好友
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}