-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION validate_image_urls()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure image_urls is an array and has at least 1 image and max 9 images
  IF NOT (jsonb_typeof(NEW.image_urls) = 'array') THEN
    RAISE EXCEPTION 'image_urls must be an array';
  END IF;
  
  IF jsonb_array_length(NEW.image_urls) < 1 THEN
    RAISE EXCEPTION 'At least one image is required';
  END IF;
  
  IF jsonb_array_length(NEW.image_urls) > 9 THEN
    RAISE EXCEPTION 'Maximum 9 images allowed';
  END IF;
  
  -- Update image_count based on array length
  NEW.image_count = jsonb_array_length(NEW.image_urls);
  
  RETURN NEW;
END;
$$;