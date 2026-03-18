/*
  # Fix supplier_id type mismatch

  1. Changes
    - Update supplier_id column in order_items to match suppliers table UUID type
    - Drop existing foreign key constraint
    - Add new foreign key constraint with correct UUID type
    
  2. Safety
    - Uses IF EXISTS checks to prevent errors
    - Handles NULL values appropriately
*/

-- First, drop any existing foreign key constraint
ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_supplier_id_fkey;

-- Update supplier_id column to UUID type, handling existing data
ALTER TABLE public.order_items
  ALTER COLUMN supplier_id TYPE uuid USING 
    CASE 
      WHEN supplier_id IS NULL THEN NULL 
      ELSE supplier_id::uuid
    END;

-- Add new foreign key constraint with correct UUID type
ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_supplier_id_fkey
  FOREIGN KEY (supplier_id)
  REFERENCES suppliers(id)
  ON DELETE SET NULL;