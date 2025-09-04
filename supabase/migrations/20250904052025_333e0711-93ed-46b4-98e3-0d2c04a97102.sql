-- Add visibility field to photos table
ALTER TABLE public.photos 
ADD COLUMN visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'private'));

-- Create friendships table
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Create friend_requests table  
CREATE TABLE public.friend_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Enable Row Level Security
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for friendships
CREATE POLICY "Users can view their own friendships" 
ON public.friendships 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships" 
ON public.friendships 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own friendships" 
ON public.friendships 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their own friendships" 
ON public.friendships 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for friend_requests
CREATE POLICY "Users can view their own friend requests" 
ON public.friend_requests 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create friend requests" 
ON public.friend_requests 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received friend requests" 
ON public.friend_requests 
FOR UPDATE 
USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own friend requests" 
ON public.friend_requests 
FOR DELETE 
USING (auth.uid() = sender_id);

-- Update photos RLS policies to handle visibility
DROP POLICY IF EXISTS "Anyone can view photos" ON public.photos;

CREATE POLICY "Public photos are viewable by everyone" 
ON public.photos 
FOR SELECT 
USING (visibility = 'public');

CREATE POLICY "Private photos are viewable by owner only" 
ON public.photos 
FOR SELECT 
USING (visibility = 'private' AND auth.uid() = photographer_id);

CREATE POLICY "Friends photos are viewable by friends and owner" 
ON public.photos 
FOR SELECT 
USING (
  visibility = 'friends' AND (
    auth.uid() = photographer_id OR
    EXISTS (
      SELECT 1 FROM public.friendships 
      WHERE (user_id = auth.uid() AND friend_id = photographer_id AND status = 'accepted') OR
            (user_id = photographer_id AND friend_id = auth.uid() AND status = 'accepted')
    )
  )
);

-- Add triggers for updated_at columns
CREATE TRIGGER update_friendships_updated_at
BEFORE UPDATE ON public.friendships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_friend_requests_updated_at
BEFORE UPDATE ON public.friend_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();