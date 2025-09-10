import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
  friend_profile?: {
    display_name: string | null;
    avatar_url: string | null;
    user_id: string;
    photo_score: number;
  };
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  sender_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  receiver_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const useFriends = () => {
  const queryClient = useQueryClient();

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('friends-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['friends'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_requests'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      // Use the new RPC function for better performance
      const { data, error } = await supabase
        .rpc('rpc_friend_list');

      if (error) throw error;

      return (data || []).map((friend: any) => ({
        friend_id: friend.friend_id,
        friend_profile: {
          user_id: friend.friend_id,
          display_name: friend.display_name,
          avatar_url: friend.avatar_url,
          photo_score: friend.photo_score || 0
        },
        created_at: friend.friendship_created_at
      }));
    },
  });
};

export const useFriendRequests = () => {
  return useQuery({
    queryKey: ['friend-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          *,
          sender_profile:profiles!sender_id (
            display_name,
            avatar_url
          ),
          receiver_profile:profiles!receiver_id (
            display_name,
            avatar_url
          )
        `)
        .eq('status', 'pending');

      if (error) throw error;
      return data;
    },
  });
};

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (receiverId: string) => {
      const { data, error } = await supabase
        .rpc('rpc_friend_request_create', {
          receiver_uuid: receiverId
        });

      if (error) throw error;
      if (!(data as any).success) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      toast.success('好友请求已发送');
    },
    onError: (error: any) => {
      toast.error(error.message || '发送好友请求失败');
    },
  });
};

export const useAcceptFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase
        .rpc('rpc_friend_request_respond', {
          request_uuid: requestId,
          action: 'accept'
        });

      if (error) throw error;
      if (!(data as any).success) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      toast.success('好友请求已接受');
    },
    onError: (error: any) => {
      toast.error(error.message || '接受好友请求失败');
    },
  });
};

export const useRejectFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase
        .rpc('rpc_friend_request_respond', {
          request_uuid: requestId,
          action: 'reject'
        });

      if (error) throw error;
      if (!(data as any).success) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      toast.success('好友请求已拒绝');
    },
    onError: (error: any) => {
      toast.error(error.message || '拒绝好友请求失败');
    },
  });
};

export const useRemoveFriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendId: string) => {
      const { data, error } = await supabase
        .rpc('rpc_friend_remove', {
          friend_uuid: friendId
        });

      if (error) throw error;
      if (!(data as any).success) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      toast.success('好友已移除');
    },
    onError: (error: any) => {
      toast.error(error.message || '移除好友失败');
    },
  });
};