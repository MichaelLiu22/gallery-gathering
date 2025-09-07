import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateProfile } from '@/hooks/useProfiles';
import { checkDisplayNameAvailability, validateDisplayName } from '@/hooks/useDisplayNameValidation';
import { toast } from 'sonner';
import { Camera, Check, X, Loader2 } from 'lucide-react';

interface ProfileSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function ProfileSetupDialog({ open, onOpenChange, onSuccess }: ProfileSetupDialogProps) {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [favoriteCamera, setFavoriteCamera] = useState('');
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameValidation, setNameValidation] = useState<{ valid: boolean; message?: string; available?: boolean }>({
    valid: true
  });
  
  const { mutate: createProfile, isPending } = useCreateProfile();

  // Debounce display name validation
  useEffect(() => {
    if (!displayName.trim()) {
      setNameValidation({ valid: true });
      return;
    }

    const timeoutId = setTimeout(async () => {
      const validation = validateDisplayName(displayName);
      
      if (!validation.valid) {
        setNameValidation(validation);
        return;
      }

      setIsCheckingName(true);
      const isAvailable = await checkDisplayNameAvailability(displayName);
      setNameValidation({
        valid: isAvailable,
        available: isAvailable,
        message: isAvailable ? '昵称可用' : '昵称已被使用，请选择其他名称'
      });
      setIsCheckingName(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [displayName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      toast.error('显示名称不能为空');
      return;
    }

    if (!nameValidation.valid || !nameValidation.available) {
      toast.error(nameValidation.message || '请检查昵称是否可用');
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
        if (error.message?.includes('unique_display_name')) {
          toast.error('昵称已被使用，请选择其他名称');
        } else {
          toast.error(error.message || '设置失败，请重试');
        }
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
              <div className="relative">
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="请输入您的显示名称"
                  maxLength={20}
                  required
                  className={`pr-8 ${
                    displayName && !nameValidation.valid ? 'border-destructive' : 
                    displayName && nameValidation.available ? 'border-green-500' : ''
                  }`}
                />
                <div className="absolute right-2 top-2.5">
                  {isCheckingName && displayName ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : displayName && nameValidation.valid && nameValidation.available ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : displayName && !nameValidation.valid ? (
                    <X className="h-4 w-4 text-destructive" />
                  ) : null}
                </div>
              </div>
              {displayName && nameValidation.message && (
                <p className={`text-xs ${
                  nameValidation.available ? 'text-green-600' : 'text-destructive'
                }`}>
                  {nameValidation.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {displayName.length}/20 • 昵称唯一且不可修改
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
                disabled={isPending || !displayName.trim() || !nameValidation.valid || !nameValidation.available || isCheckingName}
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