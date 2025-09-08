import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UploadPhotoData {
  title: string;
  description?: string;
  camera_equipment?: string;
  visibility: 'public' | 'friends' | 'private';
  files: File[]; // Changed from single file to array
  exposure_settings?: {
    iso?: string;
    aperture?: string;
    shutter_speed?: string;
    focal_length?: string;
  };
}

export const useUploadPhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UploadPhotoData) => {
      const authResult = await supabase.auth.getUser();
      if (!authResult?.data?.user) {
        throw new Error('User not authenticated');
      }
      const user = authResult.data.user;

      // Upload all files and collect URLs
      const imageUrls: string[] = [];
      
      for (let i = 0; i < data.files.length; i++) {
        const file = data.files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${i}.${fileExt}`;

        // Upload file to storage
        const uploadResult = await supabase.storage
          .from('photos')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (!uploadResult) {
          throw new Error('Upload failed - no result returned');
        }

        if (uploadResult.error) {
          throw uploadResult.error;
        }

        // Get public URL
        const urlResult = supabase.storage
          .from('photos')
          .getPublicUrl(fileName);

        if (!urlResult?.data?.publicUrl) {
          throw new Error('Failed to get public URL');
        }

        imageUrls.push(urlResult.data.publicUrl);
      }

      // Insert photo record with image array
      const insertResult = await supabase
        .from('photos')
        .insert({
          title: data.title,
          description: data.description,
          image_url: imageUrls[0], // Keep the first image for backward compatibility
          image_urls: imageUrls, // New field for gallery support
          camera_equipment: data.camera_equipment,
          exposure_settings: data.exposure_settings,
          visibility: data.visibility,
          photographer_id: user.id,
        })
        .select()
        .single();

      if (!insertResult) {
        throw new Error('Database insert failed - no result returned');
      }

      if (insertResult.error) {
        throw insertResult.error;
      }

      const photo = insertResult.data;
      if (!photo) {
        throw new Error('No photo data returned after insert');
      }

      return photo;
    },
    onSuccess: (photo) => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      const imageCount = Array.isArray(photo.image_urls) ? photo.image_urls.length : 1;
      toast.success(`作品发布成功！${imageCount > 1 ? `共${imageCount}张图片` : ''}`);
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      toast.error(error.message || '上传失败，请重试');
    },
  });
};