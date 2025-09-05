-- Fix numeric field overflow by changing precision
ALTER TABLE photo_ratings 
ALTER COLUMN composition_score TYPE decimal(4,2),
ALTER COLUMN storytelling_score TYPE decimal(4,2),
ALTER COLUMN technique_score TYPE decimal(4,2),
ALTER COLUMN average_score TYPE decimal(4,2);

-- Update the trigger/function to calculate average score properly
CREATE OR REPLACE FUNCTION calculate_rating_average()
RETURNS TRIGGER AS $$
BEGIN
  NEW.average_score = ROUND((NEW.composition_score + NEW.storytelling_score + NEW.technique_score) / 3.0, 2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic average calculation
DROP TRIGGER IF EXISTS update_rating_average ON photo_ratings;
CREATE TRIGGER update_rating_average
  BEFORE INSERT OR UPDATE ON photo_ratings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_rating_average();