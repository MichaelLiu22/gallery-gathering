import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UploadPhotoData {
  title: string;
  description?: string;
  camera_equipment?: string;
  visibility: 'public' | 'friends' | 'private';
  file: File;
  exposure_settings?: {
    iso?: number;
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

      // Generate unique filename
      const fileExt = data.file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, data.file, {
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

      // Insert photo record
      const { data: photo, error: dbError } = await supabase
        .from('photos')
        .insert({
          title: data.title,
          description: data.description,
          image_url: urlData.publicUrl,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      toast.success('作品上传成功！');
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      toast.error(error.message || '上传失败，请重试');
    },
  });
};