/*
  # Fix Product Deletion Policies
  
  1. Changes
    - Drop existing policies
    - Create separate policies for each operation
    - Ensure proper delete permissions
  
  2. Security
    - Anyone can view products
    - Only authenticated users can modify their own products
    - Explicit delete policy for product owners
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Users can modify their own products" ON public.products;

-- Create specific policies for each operation
CREATE POLICY "Anyone can view products"
  ON public.products
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert products"
  ON public.products
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON public.products
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON public.products
  FOR DELETE
  USING (auth.uid() = user_id);