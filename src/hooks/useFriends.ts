import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
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
  const query = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user?.id) throw new Error('Not authenticated');

      // Query friendships where current user is either user_id or friend_id
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          user_profile:profiles!user_id(display_name, avatar_url, user_id),
          friend_profile:profiles!friend_id(display_name, avatar_url, user_id)
        `)
        .eq('status', 'accepted')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (error) throw error;

      // Process friendships to get the correct friend info and scores
      const friendsWithScores = await Promise.all(
        (data || []).map(async (friendship) => {
          // Determine who is the friend (not the current user)
          const isUserIdCurrentUser = friendship.user_id === user.id;
          const friendId = isUserIdCurrentUser ? friendship.friend_id : friendship.user_id;
          const friendProfile = isUserIdCurrentUser ? friendship.friend_profile : friendship.user_profile;
          
          const { data: photoScore } = await supabase
            .rpc('get_user_photo_score', { user_uuid: friendId });
          
          return {
            ...friendship,
            friend_id: friendId,
            friend_profile: friendProfile ? {
              ...(friendProfile as any),
              photo_score: photoScore || 0
            } : null
          };
        })
      );

      return friendsWithScores;
    },
  });
  
  return query || { data: undefined, isLoading: false, error: null };
};

export const useFriendRequests = () => {
  const query = useQuery({
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
  
  return query || { data: undefined, isLoading: false, error: null };
};

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (receiverId: string) => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('friend_requests')
        .insert([
          {
            sender_id: user.id,
            receiver_id: receiverId,
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    },
  });
};

export const useAcceptFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      // Get the friend request details
      const { data: request, error: requestError } = await supabase
        .from('friend_requests')
        .select('sender_id, receiver_id')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      // Create friendship
      const { error: friendshipError } = await supabase
        .from('friendships')
        .insert([
          {
            user_id: request.receiver_id,
            friend_id: request.sender_id,
          },
          {
            user_id: request.sender_id,
            friend_id: request.receiver_id,
          }
        ]);

      if (friendshipError) throw friendshipError;

      // Update request status
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    },
  });
};

export const useRejectFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    },
  });
};

export const useRemoveFriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendId: string) => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
};