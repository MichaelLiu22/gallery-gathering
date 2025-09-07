-- Create trigger for photo notifications
CREATE TRIGGER notify_friend_post_trigger
  AFTER INSERT ON photos
  FOR EACH ROW
  EXECUTE FUNCTION notify_friend_post();