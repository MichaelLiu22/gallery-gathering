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
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user?.id) throw new Error('未登录');

      const { data: profile, error } = await supabase
        .from('profiles')
        .insert([{
          user_id: user.id,
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
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) throw new Error('未登录');

      // 使用 upsert 操作，如果记录存在则更新，不存在则创建
      const { data: profile, error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: data.display_name,
          bio: data.bio,
          favorite_camera: data.favorite_camera,
          avatar_url: data.avatar_url,
        })
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
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: authData } = await supabase.auth.getUser();
        targetUserId = authData?.user?.id;
      }
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