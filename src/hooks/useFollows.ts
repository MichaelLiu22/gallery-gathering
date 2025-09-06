import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  updated_at: string;
}

// Hook to get users that the current user is following
export const useFollowing = () => {
  return useQuery({
    queryKey: ['following'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('follows')
        .select(`
          *,
          profiles!follows_following_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .eq('follower_id', user.id);

      if (error) throw error;
      return data || [];
    },
  });
};

// Hook to get users that follow the current user
export const useFollowers = () => {
  return useQuery({
    queryKey: ['followers'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('follows')
        .select(`
          *,
          profiles!follows_follower_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .eq('following_id', user.id);

      if (error) throw error;
      return data || [];
    },
  });
};

// Hook to check if current user is following someone
export const useIsFollowing = (userId: string) => {
  return useQuery({
    queryKey: ['isFollowing', userId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !userId) return false;

      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!userId,
  });
};

// Hook to follow a user
export const useFollowUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (followingId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('未登录');

      const { data, error } = await supabase
        .from('follows')
        .insert([{
          follower_id: user.id,
          following_id: followingId,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
    },
  });
};

// Hook to unfollow a user
export const useUnfollowUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (followingId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('未登录');

      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', followingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
    },
  });
};

// Hook to get follow counts for a user
export const useFollowCounts = (userId: string) => {
  return useQuery({
    queryKey: ['followCounts', userId],
    queryFn: async () => {
      if (!userId) return { followersCount: 0, followingCount: 0 };

      const [followersResult, followingResult] = await Promise.all([
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId)
      ]);

      return {
        followersCount: followersResult.count || 0,
        followingCount: followingResult.count || 0,
      };
    },
    enabled: !!userId,
  });
};