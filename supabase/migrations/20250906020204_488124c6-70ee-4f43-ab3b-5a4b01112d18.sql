-- Add foreign key constraints to establish proper table relationships

-- Add foreign key for profiles table
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign keys for friendships table
ALTER TABLE public.friendships 
ADD CONSTRAINT friendships_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.friendships 
ADD CONSTRAINT friendships_friend_id_fkey 
FOREIGN KEY (friend_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign keys for friend_requests table
ALTER TABLE public.friend_requests 
ADD CONSTRAINT friend_requests_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.friend_requests 
ADD CONSTRAINT friend_requests_receiver_id_fkey 
FOREIGN KEY (receiver_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign keys for follows table
ALTER TABLE public.follows 
ADD CONSTRAINT follows_follower_id_fkey 
FOREIGN KEY (follower_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.follows 
ADD CONSTRAINT follows_following_id_fkey 
FOREIGN KEY (following_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key for photos table
ALTER TABLE public.photos 
ADD CONSTRAINT photos_photographer_id_fkey 
FOREIGN KEY (photographer_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign keys for photo_comments table
ALTER TABLE public.photo_comments 
ADD CONSTRAINT photo_comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.photo_comments 
ADD CONSTRAINT photo_comments_photo_id_fkey 
FOREIGN KEY (photo_id) REFERENCES public.photos(id) ON DELETE CASCADE;

-- Add foreign keys for photo_likes table
ALTER TABLE public.photo_likes 
ADD CONSTRAINT photo_likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.photo_likes 
ADD CONSTRAINT photo_likes_photo_id_fkey 
FOREIGN KEY (photo_id) REFERENCES public.photos(id) ON DELETE CASCADE;

-- Add foreign keys for photo_ratings table
ALTER TABLE public.photo_ratings 
ADD CONSTRAINT photo_ratings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.photo_ratings 
ADD CONSTRAINT photo_ratings_photo_id_fkey 
FOREIGN KEY (photo_id) REFERENCES public.photos(id) ON DELETE CASCADE;

-- Add foreign keys for notifications table
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_related_user_id_fkey 
FOREIGN KEY (related_user_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;