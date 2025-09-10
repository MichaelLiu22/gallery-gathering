import { supabase } from '@/integrations/supabase/client';

export async function safeUpload(file: File): Promise<{ originalUrl: string; thumbnailUrl: string; originalPath: string }> {
  if (!file) {
    throw new Error('No file provided');
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const ext = file.name.split('.').pop() ?? 'jpg';
  const fileName = `${Date.now()}.${ext}`;
  const originalPath = `${user.id}/originals/${fileName}`;

  // Upload to originals bucket (private)
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('originals')
    .upload(originalPath, file, { 
      upsert: false,
      cacheControl: '3600'
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    throw uploadError;
  }

  if (!uploadData?.path) {
    throw new Error('Upload success but no path');
  }

  try {
    // Generate thumbnail using Edge Function
    const { data: thumbnailData, error: thumbnailError } = await supabase.functions
      .invoke('generate-thumbnail', {
        body: {
          originalPath: uploadData.path,
          userId: user.id
        }
      });

    if (thumbnailError) {
      console.error('Thumbnail generation error:', thumbnailError);
      // Fallback: create signed URL for original image
      const { data: fallbackSignedUrl } = await supabase.storage
        .from('originals')
        .createSignedUrl(uploadData.path, 3600);
      
      return {
        originalUrl: fallbackSignedUrl?.signedUrl || '',
        thumbnailUrl: fallbackSignedUrl?.signedUrl || '',
        originalPath: uploadData.path
      };
    }

    return {
      originalUrl: thumbnailData.originalUrl,
      thumbnailUrl: thumbnailData.thumbnailUrl,
      originalPath: uploadData.path
    };
  } catch (error) {
    console.error('Error in thumbnail generation:', error);
    // Fallback: create signed URL for original image
    const { data: fallbackSignedUrl } = await supabase.storage
      .from('originals')
      .createSignedUrl(uploadData.path, 3600);
    
    return {
      originalUrl: fallbackSignedUrl?.signedUrl || '',
      thumbnailUrl: fallbackSignedUrl?.signedUrl || '',
      originalPath: uploadData.path
    };
  }
}

export async function safeUploadMultiple(files: File[]): Promise<{ originalUrls: string[]; thumbnailUrls: string[]; originalPaths: string[] }> {
  if (!files || files.length === 0) {
    throw new Error('No files provided');
  }

  const uploadPromises = files.map(file => safeUpload(file));
  const results = await Promise.all(uploadPromises);
  
  return {
    originalUrls: results.map(r => r.originalUrl),
    thumbnailUrls: results.map(r => r.thumbnailUrl),
    originalPaths: results.map(r => r.originalPath)
  };
}
