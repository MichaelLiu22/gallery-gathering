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
  visibility: 'public' | 'friends' | 'private';
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export type SortOrder = 'latest' | 'likes' | 'views';
export type PhotoFilter = 'all' | 'friends' | 'mine';

export const usePhotos = (sortOrder: SortOrder = 'latest', filter: PhotoFilter = 'all') => {
  return useQuery({
    queryKey: ['photos', sortOrder, filter],
    queryFn: async () => {
      let query = supabase
        .from('photos')
        .select(`
          *,
          profiles:photographer_id (
            display_name,
            avatar_url
          )
        `);

      // Apply sorting
      switch (sortOrder) {
        case 'likes':
          query = query.order('likes_count', { ascending: false });
          break;
        case 'views':
          query = query.order('views_count', { ascending: false });
          break;
        case 'latest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as Photo[];
    },
  });
};