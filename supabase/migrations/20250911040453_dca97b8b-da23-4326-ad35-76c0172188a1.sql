-- 将thumbnails存储桶设置为public，避免URL过期问题
UPDATE storage.buckets 
SET public = true 
WHERE id = 'thumbnails';