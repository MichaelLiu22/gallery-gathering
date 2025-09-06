-- Modify photos table to support image galleries
ALTER TABLE public.photos 
ADD COLUMN image_urls JSONB DEFAULT '[]'::JSONB,
ADD COLUMN image_count INTEGER DEFAULT 1;

-- Copy existing single image_url to image_urls array
UPDATE public.photos 
SET image_urls = jsonb_build_array(image_url),
    image_count = 1 
WHERE image_urls = '[]'::JSONB;

-- Create function to validate image_urls array
CREATE OR REPLACE FUNCTION validate_image_urls()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for validation
CREATE TRIGGER validate_photos_images
  BEFORE INSERT OR UPDATE ON public.photos
  FOR EACH ROW
  EXECUTE FUNCTION validate_image_urls();