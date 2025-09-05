-- First, drop the generated column constraint
ALTER TABLE photo_ratings DROP COLUMN average_score;

-- Change the column types to decimal with proper precision
ALTER TABLE photo_ratings 
ALTER COLUMN composition_score TYPE decimal(4,2),
ALTER COLUMN storytelling_score TYPE decimal(4,2),
ALTER COLUMN technique_score TYPE decimal(4,2);

-- Add back the average_score column as a regular column (not generated)
ALTER TABLE photo_ratings ADD COLUMN average_score decimal(4,2);

-- Create function to calculate average score
CREATE OR REPLACE FUNCTION calculate_rating_average()
RETURNS TRIGGER AS $$
BEGIN
  NEW.average_score = ROUND((NEW.composition_score + NEW.storytelling_score + NEW.technique_score) / 3.0, 2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic average calculation
CREATE TRIGGER update_rating_average
  BEFORE INSERT OR UPDATE ON photo_ratings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_rating_average();

-- Update existing records to calculate average_score
UPDATE photo_ratings 
SET average_score = ROUND((composition_score + storytelling_score + technique_score) / 3.0, 2);