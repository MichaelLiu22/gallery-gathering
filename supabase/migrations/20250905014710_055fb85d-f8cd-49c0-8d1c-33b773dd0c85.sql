-- Add unique constraint to prevent duplicate ratings from same user on same photo
ALTER TABLE photo_ratings 
ADD CONSTRAINT photo_ratings_user_id_photo_id_key 
UNIQUE (user_id, photo_id);

-- Also fix the column order in the constraint name to match the error message
-- The error mentioned "photos_ratings_photo_id_user_id_key" so let's also add that constraint
-- But first check if it already exists by trying to add it
ALTER TABLE photo_ratings 
ADD CONSTRAINT photos_ratings_photo_id_user_id_key 
UNIQUE (photo_id, user_id);