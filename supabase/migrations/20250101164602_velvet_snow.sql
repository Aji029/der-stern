/*
  # Update Order ID Format

  1. Changes
    - Modify orders table to use 5-digit numeric IDs
    - Update order_items foreign key constraint
    - Add sequence for order number generation

  2. Security
    - Maintains existing RLS policies
*/

-- First, create a sequence for order numbers starting at 10000
CREATE SEQUENCE IF NOT EXISTS order_number_seq
  START WITH 10000
  INCREMENT BY 1
  MAXVALUE 99999
  MINVALUE 10000
  CYCLE;

-- Temporarily disable foreign key checks
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;

-- Modify orders table id column
ALTER TABLE public.orders 
  ALTER COLUMN id TYPE TEXT;

-- Update order_items foreign key constraint
ALTER TABLE public.order_items
  ALTER COLUMN order_id TYPE TEXT,
  ADD CONSTRAINT order_items_order_id_fkey 
    FOREIGN KEY (order_id) 
    REFERENCES orders(id) 
    ON DELETE CASCADE;

-- Create function to generate next order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN nextval('order_number_seq')::TEXT;
END;
$$;

-- Create trigger to automatically set order number on insert
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.id IS NULL THEN
    NEW.id := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();