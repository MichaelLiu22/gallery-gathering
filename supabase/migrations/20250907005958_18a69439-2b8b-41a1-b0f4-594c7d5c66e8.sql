-- Fix the RLS policy condition for bidirectional friendship inserts

-- Drop the current policy 
DROP POLICY IF EXISTS "Users can create friendships and accept friend requests" ON public.friendships;

-- Create the corrected policy
CREATE POLICY "Users can create friendships and accept friend requests" 
ON public.friendships 
FOR INSERT 
WITH CHECK (
  -- Allow if current user is the user_id (normal case)
  auth.uid() = user_id 
  OR 
  -- Allow if current user is accepting a friend request
  -- For the reciprocal record: current user is receiver, the user_id is the sender
  EXISTS (
    SELECT 1 FROM friend_requests 
    WHERE receiver_id = auth.uid() 
    AND sender_id = user_id 
    AND status = 'pending'
  )
);