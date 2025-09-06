-- Create follows table for the follow system
CREATE TABLE public.follows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable Row Level Security
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Create policies for follows
CREATE POLICY "Users can view all follows" 
ON public.follows 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own follows" 
ON public.follows 
FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" 
ON public.follows 
FOR DELETE 
USING (auth.uid() = follower_id);

-- Create function to update timestamps
CREATE TRIGGER update_follows_updated_at
BEFORE UPDATE ON public.follows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();