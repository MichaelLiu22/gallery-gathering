-- Fix security issue: Set search_path for the function
CREATE OR REPLACE FUNCTION calculate_rating_average()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.average_score = ROUND((NEW.composition_score + NEW.storytelling_score + NEW.technique_score) / 3.0, 2);
  RETURN NEW;
END;
$$;