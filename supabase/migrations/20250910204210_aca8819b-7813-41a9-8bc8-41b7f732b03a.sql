-- Create missing storage buckets for the upload system
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('originals', 'originals', false),
  ('thumbnails', 'thumbnails', false);

-- Create RLS policies for originals bucket (private)
CREATE POLICY "Users can upload their own originals" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'originals' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own originals" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'originals' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own originals" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'originals' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create RLS policies for thumbnails bucket (private)
CREATE POLICY "Users can upload their own thumbnails" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own thumbnails" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own thumbnails" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create missing RPC functions for friend system
CREATE OR REPLACE FUNCTION public.rpc_friend_list(user_uuid uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  friend_id uuid,
  display_name text,
  avatar_url text,
  status text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    f.id,
    f.user_id,
    f.friend_id,
    COALESCE(p.display_name, '未设置昵称') as display_name,
    p.avatar_url,
    f.status,
    f.created_at
  FROM friendships f
  LEFT JOIN profiles p ON (
    CASE 
      WHEN f.user_id = user_uuid THEN p.user_id = f.friend_id
      ELSE p.user_id = f.user_id 
    END
  )
  WHERE (f.user_id = user_uuid OR f.friend_id = user_uuid)
  AND f.status = 'accepted';
$$;

CREATE OR REPLACE FUNCTION public.rpc_friend_request_create(target_username text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
  current_user_id uuid;
  existing_friendship_count int;
  existing_request_count int;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- Find target user by display_name
  SELECT user_id INTO target_user_id 
  FROM profiles 
  WHERE display_name = target_username 
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Check if trying to add self
  IF target_user_id = current_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot add yourself');
  END IF;

  -- Check existing friendship
  SELECT COUNT(*) INTO existing_friendship_count
  FROM friendships 
  WHERE ((user_id = current_user_id AND friend_id = target_user_id) 
         OR (user_id = target_user_id AND friend_id = current_user_id))
  AND status = 'accepted';

  IF existing_friendship_count > 0 THEN
    RETURN json_build_object('success', false, 'error', 'Already friends');
  END IF;

  -- Check existing request
  SELECT COUNT(*) INTO existing_request_count
  FROM friend_requests 
  WHERE ((sender_id = current_user_id AND receiver_id = target_user_id) 
         OR (sender_id = target_user_id AND receiver_id = current_user_id))
  AND status = 'pending';

  IF existing_request_count > 0 THEN
    RETURN json_build_object('success', false, 'error', 'Request already sent');
  END IF;

  -- Create friend request
  INSERT INTO friend_requests (sender_id, receiver_id, status)
  VALUES (current_user_id, target_user_id, 'pending');

  RETURN json_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_friend_request_respond(request_id uuid, accept_request boolean)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  request_sender_id uuid;
  request_receiver_id uuid;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- Get request details
  SELECT sender_id, receiver_id INTO request_sender_id, request_receiver_id
  FROM friend_requests 
  WHERE id = request_id AND receiver_id = current_user_id AND status = 'pending';

  IF request_sender_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Request not found');
  END IF;

  IF accept_request THEN
    -- Accept: Create friendship and update request
    INSERT INTO friendships (user_id, friend_id, status)
    VALUES (request_sender_id, request_receiver_id, 'accepted');
    
    UPDATE friend_requests 
    SET status = 'accepted', updated_at = now()
    WHERE id = request_id;
  ELSE
    -- Reject: Update request status
    UPDATE friend_requests 
    SET status = 'rejected', updated_at = now()
    WHERE id = request_id;
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_friend_remove(friendship_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  friendship_exists boolean;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- Check if friendship exists and user has permission
  SELECT EXISTS(
    SELECT 1 FROM friendships 
    WHERE id = friendship_id 
    AND (user_id = current_user_id OR friend_id = current_user_id)
  ) INTO friendship_exists;

  IF NOT friendship_exists THEN
    RETURN json_build_object('success', false, 'error', 'Friendship not found');
  END IF;

  -- Remove friendship
  DELETE FROM friendships WHERE id = friendship_id;

  RETURN json_build_object('success', true);
END;
$$;