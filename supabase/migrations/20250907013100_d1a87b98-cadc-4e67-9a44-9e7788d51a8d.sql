-- Create trigger for photo notifications if it doesn't exist
CREATE TRIGGER IF NOT EXISTS notify_friend_post_trigger
  AFTER INSERT ON photos
  FOR EACH ROW
  EXECUTE FUNCTION notify_friend_post();