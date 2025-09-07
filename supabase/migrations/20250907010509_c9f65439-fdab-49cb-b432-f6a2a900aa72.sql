-- Add unique constraint for display names and improve friend queries
-- First, add unique constraint to profiles display_name
ALTER TABLE profiles ADD CONSTRAINT unique_display_name UNIQUE (display_name);

-- Create a view for unique friends with their photo scores
CREATE OR REPLACE VIEW unique_friends AS
SELECT DISTINCT 
  CASE WHEN f.user_id < f.friend_id THEN f.user_id ELSE f.friend_id END as user1_id,
  CASE WHEN f.user_id < f.friend_id THEN f.friend_id ELSE f.user_id END as user2_id,
  CASE 
    WHEN f.user_id < f.friend_id THEN f.user_id 
    ELSE f.friend_id 
  END as requester_id,
  CASE 
    WHEN f.user_id < f.friend_id THEN f.friend_id 
    ELSE f.user_id 
  END as friend_id,
  f.created_at,
  f.status
FROM friendships f
WHERE f.status = 'accepted';

-- Create function to get user's average photo score
CREATE OR REPLACE FUNCTION get_user_photo_score(user_uuid UUID)
RETURNS DECIMAL(4,2)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(AVG(average_rating), 0.00)::DECIMAL(4,2)
  FROM photos 
  WHERE photographer_id = user_uuid 
  AND average_rating > 0;
$$;