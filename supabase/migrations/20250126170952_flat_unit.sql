-- Add last_route column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_route TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_route ON public.profiles(last_route);