import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  favorite_camera: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProfileData {
  display_name: string;
  bio?: string;
  favorite_camera?: string;
  avatar_url?: string;
}

export const useCreateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateProfileData) => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .insert([{
          user_id: (await supabase.auth.getUser()).data.user?.id,
          display_name: data.display_name,
          bio: data.bio || null,
          favorite_camera: data.favorite_camera || null,
          avatar_url: data.avatar_url || null,
        }])
        .select()
        .single();

      if (error) throw error;
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<CreateProfileData>) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('未登录');

      const { data: profile, error } = await supabase
        .from('profiles')
        .update({
          display_name: data.display_name,
          bio: data.bio,
          favorite_camera: data.favorite_camera,
          avatar_url: data.avatar_url,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useProfile = (userId?: string) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      if (!targetUserId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (error) throw error;
      return data as UserProfile | null;
    },
    enabled: !!userId || !!supabase.auth.getUser(),
  });
};