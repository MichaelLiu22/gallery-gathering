import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateProfile } from '@/hooks/useProfiles';
import { toast } from 'sonner';
import { Camera } from 'lucide-react';

interface ProfileSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function ProfileSetupDialog({ open, onOpenChange, onSuccess }: ProfileSetupDialogProps) {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [favoriteCamera, setFavoriteCamera] = useState('');
  const { mutate: createProfile, isPending } = useCreateProfile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      toast.error('显示名称不能为空');
      return;
    }

    createProfile({
      display_name: displayName.trim(),
      bio: bio.trim() || undefined,
      favorite_camera: favoriteCamera.trim() || undefined,
    }, {
      onSuccess: () => {
        toast.success('个人资料设置成功！');
        onSuccess();
        onOpenChange(false);
      },
      onError: (error: any) => {
        console.error('Profile creation error:', error);
        toast.error(error.message || '设置失败，请重试');
      },
    });
  };

  const handleSkip = () => {
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            完善个人资料
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            欢迎加入摄影作品分享平台！设置您的个人资料，让其他摄影爱好者更好地了解您。
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">
                显示名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="请输入您的显示名称"
                maxLength={50}
                required
              />
              <p className="text-xs text-muted-foreground">
                {displayName.length}/50
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="favoriteCamera">喜爱的相机设备</Label>
              <Input
                id="favoriteCamera"
                value={favoriteCamera}
                onChange={(e) => setFavoriteCamera(e.target.value)}
                placeholder="例如：Canon EOS R5, Sony A7III"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">个人简介</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="简单介绍一下自己的摄影风格和经历..."
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {bio.length}/500
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                className="flex-1"
                disabled={isPending}
              >
                稍后设置
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isPending || !displayName.trim()}
              >
                {isPending ? '设置中...' : '完成设置'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}