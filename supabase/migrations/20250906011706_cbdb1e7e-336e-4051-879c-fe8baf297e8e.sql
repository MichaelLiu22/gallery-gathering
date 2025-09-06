-- Create notifications table for unread comments and friend activities
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('comment', 'friend_request', 'friend_post', 'like')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID, -- photo_id, friend_request_id, etc.
  related_user_id UUID, -- who triggered the notification
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to generate notifications for new comments
CREATE OR REPLACE FUNCTION public.notify_comment_on_photo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  photo_owner_id UUID;
  commenter_name TEXT;
  photo_title TEXT;
BEGIN
  -- Get photo owner and photo title
  SELECT photographer_id, title INTO photo_owner_id, photo_title
  FROM photos WHERE id = NEW.photo_id;
  
  -- Don't notify if commenting on own photo
  IF photo_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get commenter name
  SELECT COALESCE(display_name, '匿名用户') INTO commenter_name
  FROM profiles WHERE user_id = NEW.user_id;
  
  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_id,
    related_user_id
  ) VALUES (
    photo_owner_id,
    'comment',
    '新评论',
    commenter_name || ' 评论了您的作品 "' || photo_title || '"',
    NEW.photo_id,
    NEW.user_id
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for comment notifications
CREATE TRIGGER trigger_notify_comment_on_photo
AFTER INSERT ON photo_comments
FOR EACH ROW
EXECUTE FUNCTION notify_comment_on_photo();

-- Create function to generate notifications for friend posts
CREATE OR REPLACE FUNCTION public.notify_friend_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  friend_id UUID;
  poster_name TEXT;
BEGIN
  -- Get poster name
  SELECT COALESCE(display_name, '匿名用户') INTO poster_name
  FROM profiles WHERE user_id = NEW.photographer_id;
  
  -- Notify all friends
  FOR friend_id IN 
    SELECT 
      CASE 
        WHEN user_id = NEW.photographer_id THEN friend_id 
        ELSE user_id 
      END AS friend_user_id
    FROM friendships 
    WHERE (user_id = NEW.photographer_id OR friend_id = NEW.photographer_id) 
    AND status = 'accepted'
  LOOP
    IF friend_id != NEW.photographer_id THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        related_id,
        related_user_id
      ) VALUES (
        friend_id,
        'friend_post',
        '好友新作品',
        poster_name || ' 发布了新作品 "' || NEW.title || '"',
        NEW.id,
        NEW.photographer_id
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for friend post notifications
CREATE TRIGGER trigger_notify_friend_post
AFTER INSERT ON photos
FOR EACH ROW
EXECUTE FUNCTION notify_friend_post();

-- Add trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();