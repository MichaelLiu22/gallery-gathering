import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDeletePhoto = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (photoId: number) => {
      // Get photo details first to delete storage files
      const { data: photo } = await supabase
        .from('photos')
        .select('image_url, image_urls')
        .eq('id', photoId)
        .single();

      if (photo) {
        // Delete from storage
        const imagesToDelete = [];
        
        if (photo.image_urls && Array.isArray(photo.image_urls)) {
          imagesToDelete.push(...photo.image_urls);
        } else if (photo.image_url) {
          imagesToDelete.push(photo.image_url);
        }
        
        // Extract file paths from URLs
        const pathsToDelete = imagesToDelete.map(url => {
          const urlParts = url.split('/photos/');
          return urlParts[1] || url;
        }).filter(Boolean);
        
        if (pathsToDelete.length > 0) {
          await supabase.storage
            .from('photos')
            .remove(pathsToDelete);
        }
      }
      
      // Delete the photo record
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      toast({
        title: "删除成功",
        description: "作品已删除",
      });
    },
    onError: (error) => {
      console.error('Delete photo error:', error);
      toast({
        title: "删除失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  });
};