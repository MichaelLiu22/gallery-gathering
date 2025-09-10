-- Phase 1: Friend System Optimization

-- Create RPC function for sending friend requests
CREATE OR REPLACE FUNCTION rpc_friend_request_create(receiver_uuid UUID)
RETURNS JSON 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  existing_request_id UUID;
  existing_friendship_id UUID;
  new_request_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check if trying to add self
  IF current_user_id = receiver_uuid THEN
    RETURN json_build_object('success', false, 'error', 'Cannot send friend request to yourself');
  END IF;

  -- Check if friendship already exists
  SELECT id INTO existing_friendship_id
  FROM friendships 
  WHERE ((user_id = current_user_id AND friend_id = receiver_uuid) 
         OR (user_id = receiver_uuid AND friend_id = current_user_id))
  AND status = 'accepted';

  IF existing_friendship_id IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Already friends');
  END IF;

  -- Check if request already exists
  SELECT id INTO existing_request_id
  FROM friend_requests 
  WHERE ((sender_id = current_user_id AND receiver_id = receiver_uuid)
         OR (sender_id = receiver_uuid AND receiver_id = current_user_id))
  AND status = 'pending';

  IF existing_request_id IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Friend request already exists');
  END IF;

  -- Create new friend request
  INSERT INTO friend_requests (sender_id, receiver_id, status)
  VALUES (current_user_id, receiver_uuid, 'pending')
  RETURNING id INTO new_request_id;

  RETURN json_build_object('success', true, 'request_id', new_request_id);
END;
$$;

-- Create RPC function for responding to friend requests
CREATE OR REPLACE FUNCTION rpc_friend_request_respond(request_uuid UUID, action TEXT)
RETURNS JSON 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  request_record friend_requests%ROWTYPE;
  friendship_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Validate action
  IF action NOT IN ('accept', 'reject') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid action');
  END IF;

  -- Get the friend request
  SELECT * INTO request_record
  FROM friend_requests 
  WHERE id = request_uuid AND receiver_id = current_user_id AND status = 'pending';

  IF request_record.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Friend request not found or not authorized');
  END IF;

  -- Update request status
  UPDATE friend_requests 
  SET status = action, updated_at = now()
  WHERE id = request_uuid;

  -- If accepted, create friendship
  IF action = 'accept' THEN
    INSERT INTO friendships (user_id, friend_id, status)
    VALUES (request_record.sender_id, request_record.receiver_id, 'accepted')
    RETURNING id INTO friendship_id;

    RETURN json_build_object('success', true, 'action', 'accepted', 'friendship_id', friendship_id);
  ELSE
    RETURN json_build_object('success', true, 'action', 'rejected');
  END IF;
END;
$$;

-- Create RPC function for removing friends
CREATE OR REPLACE FUNCTION rpc_friend_remove(friend_uuid UUID)
RETURNS JSON 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  deleted_count INTEGER;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Delete friendship (bidirectional)
  DELETE FROM friendships 
  WHERE ((user_id = current_user_id AND friend_id = friend_uuid) 
         OR (user_id = friend_uuid AND friend_id = current_user_id))
  AND status = 'accepted';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  IF deleted_count > 0 THEN
    RETURN json_build_object('success', true, 'message', 'Friendship removed');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Friendship not found');
  END IF;
END;
$$;

-- Create RPC function for getting friend list
CREATE OR REPLACE FUNCTION rpc_friend_list()
RETURNS TABLE(
  friend_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  photo_score NUMERIC,
  friendship_created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    CASE 
      WHEN f.user_id = current_user_id THEN f.friend_id 
      ELSE f.user_id 
    END as friend_id,
    p.display_name,
    p.avatar_url,
    COALESCE(get_user_photo_score(
      CASE 
        WHEN f.user_id = current_user_id THEN f.friend_id 
        ELSE f.user_id 
      END), 0) as photo_score,
    f.created_at as friendship_created_at
  FROM friendships f
  LEFT JOIN profiles p ON p.user_id = (
    CASE 
      WHEN f.user_id = current_user_id THEN f.friend_id 
      ELSE f.user_id 
    END)
  WHERE (f.user_id = current_user_id OR f.friend_id = current_user_id)
    AND f.status = 'accepted';
END;
$$;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_status 
ON friend_requests(receiver_id, status) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_status 
ON friend_requests(sender_id, status) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_friendships_user_friend_status 
ON friendships(user_id, friend_id, status) WHERE status = 'accepted';

CREATE INDEX IF NOT EXISTS idx_friendships_friend_user_status 
ON friendships(friend_id, user_id, status) WHERE status = 'accepted';

-- Phase 2: Enable Realtime for friend tables
ALTER TABLE friend_requests REPLICA IDENTITY FULL;
ALTER TABLE friendships REPLICA IDENTITY FULL;

-- Phase 3: Storage optimization - Make photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'photos';

-- Create thumbnails bucket (private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('thumbnails', 'thumbnails', false)
ON CONFLICT (id) DO NOTHING;

-- Create originals bucket (private) 
INSERT INTO storage.buckets (id, name, public) 
VALUES ('originals', 'originals', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for private buckets
CREATE POLICY "Users can view their own photos" ON storage.objects
FOR SELECT USING (
  bucket_id IN ('photos', 'thumbnails', 'originals') 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id IN ('photos', 'thumbnails', 'originals') 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own photos" ON storage.objects
FOR UPDATE USING (
  bucket_id IN ('photos', 'thumbnails', 'originals') 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own photos" ON storage.objects
FOR DELETE USING (
  bucket_id IN ('photos', 'thumbnails', 'originals') 
  AND auth.uid()::text = (storage.foldername(name))[1]
);