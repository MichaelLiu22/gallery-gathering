-- Drop existing conflicting storage policies
DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;

-- Create RLS policies for private storage buckets
CREATE POLICY "Users can view their own content in private buckets" ON storage.objects
FOR SELECT USING (
  bucket_id IN ('photos', 'thumbnails', 'originals') 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload to private buckets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id IN ('photos', 'thumbnails', 'originals') 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their private content" ON storage.objects
FOR UPDATE USING (
  bucket_id IN ('photos', 'thumbnails', 'originals') 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their private content" ON storage.objects
FOR DELETE USING (
  bucket_id IN ('photos', 'thumbnails', 'originals') 
  AND auth.uid()::text = (storage.foldername(name))[1]
);