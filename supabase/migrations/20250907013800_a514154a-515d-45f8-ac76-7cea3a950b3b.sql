-- Fix the data type mismatch in notifications table
-- Change related_id from uuid to text to accommodate different ID types
ALTER TABLE notifications ALTER COLUMN related_id TYPE text USING related_id::text;

-- Update the notify_friend_post function to handle the correct data types
CREATE OR REPLACE FUNCTION public.notify_friend_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  friend_user_id UUID;
  poster_name TEXT;
BEGIN
  -- Get poster name
  SELECT COALESCE(display_name, '匿名用户') INTO poster_name
  FROM profiles WHERE user_id = NEW.photographer_id;
  
  -- Notify all friends
  FOR friend_user_id IN 
    SELECT 
      CASE 
        WHEN friendships.user_id = NEW.photographer_id THEN friendships.friend_id 
        ELSE friendships.user_id 
      END AS friend_user_id
    FROM friendships 
    WHERE (friendships.user_id = NEW.photographer_id OR friendships.friend_id = NEW.photographer_id) 
    AND friendships.status = 'accepted'
  LOOP
    IF friend_user_id != NEW.photographer_id THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        related_id,
        related_user_id
      ) VALUES (
        friend_user_id,
        'friend_post',
        '好友新作品',
        poster_name || ' 发布了新作品 "' || NEW.title || '"',
        NEW.id::text,  -- Convert bigint to text
        NEW.photographer_id
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$function$

-- Also fix the notify_comment_on_photo function for consistency
CREATE OR REPLACE FUNCTION public.notify_comment_on_photo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    NEW.photo_id::text,  -- Convert bigint to text
    NEW.user_id
  );
  
  RETURN NEW;
END;
$function$