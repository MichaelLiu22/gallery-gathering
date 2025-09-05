-- Add reply functionality to comments
ALTER TABLE public.photo_comments 
ADD COLUMN parent_id UUID REFERENCES public.photo_comments(id) ON DELETE CASCADE;

-- Create index for better performance on parent_id queries
CREATE INDEX idx_photo_comments_parent_id ON public.photo_comments(parent_id);

-- Create ratings table for photo ratings
CREATE TABLE public.photo_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id BIGINT NOT NULL,
  user_id UUID NOT NULL,
  composition_score DECIMAL(3,2) NOT NULL CHECK (composition_score >= 0 AND composition_score <= 10),
  storytelling_score DECIMAL(3,2) NOT NULL CHECK (storytelling_score >= 0 AND storytelling_score <= 10),
  technique_score DECIMAL(3,2) NOT NULL CHECK (technique_score >= 0 AND technique_score <= 10),
  average_score DECIMAL(3,2) GENERATED ALWAYS AS ((composition_score + storytelling_score + technique_score) / 3) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(photo_id, user_id)
);

-- Enable Row Level Security for ratings
ALTER TABLE public.photo_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies for ratings
CREATE POLICY "Anyone can view ratings" 
ON public.photo_ratings 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own ratings" 
ON public.photo_ratings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" 
ON public.photo_ratings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" 
ON public.photo_ratings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates on ratings
CREATE TRIGGER update_photo_ratings_updated_at
BEFORE UPDATE ON public.photo_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add average rating and ratings count to photos table
ALTER TABLE public.photos 
ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN ratings_count INTEGER DEFAULT 0;