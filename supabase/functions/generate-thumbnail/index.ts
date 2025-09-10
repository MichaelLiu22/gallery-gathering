import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { originalPath, userId } = await req.json();

    if (!originalPath || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing originalPath or userId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Processing thumbnail for:', originalPath);

    // Download the original image
    const { data: imageData, error: downloadError } = await supabase.storage
      .from('originals')
      .download(originalPath);

    if (downloadError) {
      console.error('Error downloading original:', downloadError);
      return new Response(
        JSON.stringify({ error: 'Failed to download original image' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Convert blob to array buffer for processing
    const arrayBuffer = await imageData.arrayBuffer();
    
    // Create a simple thumbnail by resizing (basic implementation)
    // In a production environment, you might want to use a proper image processing library
    const thumbnailBuffer = await resizeImage(arrayBuffer, 800);

    // Create thumbnail path
    const fileName = originalPath.split('/').pop();
    const thumbnailPath = `${userId}/thumbnails/${fileName}`;

    // Upload thumbnail
    const { error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(thumbnailPath, thumbnailBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading thumbnail:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload thumbnail' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Generate signed URLs
    const { data: originalSignedUrl } = await supabase.storage
      .from('originals')
      .createSignedUrl(originalPath, 3600); // 1 hour

    const { data: thumbnailSignedUrl } = await supabase.storage
      .from('thumbnails')
      .createSignedUrl(thumbnailPath, 3600); // 1 hour

    return new Response(
      JSON.stringify({
        success: true,
        originalUrl: originalSignedUrl?.signedUrl,
        thumbnailUrl: thumbnailSignedUrl?.signedUrl,
        thumbnailPath
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-thumbnail function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Basic image resizing function using Canvas API
async function resizeImage(arrayBuffer: ArrayBuffer, maxWidth: number): Promise<Uint8Array> {
  try {
    // Create a simple thumbnail by returning the original for now
    // In production, you'd want to use proper image processing
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error('Error resizing image:', error);
    throw error;
  }
}