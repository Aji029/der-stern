/*
  # Remove user-specific constraints and update RLS policies

  1. Changes
    - Make user_id optional for all tables
    - Update RLS policies to allow authenticated users to perform all operations
    - Remove user-specific checks from policies
  
  2. Security
    - Maintain RLS but make it role-based instead of user-based
    - Only require authentication for modifications
*/

-- Update customers table
ALTER TABLE public.customers
  ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing customer policies
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can insert their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON public.customers;

-- Create new collaborative policies for customers
CREATE POLICY "Customers are publicly readable"
  ON public.customers
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert customers"
  ON public.customers
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update customers"
  ON public.customers
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete customers"
  ON public.customers
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Update suppliers table
ALTER TABLE public.suppliers
  ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing supplier policies
DROP POLICY IF EXISTS "suppliers_user_isolation" ON public.suppliers;

-- Create new collaborative policies for suppliers
CREATE POLICY "Suppliers are publicly readable"
  ON public.suppliers
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert suppliers"
  ON public.suppliers
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update suppliers"
  ON public.suppliers
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete suppliers"
  ON public.suppliers
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Update orders table
ALTER TABLE public.orders
  ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing order policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can delete their own orders" ON public.orders;

-- Create new collaborative policies for orders
CREATE POLICY "Orders are publicly readable"
  ON public.orders
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update orders"
  ON public.orders
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete orders"
  ON public.orders
  FOR DELETE
  USING (auth.role() = 'authenticated');