/*
  # Update quantity to support decimals
  
  1. Changes
    - Modify order_items.quantity from INTEGER to DECIMAL(10,2)
    - Remove CHECK constraint for quantity > 0
    - Add new CHECK constraint for quantity > 0 that works with decimals
  
  2. Impact
    - Allows decimal quantities like 1.5, 2.3 etc
    - Maintains data integrity with positive quantities
*/

ALTER TABLE public.order_items
  ALTER COLUMN quantity TYPE DECIMAL(10,2);

-- Drop old check constraint
ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_quantity_check;

-- Add new check constraint for decimals
ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_quantity_check 
  CHECK (quantity > 0::DECIMAL);