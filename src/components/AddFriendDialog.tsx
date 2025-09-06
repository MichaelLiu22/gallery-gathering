import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AddFriendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  userName: string;
  isLoading?: boolean;
}

export default function AddFriendDialog({
  open,
  onOpenChange,
  onConfirm,
  userName,
  isLoading = false
}: AddFriendDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>添加好友</AlertDialogTitle>
          <AlertDialogDescription>
            确认是否添加 <span className="font-medium text-foreground">"{userName}"</span> 为好友？
            <br />
            对方将收到您的好友请求。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>取消</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-gradient-to-r from-primary to-accent"
          >
            {isLoading ? '发送中...' : '确认添加'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}