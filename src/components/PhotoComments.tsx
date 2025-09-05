import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useComments, Comment } from '@/hooks/useComments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Reply, Trash2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface PhotoCommentsProps {
  photoId: number;
}

export default function PhotoComments({ photoId }: PhotoCommentsProps) {
  const { user } = useAuth();
  const { comments, isLoading, addComment, deleteComment, isAddingComment, isDeletingComment } = useComments(photoId);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      addComment({ content: newComment });
      setNewComment('');
    }
  };

  const handleSubmitReply = (parentId: string) => {
    if (replyContent.trim()) {
      addComment({ content: replyContent, parentId });
      setReplyContent('');
      setReplyingTo(null);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment(commentId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">
            加载评论中...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5" />
          <span>评论 ({comments.length})</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Add Comment Form */}
        {user ? (
          <div className="space-y-3">
            <Textarea
              placeholder="写下您的评论..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isAddingComment}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                {isAddingComment ? '发布中...' : '发布评论'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p>登录后可以发表评论</p>
          </div>
        )}

        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>还没有评论，来发表第一个评论吧！</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                user={user}
                onDelete={handleDeleteComment}
                onReply={(commentId) => setReplyingTo(commentId)}
                replyingTo={replyingTo}
                replyContent={replyContent}
                setReplyContent={setReplyContent}
                onSubmitReply={handleSubmitReply}
                onCancelReply={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                }}
                isDeletingComment={isDeletingComment}
                isAddingComment={isAddingComment}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CommentItemProps {
  comment: Comment;
  user: any;
  onDelete: (commentId: string) => void;
  onReply: (commentId: string) => void;
  replyingTo: string | null;
  replyContent: string;
  setReplyContent: (content: string) => void;
  onSubmitReply: (parentId: string) => void;
  onCancelReply: () => void;
  isDeletingComment: boolean;
  isAddingComment: boolean;
}

function CommentItem({
  comment,
  user,
  onDelete,
  onReply,
  replyingTo,
  replyContent,
  setReplyContent,
  onSubmitReply,
  onCancelReply,
  isDeletingComment,
  isAddingComment,
}: CommentItemProps) {
  return (
    <div className="space-y-3">
      {/* Main Comment */}
      <div className="flex space-x-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.profiles?.avatar_url || undefined} />
          <AvatarFallback className="text-sm">
            {comment.profiles?.display_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-1">
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
          
          <p className="text-sm leading-relaxed">{comment.content}</p>
          
          <div className="flex items-center space-x-2 pt-1">
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply(comment.id)}
                className="h-6 px-2 text-xs"
              >
                <Reply className="h-3 w-3 mr-1" />
                回复
              </Button>
            )}
            {user && user.id === comment.user_id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(comment.id)}
                disabled={isDeletingComment}
                className="h-6 px-2 text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                删除
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Reply Form */}
      {replyingTo === comment.id && (
        <div className="ml-11 space-y-2">
          <Textarea
            placeholder={`回复 ${comment.profiles?.display_name || '匿名用户'}...`}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="min-h-[60px] text-sm"
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelReply}
            >
              取消
            </Button>
            <Button
              onClick={() => onSubmitReply(comment.id)}
              disabled={!replyContent.trim() || isAddingComment}
              size="sm"
            >
              {isAddingComment ? '回复中...' : '回复'}
            </Button>
          </div>
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 space-y-3 border-l border-border pl-4">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex space-x-3">
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarImage src={reply.profiles?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {reply.profiles?.display_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-xs">
                    {reply.profiles?.display_name || '匿名用户'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(reply.created_at), { 
                      addSuffix: true, 
                      locale: zhCN 
                    })}
                  </span>
                </div>
                
                <p className="text-xs leading-relaxed">{reply.content}</p>
                
                {user && user.id === reply.user_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(reply.id)}
                    disabled={isDeletingComment}
                    className="h-5 px-1 text-xs text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-2 w-2 mr-1" />
                    删除
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}