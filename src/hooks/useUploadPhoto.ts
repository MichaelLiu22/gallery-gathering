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
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Upload all files and collect URLs
      const imageUrls: string[] = [];
      
      for (let i = 0; i < data.files.length; i++) {
        const file = data.files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${i}.${fileExt}`;

        // Upload file to storage
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('photos')
          .getPublicUrl(fileName);

        imageUrls.push(urlData.publicUrl);
      }

      // Insert photo record with image array
      const { data: photo, error: dbError } = await supabase
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

      if (dbError) {
        throw dbError;
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