-- Add camera field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN favorite_camera text;