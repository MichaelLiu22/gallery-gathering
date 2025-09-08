import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export const useLikes = (photoId: number) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get likes count for a photo
  const { data: likesData } = useQuery({
    queryKey: ['photo-likes', photoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photo_likes')
        .select('id, user_id')
        .eq('photo_id', photoId);

      if (error) throw error;
      
      const likesCount = data.length;
      const userHasLiked = user ? data.some(like => like.user_id === user.id) : false;
      
      return {
        likesCount,
        userHasLiked,
        likes: data
      };
    },
  });

  // Toggle like mutation
  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error('必须登录才能点赞');
      }

      // First check current state from database to avoid race conditions
      const { data: existingLike } = await supabase
        .from('photo_likes')
        .select('id')
        .eq('photo_id', photoId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingLike) {
        // Remove like
        const { error } = await supabase
          .from('photo_likes')
          .delete()
          .eq('photo_id', photoId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Add like - use upsert to handle race conditions
        const { error } = await supabase
          .from('photo_likes')
          .upsert({
            photo_id: photoId,
            user_id: user.id
          }, {
            onConflict: 'user_id,photo_id'
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photo-likes', photoId] });
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
    onError: (error: any) => {
      toast({
        title: "操作失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    likesCount: likesData?.likesCount || 0,
    userHasLiked: likesData?.userHasLiked || false,
    toggleLike: toggleLike.mutate,
    isToggling: toggleLike.isPending,
  };
};