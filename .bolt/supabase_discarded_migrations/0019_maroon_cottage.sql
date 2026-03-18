/*
  # Add supplier_id to order_items table

  1. Changes
    - Add supplier_id column to order_items table
    - Add foreign key constraint to suppliers table
    - Add index for performance

  2. Security
    - No changes to RLS policies needed
*/

-- Add supplier_id column
ALTER TABLE public.order_items
ADD COLUMN supplier_id UUID REFERENCES public.suppliers(id);

-- Add index for performance
CREATE INDEX idx_order_items_supplier_id ON public.order_items(supplier_id);