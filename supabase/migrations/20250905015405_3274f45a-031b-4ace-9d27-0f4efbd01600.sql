-- Add the correct unique constraint with the exact name from the error message
ALTER TABLE photo_ratings 
ADD CONSTRAINT photos_ratings_photo_id_user_id_key 
UNIQUE (photo_id, user_id);