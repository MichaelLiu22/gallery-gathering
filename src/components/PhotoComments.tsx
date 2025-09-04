import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Trash2, MessageCircle } from 'lucide-react';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface PhotoCommentsProps {
  photoId: number;
}

export default function PhotoComments({ photoId }: PhotoCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();
  const { comments, addComment, deleteComment, isAddingComment, isDeletingComment } = useComments(photoId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    addComment(newComment);
    setNewComment('');
  };

  const handleDelete = (commentId: string) => {
    if (window.confirm('确定要删除这条评论吗？')) {
      deleteComment(commentId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <MessageCircle className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">评论 ({comments.length})</h3>
      </div>

      {/* Comment Form */}
      {user && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="写下你的评论..."
              className="resize-none"
              rows={3}
            />
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={!newComment.trim() || isAddingComment}
                size="sm"
              >
                {isAddingComment ? '发布中...' : '发布评论'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>暂无评论，来发表第一条评论吧！</p>
          </div>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="p-4">
              <div className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                  <AvatarFallback>
                    {comment.profiles?.display_name?.charAt(0) || '匿'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">
                        {comment.profiles?.display_name || '匿名用户'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                          locale: zhCN
                        })}
                      </span>
                    </div>
                    {user && user.id === comment.user_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(comment.id)}
                        disabled={isDeletingComment}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {!user && (
        <div className="text-center py-4 text-muted-foreground">
          <p>登录后即可发表评论</p>
        </div>
      )}
    </div>
  );
}