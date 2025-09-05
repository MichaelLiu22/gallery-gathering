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
  comments_count?: number;
  average_rating?: number | null;
  ratings_count?: number | null;
  created_at: string;
  photographer_id: string;
  visibility: 'public' | 'friends' | 'private';
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export type SortOrder = 'latest' | 'likes' | 'comments' | 'hot';
export type PhotoFilter = 'all' | 'friends' | 'mine';

// 火热度计算函数 - 空实现，等待用户提供算法
export const calculateHotness = (photo: Photo): number => {
  // TODO: 用户会提供火热度计算的分段函数
  // 暂时返回一个基础的计算值
  return photo.likes_count * 2 + photo.views_count * 0.1;
};

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

      // Apply initial sorting (except for comments and hot which need post-processing)
      switch (sortOrder) {
        case 'likes':
          query = query.order('likes_count', { ascending: false });
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

      let processedData = data as Photo[];

      // Get comments count for all photos
      const photosWithComments = await Promise.all(
        processedData.map(async (photo) => {
          const { count } = await supabase
            .from('photo_comments')
            .select('*', { count: 'exact', head: true })
            .eq('photo_id', photo.id);
          
          return {
            ...photo,
            comments_count: count || 0
          };
        })
      );

      processedData = photosWithComments;
      
      // Apply sorting that requires post-processing
      if (sortOrder === 'comments') {
        processedData = processedData.sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));
      } else if (sortOrder === 'hot') {
        // 计算火热度并排序
        processedData = processedData
          .map(photo => ({
            ...photo,
            hotness: calculateHotness(photo)
          }))
          .sort((a, b) => (b.hotness || 0) - (a.hotness || 0));
      }

      return processedData;
    },
  });
};