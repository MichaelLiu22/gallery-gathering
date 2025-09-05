-- Remove duplicate constraints and keep only one unique constraint
ALTER TABLE photo_ratings 
DROP CONSTRAINT IF EXISTS photo_ratings_user_id_photo_id_key;

-- Keep the constraint that matches the error message format
-- The error mentioned "photos_ratings_photo_id_user_id_key" 

-- First check if any existing data violates the constraint
DELETE FROM photo_ratings 
WHERE id NOT IN (
    SELECT DISTINCT ON (photo_id, user_id) id 
    FROM photo_ratings 
    ORDER BY photo_id, user_id, created_at DESC
);

-- Now ensure we have the right constraint for upsert to work
-- Upsert needs the constraint to be on the exact columns we're upserting on