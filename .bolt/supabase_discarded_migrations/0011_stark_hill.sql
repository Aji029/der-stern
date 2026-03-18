/*
  # Update Product Access Policies
  
  1. Changes
    - Make products publicly readable by anyone
    - Maintain write protection for authenticated users only
  
  2. Security
    - Enables public read access to products table
    - Maintains write protection (insert/update/delete) for authenticated users only
*/

-- Drop existing product policies to start fresh
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Users can modify their own products" ON public.products;
DROP POLICY IF EXISTS "Users can insert products" ON public.products;
DROP POLICY IF EXISTS "Users can update own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete own products" ON public.products;

-- Create new policies
CREATE POLICY "Products are publicly readable"
  ON public.products
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own products"
  ON public.products
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
  ON public.products
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
  ON public.products
  FOR DELETE
  USING (auth.uid() = user_id);