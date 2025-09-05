-- Add foreign key relationship between photo_ratings and profiles
-- First check if profiles table exists and has the right structure
ALTER TABLE photo_ratings 
ADD CONSTRAINT fk_photo_ratings_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(user_id);

-- Also add foreign key to photos table
ALTER TABLE photo_ratings 
ADD CONSTRAINT fk_photo_ratings_photo_id 
FOREIGN KEY (photo_id) REFERENCES photos(id);