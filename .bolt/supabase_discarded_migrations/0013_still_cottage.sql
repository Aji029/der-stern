/*
  # Fix products user constraint

  1. Changes
    - Make user_id column optional for products table
    - Update policies to handle null user_id
  
  2. Security
    - Maintains RLS but allows collaborative editing
    - Still requires authentication for modifications
*/

-- Make user_id optional
ALTER TABLE public.products
  ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing product policies
DROP POLICY IF EXISTS "Products are publicly readable" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update any product" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can delete any product" ON public.products;

-- Create new policies that don't depend on user_id
CREATE POLICY "Products are publicly readable"
  ON public.products
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON public.products
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update any product"
  ON public.products
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete any product"
  ON public.products
  FOR DELETE
  USING (auth.role() = 'authenticated');