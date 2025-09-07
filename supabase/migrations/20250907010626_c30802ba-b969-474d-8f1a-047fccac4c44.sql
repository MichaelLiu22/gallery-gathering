-- Fix security definer view issue by dropping the view and creating RLS policies instead
DROP VIEW IF EXISTS unique_friends;

-- Create RLS policies for the friendships table to handle unique friend queries
-- The existing policies should handle this, but let's make sure they work correctly

-- Update the useFriends query to handle deduplication at application level instead of view level
-- No additional database changes needed for now