-- Fix the ambiguous column reference in notify_friend_post function
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
        NEW.id,
        NEW.photographer_id
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$function$