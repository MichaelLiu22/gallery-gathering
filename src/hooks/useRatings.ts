import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Rating {
  id: string;
  photo_id: number;
  user_id: string;
  composition_score: number;
  storytelling_score: number;
  technique_score: number;
  average_score: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string;
    avatar_url: string;
  };
}

export interface RatingInput {
  composition_score: number;
  storytelling_score: number;
  technique_score: number;
}

export const useRatings = (photoId: number) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get ratings for a photo
  const { data: ratingsData, isLoading } = useQuery({
    queryKey: ['photo-ratings', photoId],
    queryFn: async () => {
      // Get user profiles manually to avoid relationship issues
      const { data: ratings, error } = await supabase
        .from('photo_ratings')
        .select(`
          id,
          photo_id,
          user_id,
          composition_score,
          storytelling_score,
          technique_score,
          average_score,
          created_at,
          updated_at
        `)
        .eq('photo_id', photoId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      if (ratings && ratings.length > 0) {
        const userIds = ratings.map(r => r.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Merge profiles with ratings
        const ratingsWithProfiles = ratings.map(rating => ({
          ...rating,
          profiles: profiles?.find(p => p.user_id === rating.user_id) || null
        })) as Rating[];
        const userRating = user ? ratingsWithProfiles.find(r => r.user_id === user.id) : null;
        
        // Calculate overall averages
        const overallStats = ratingsWithProfiles.length > 0 ? {
          averageComposition: ratingsWithProfiles.reduce((sum, r) => sum + r.composition_score, 0) / ratingsWithProfiles.length,
          averageStorytelling: ratingsWithProfiles.reduce((sum, r) => sum + r.storytelling_score, 0) / ratingsWithProfiles.length,
          averageTechnique: ratingsWithProfiles.reduce((sum, r) => sum + r.technique_score, 0) / ratingsWithProfiles.length,
          overallAverage: ratingsWithProfiles.reduce((sum, r) => sum + r.average_score, 0) / ratingsWithProfiles.length,
          totalRatings: ratingsWithProfiles.length
        } : {
          averageComposition: 0,
          averageStorytelling: 0,
          averageTechnique: 0,
          overallAverage: 0,
          totalRatings: 0
        };

        return {
          ratings: ratingsWithProfiles,
          userRating,
          stats: overallStats
        };
      } else {
        return {
          ratings: [],
          userRating: null,
          stats: {
            averageComposition: 0,
            averageStorytelling: 0,
            averageTechnique: 0,
            overallAverage: 0,
            totalRatings: 0
          }
        };
      }
    },
  });

  // Add or update rating mutation
  const submitRating = useMutation({
    mutationFn: async (ratingInput: RatingInput) => {
      if (!user) {
        throw new Error('必须登录才能评分');
      }

      // Use upsert with the correct conflict resolution
      const { error } = await supabase
        .from('photo_ratings')
        .upsert({
          photo_id: photoId,
          user_id: user.id,
          composition_score: ratingInput.composition_score,
          storytelling_score: ratingInput.storytelling_score,
          technique_score: ratingInput.technique_score
        }, {
          onConflict: 'photo_id,user_id',
          ignoreDuplicates: false
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photo-ratings', photoId] });
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      queryClient.invalidateQueries({ queryKey: ['photo-likes'] });
      toast({
        title: "评分成功",
        description: "您的评分已保存",
      });
    },
    onError: (error: any) => {
      toast({
        title: "评分失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete rating mutation
  const deleteRating = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error('必须登录才能删除评分');
      }

      const { error } = await supabase
        .from('photo_ratings')
        .delete()
        .eq('photo_id', photoId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photo-ratings', photoId] });
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      queryClient.invalidateQueries({ queryKey: ['photo-likes'] });
      toast({
        title: "评分已删除",
        description: "您的评分已删除",
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
    ratings: ratingsData?.ratings || [],
    userRating: ratingsData?.userRating || null,
    stats: ratingsData?.stats || {
      averageComposition: 0,
      averageStorytelling: 0,
      averageTechnique: 0,
      overallAverage: 0,
      totalRatings: 0
    },
    isLoading,
    submitRating: submitRating.mutate,
    deleteRating: deleteRating.mutate,
    isSubmitting: submitRating.isPending,
    isDeleting: deleteRating.isPending,
  };
};