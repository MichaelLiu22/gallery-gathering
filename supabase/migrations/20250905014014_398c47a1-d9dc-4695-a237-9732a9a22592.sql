-- Enable realtime for photo_likes table
ALTER TABLE public.photo_likes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.photo_likes;

-- Enable realtime for photo_ratings table  
ALTER TABLE public.photo_ratings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.photo_ratings;

-- Enable realtime for photos table
ALTER TABLE public.photos REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.photos;

-- Create function to update photo stats when likes change
CREATE OR REPLACE FUNCTION update_photo_likes_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE photos 
    SET likes_count = likes_count + 1
    WHERE id = NEW.photo_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE photos 
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.photo_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers for like count updates
DROP TRIGGER IF EXISTS update_likes_count_insert ON photo_likes;
DROP TRIGGER IF EXISTS update_likes_count_delete ON photo_likes;

CREATE TRIGGER update_likes_count_insert
  AFTER INSERT ON photo_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_photo_likes_count();

CREATE TRIGGER update_likes_count_delete
  AFTER DELETE ON photo_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_photo_likes_count();

-- Create function to update photo ratings when ratings change
CREATE OR REPLACE FUNCTION update_photo_rating_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  avg_rating decimal(4,2);
  rating_count integer;
BEGIN
  -- Calculate new averages and count
  SELECT 
    COALESCE(ROUND(AVG(average_score), 2), 0),
    COUNT(*)
  INTO avg_rating, rating_count
  FROM photo_ratings 
  WHERE photo_id = COALESCE(NEW.photo_id, OLD.photo_id);
  
  -- Update the photos table
  UPDATE photos 
  SET 
    average_rating = avg_rating,
    ratings_count = rating_count
  WHERE id = COALESCE(NEW.photo_id, OLD.photo_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for rating stats updates
DROP TRIGGER IF EXISTS update_rating_stats_insert ON photo_ratings;
DROP TRIGGER IF EXISTS update_rating_stats_update ON photo_ratings;
DROP TRIGGER IF EXISTS update_rating_stats_delete ON photo_ratings;

CREATE TRIGGER update_rating_stats_insert
  AFTER INSERT ON photo_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_photo_rating_stats();

CREATE TRIGGER update_rating_stats_update
  AFTER UPDATE ON photo_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_photo_rating_stats();

CREATE TRIGGER update_rating_stats_delete
  AFTER DELETE ON photo_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_photo_rating_stats();