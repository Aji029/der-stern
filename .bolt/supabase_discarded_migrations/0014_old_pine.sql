/*
  # Simplify customers table

  1. Changes
    - Remove customer_group column
    - Remove credit_limit column
    - Remove notes column

  2. Security
    - Maintain existing RLS policies
*/

-- Remove columns that are no longer needed
ALTER TABLE public.customers 
  DROP COLUMN IF EXISTS customer_group,
  DROP COLUMN IF EXISTS credit_limit,
  DROP COLUMN IF EXISTS notes;

-- Ensure RLS is still enabled
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Recreate policies to ensure they work with the updated schema
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can insert their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON public.customers;

CREATE POLICY "Users can view their own customers"
  ON public.customers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own customers"
  ON public.customers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customers"
  ON public.customers
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customers"
  ON public.customers
  FOR DELETE
  USING (auth.uid() = user_id);