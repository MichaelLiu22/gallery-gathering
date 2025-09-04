import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Photo {
  id: number;
  title: string;
  description: string | null;
  image_url: string;
  camera_equipment: string | null;
  exposure_settings: any;
  likes_count: number;
  views_count: number;
  created_at: string;
  photographer_id: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const usePhotos = () => {
  return useQuery({
    queryKey: ['photos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photos')
        .select(`
          *,
          profiles:photographer_id (
            display_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data as Photo[];
    },
  });
};