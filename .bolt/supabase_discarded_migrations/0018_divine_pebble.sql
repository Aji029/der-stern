/*
  # Fix Order Items RLS Policies

  1. Changes
    - Drop existing order items policies
    - Create new policies that allow authenticated users to manage order items
    - Ensure proper cascading delete behavior

  2. Security
    - Enable RLS on order_items table
    - Add policies for all CRUD operations
    - Link permissions to authenticated users
*/

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Authenticated users can view order items"
  ON public.order_items
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert order items"
  ON public.order_items
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update order items"
  ON public.order_items
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete order items"
  ON public.order_items
  FOR DELETE
  USING (auth.role() = 'authenticated');