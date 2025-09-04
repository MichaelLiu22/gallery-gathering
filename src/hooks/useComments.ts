import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const useComments = (photoId: number) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get comments for a photo
  const { data: comments, isLoading } = useQuery({
    queryKey: ['photo-comments', photoId],
    queryFn: async () => {
      // First get comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('photo_comments')
        .select('*')
        .eq('photo_id', photoId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Get unique user IDs from comments
      const userIds = [...new Set(commentsData.map(comment => comment.user_id))];

      // Get profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Map profiles to comments
      const commentsWithProfiles = commentsData.map(comment => ({
        ...comment,
        profiles: profilesData.find(profile => profile.user_id === comment.user_id) || null
      }));

      return commentsWithProfiles as Comment[];
    },
  });

  // Add comment mutation
  const addComment = useMutation({
    mutationFn: async (content: string) => {
      if (!user) {
        throw new Error('必须登录才能评论');
      }

      const { error } = await supabase
        .from('photo_comments')
        .insert({
          photo_id: photoId,
          user_id: user.id,
          content: content.trim()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photo-comments', photoId] });
      toast({
        title: "评论成功",
        description: "您的评论已发布",
      });
    },
    onError: (error: any) => {
      toast({
        title: "评论失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user) {
        throw new Error('必须登录才能删除评论');
      }

      const { error } = await supabase
        .from('photo_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photo-comments', photoId] });
      toast({
        title: "删除成功",
        description: "评论已删除",
      });
    },
    onError: (error: any) => {
      toast({
        title: "删除失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    comments: comments || [],
    isLoading,
    addComment: addComment.mutate,
    deleteComment: deleteComment.mutate,
    isAddingComment: addComment.isPending,
    isDeletingComment: deleteComment.isPending,
  };
};