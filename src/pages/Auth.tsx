import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Camera, AlertCircle, Mail, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ProfileSetupDialog from '@/components/ProfileSetupDialog';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  
  // 认证表单字段
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 重发确认邮件状态
  const [showResendEmail, setShowResendEmail] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // 用户已登录，检查是否已有profile
      checkUserProfile();
    }
  }, [user, navigate]);

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
        // 没有profile，显示设置弹窗
        setShowProfileDialog(true);
      }
    } catch (error) {
      console.error('Check profile error:', error);
      // 出错时默认显示profile设置弹窗
      setShowProfileDialog(true);
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
        // 处理特殊的注册错误
        if (!isLogin && error.message.includes('User already registered')) {
          toast({
            title: "用户已存在",
            description: "该邮箱已注册，请检查邮箱确认链接或直接登录",
            variant: "destructive",
          });
          // 自动切换到登录模式
          setTimeout(() => setIsLogin(true), 2000);
        } else if (!isLogin && error.message.includes('Email not confirmed')) {
          toast({
            title: "请确认邮箱",
            description: "请检查您的邮箱并点击确认链接完成注册",
          });
          // 显示重发确认邮件选项
          setShowResendEmail(true);
          setResendEmail(email);
        } else {
          let errorMessage = error.message;
          
          // 处理常见错误信息的中文翻译
          if (errorMessage.includes('Invalid login credentials')) {
            errorMessage = "邮箱或密码错误，请检查后重试";
          } else if (errorMessage.includes('Email not confirmed')) {
            errorMessage = "邮箱未确认，请检查您的邮箱并点击确认链接";
            // 显示重发确认邮件选项
            setShowResendEmail(true);
            setResendEmail(email);
          } else if (errorMessage.includes('Password should be at least')) {
            errorMessage = "密码至少需要6个字符";
          }
          
          toast({
            title: "错误",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } else {
        if (isLogin) {
          toast({
            title: "登录成功！",
            description: "欢迎回来",
          });
          // 登录成功后会通过useEffect中的checkUserProfile处理跳转
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


  // 重发确认邮件
  const handleResendConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resendEmail.trim()) {
      toast({
        title: "请输入邮箱",
        description: "请输入需要重发确认邮件的邮箱地址",
        variant: "destructive",
      });
      return;
    }

    setResendLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: resendEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          title: "发送失败",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "邮件已发送！",
          description: "确认邮件已重新发送，请检查您的收件箱",
        });
        setShowResendEmail(false);
        setResendEmail('');
      }
    } catch (error) {
      console.error('Resend confirmation error:', error);
      toast({
        title: "发送失败",
        description: "操作失败，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
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

          {/* 重发确认邮件表单 */}
          {showResendEmail && (
            <Card className="mt-4 p-4 border-dashed border-muted-foreground">
              <div className="flex items-center mb-3">
                <Mail className="h-4 w-4 text-muted-foreground mr-2" />
                <h3 className="text-sm font-medium">重新发送确认邮件</h3>
              </div>
              
              <form onSubmit={handleResendConfirmation} className="space-y-3">
                <div>
                  <Label htmlFor="resendEmail" className="text-xs">邮箱地址</Label>
                  <Input
                    id="resendEmail"
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    required
                    className="mt-1"
                    placeholder="请输入邮箱地址"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    type="submit" 
                    size="sm" 
                    className="flex-1"
                    disabled={resendLoading}
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${resendLoading ? 'animate-spin' : ''}`} />
                    {resendLoading ? '发送中...' : '重新发送'}
                  </Button>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowResendEmail(false)}
                    disabled={resendLoading}
                  >
                    取消
                  </Button>
                </div>
              </form>
            </Card>
          )}

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
      
      <ProfileSetupDialog
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
        onSuccess={() => {
          setShowProfileDialog(false);
          navigate('/');
        }}
      />
    </div>
  );
}