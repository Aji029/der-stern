/*
  # Fix Database Issues - Updated Version

  1. Categories Table
    - Create categories table if it doesn't exist
    - Add proper indexes and RLS policies (with existence checks)
  
  2. Sammelrechnungen Relationships
    - Fix foreign key relationship with customers table
    - Add proper cascading behavior

  3. Customer Deletion
    - Add ON DELETE CASCADE to order_items
    - Add ON DELETE CASCADE to orders
*/

-- First ensure the categories table exists
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  product_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Enable RLS for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create categories policies with existence checks
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' 
    AND policyname = 'Users can view their own categories'
  ) THEN
    CREATE POLICY "Users can view their own categories"
      ON public.categories
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' 
    AND policyname = 'Users can insert their own categories'
  ) THEN
    CREATE POLICY "Users can insert their own categories"
      ON public.categories
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' 
    AND policyname = 'Users can update their own categories'
  ) THEN
    CREATE POLICY "Users can update their own categories"
      ON public.categories
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' 
    AND policyname = 'Users can delete their own categories'
  ) THEN
    CREATE POLICY "Users can delete their own categories"
      ON public.categories
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);

-- Fix sammelrechnungen relationship
ALTER TABLE public.sammelrechnungen
DROP CONSTRAINT IF EXISTS sammelrechnungen_customer_id_fkey;

ALTER TABLE public.sammelrechnungen
ADD CONSTRAINT sammelrechnungen_customer_id_fkey
FOREIGN KEY (customer_id)
REFERENCES public.customers(id)
ON DELETE CASCADE;

-- Fix customer deletion cascade
-- First drop existing constraints
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;

ALTER TABLE public.order_items
DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;

-- Re-add constraints with cascade
ALTER TABLE public.orders
ADD CONSTRAINT orders_customer_id_fkey
FOREIGN KEY (customer_id)
REFERENCES public.customers(id)
ON DELETE CASCADE;

ALTER TABLE public.order_items
ADD CONSTRAINT order_items_order_id_fkey
FOREIGN KEY (order_id)
REFERENCES public.orders(id)
ON DELETE CASCADE;

-- Create trigger for categories updated_at with existence check
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_categories_updated_at'
  ) THEN
    CREATE TRIGGER set_categories_updated_at
      BEFORE UPDATE ON public.categories
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;