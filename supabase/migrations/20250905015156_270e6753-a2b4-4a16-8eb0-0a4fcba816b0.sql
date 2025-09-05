-- Add primary key to profiles table
-- First drop the foreign key constraints we just added since they won't work without a primary key
ALTER TABLE photo_ratings DROP CONSTRAINT IF EXISTS fk_photo_ratings_user_id;

-- Add primary key to profiles table
ALTER TABLE profiles ADD PRIMARY KEY (user_id);

-- Now re-add the foreign key constraint
ALTER TABLE photo_ratings 
ADD CONSTRAINT fk_photo_ratings_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(user_id);