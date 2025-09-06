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
import { AlertTriangle } from "lucide-react";

interface DeletePhotoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  photoTitle: string;
  isLoading?: boolean;
}

export default function DeletePhotoDialog({
  open,
  onOpenChange,
  onConfirm,
  photoTitle,
  isLoading = false
}: DeletePhotoDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            删除作品
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              确认删除作品 <span className="font-medium text-foreground">"{photoTitle}"</span> 吗？
            </p>
            <p className="text-destructive font-medium">
              ⚠️ 此操作不可撤销！删除后将永久丢失该作品的所有数据，包括：
            </p>
            <ul className="list-disc list-inside ml-4 text-sm space-y-1">
              <li>作品图片和描述</li>
              <li>所有点赞和评论</li>
              <li>所有评分数据</li>
              <li>浏览量统计</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>取消</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? '删除中...' : '确认删除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}