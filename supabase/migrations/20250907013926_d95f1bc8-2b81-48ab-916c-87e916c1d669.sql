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
    NEW.photo_id::text,
    NEW.user_id
  );
  
  RETURN NEW;
END;
$function$