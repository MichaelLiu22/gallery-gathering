-- Fix friendships table RLS policy to allow bidirectional inserts during friend request acceptance

-- Drop the existing restrictive insert policy
DROP POLICY IF EXISTS "Users can create friendships" ON public.friendships;

-- Create a more flexible insert policy that allows:
-- 1. Users to create friendships where they are the user_id (original behavior)
-- 2. Users to create friendships when accepting a friend request (bidirectional)
CREATE POLICY "Users can create friendships and accept friend requests" 
ON public.friendships 
FOR INSERT 
WITH CHECK (
  -- Allow if current user is the user_id (normal case)
  auth.uid() = user_id 
  OR 
  -- Allow if current user is accepting a friend request
  -- (user is receiver_id of a pending friend request from friend_id to user_id)
  EXISTS (
    SELECT 1 FROM friend_requests 
    WHERE receiver_id = auth.uid() 
    AND sender_id = friend_id 
    AND status = 'pending'
  )
);