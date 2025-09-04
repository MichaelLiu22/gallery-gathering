-- Create likes table
CREATE TABLE public.photo_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  photo_id BIGINT NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, photo_id)
);

-- Create comments table
CREATE TABLE public.photo_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  photo_id BIGINT NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.photo_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for photo_likes
CREATE POLICY "Anyone can view likes" ON public.photo_likes
FOR SELECT USING (true);

CREATE POLICY "Users can create their own likes" ON public.photo_likes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON public.photo_likes
FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for photo_comments
CREATE POLICY "Anyone can view comments" ON public.photo_comments
FOR SELECT USING (true);

CREATE POLICY "Users can create their own comments" ON public.photo_comments
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.photo_comments
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.photo_comments
FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for comments updated_at
CREATE TRIGGER update_photo_comments_updated_at
BEFORE UPDATE ON public.photo_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();