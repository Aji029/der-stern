/*
  # Fix supplier_id handling in order_items

  1. Changes
    - Drop existing supplier_id column if it exists
    - Add supplier_id column with proper UUID type
    - Add index for performance
    - Cast supplier_id from products table to UUID when updating existing records
*/

-- Drop existing supplier_id column if it exists
ALTER TABLE public.order_items 
DROP COLUMN IF EXISTS supplier_id;

-- Add supplier_id column with proper constraints
ALTER TABLE public.order_items
ADD COLUMN supplier_id UUID REFERENCES public.suppliers(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_order_items_supplier_id ON public.order_items(supplier_id);

-- Update existing order items to set supplier_id from products table
-- Cast the text supplier_id to UUID to fix type mismatch
UPDATE public.order_items oi
SET supplier_id = p.supplier_id::UUID
FROM public.products p
WHERE oi.product_id = p.artikel_nr
AND p.supplier_id IS NOT NULL;