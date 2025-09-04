import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCreateProfile } from '@/hooks/useProfiles';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Camera, AlertCircle, User, Quote, CameraIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<'auth' | 'profile'>('auth');
  
  // 认证表单字段
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 用户资料字段
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [favoriteCamera, setFavoriteCamera] = useState('');
  
  const { signIn, signUp, user } = useAuth();
  const { mutate: createProfile, isPending: isCreatingProfile } = useCreateProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && step === 'auth') {
      // 用户已登录，检查是否已有profile
      checkUserProfile();
    }
  }, [user, step, navigate]);

  const checkUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profile) {
        // 已有profile，直接跳转首页
        navigate('/');
      } else {
        // 没有profile，进入设置页面
        setStep('profile');
      }
    } catch (error) {
      console.error('Check profile error:', error);
      // 出错时默认进入profile设置
      setStep('profile');
    }
  };

  // 验证密码
  const validatePasswords = () => {
    if (!isLogin && password !== confirmPassword) {
      toast({
        title: "密码不匹配",
        description: "请确保两次输入的密码相同",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  // 处理认证表单提交
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswords()) return;
    
    setLoading(true);

    try {
      const { error } = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        toast({
          title: "错误",
          description: error.message,
          variant: "destructive",
        });
      } else {
        if (isLogin) {
          toast({
            title: "登录成功！",
            description: "欢迎回来",
          });
          navigate('/');
        } else {
          toast({
            title: "注册邮件已发送！",
            description: "请检查您的邮箱并点击确认链接完成注册",
          });
          // 注册后不立即进入profile设置，等待邮箱确认
          // 用户确认邮箱后会自动登录并重定向
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "错误",
        description: "操作失败，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理用户资料提交
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      toast({
        title: "请输入昵称",
        description: "昵称不能为空",
        variant: "destructive",
      });
      return;
    }

    createProfile({
      display_name: displayName.trim(),
      bio: bio.trim() || undefined,
      favorite_camera: favoriteCamera.trim() || undefined,
    }, {
      onSuccess: () => {
        toast({
          title: "资料设置成功！",
          description: "欢迎来到摄影作品集",
        });
        navigate('/');
      },
      onError: (error) => {
        console.error('Profile creation error:', error);
        toast({
          title: "设置失败",
          description: "请稍后重试",
          variant: "destructive",
        });
      }
    });
  };

  // 跳过资料设置
  const handleSkipProfile = () => {
    navigate('/');
  };

  // 认证表单
  if (step === 'auth') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="flex items-center justify-center mb-8">
            <Camera className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              摄影作品集
            </h1>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-2">
              {isLogin ? '登录账户' : '创建账户'}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isLogin ? '欢迎回来！请登录您的账户' : '加入我们，分享您的摄影作品'}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
                placeholder="请输入邮箱地址"
              />
            </div>

            <div>
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
                minLength={6}
                placeholder="请输入密码（至少6位）"
              />
            </div>

            {!isLogin && (
              <div>
                <Label htmlFor="confirmPassword">确认密码</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-1"
                  minLength={6}
                  placeholder="请再次输入密码"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-sm text-destructive mt-1">密码不匹配</p>
                )}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || (!isLogin && password !== confirmPassword)}
            >
              {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? '没有账户？立即注册' : '已有账户？立即登录'}
            </button>
          </div>

          {!isLogin && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  注册后您需要完善个人资料，包括昵称、常用相机和座右铭等信息。
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // 用户资料设置表单
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex items-center justify-center mb-8">
          <User className="h-12 w-12 text-primary mr-3" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            完善资料
          </h1>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-2">设置您的个人信息</h2>
          <p className="text-muted-foreground text-sm">
            让其他摄影师更好地了解您
          </p>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
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
              rows={3}
            />
          </div>

          <div className="flex space-x-3">
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={isCreatingProfile || !displayName.trim()}
            >
              {isCreatingProfile ? '设置中...' : '完成设置'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleSkipProfile}
              disabled={isCreatingProfile}
            >
              跳过
            </Button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              您可以稍后在个人资料页面修改这些信息。只有昵称是必填项。
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}