-- First ensure all products have valid MwSt values
UPDATE public.products
SET mwst = 'A'
WHERE mwst IS NULL OR mwst NOT IN ('A', 'B');

-- Add MwSt column to order_items table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_items' AND column_name = 'mwst'
  ) THEN
    ALTER TABLE public.order_items ADD COLUMN mwst TEXT;
  END IF;
END $$;

-- Update existing order_items with MwSt values from their products
UPDATE public.order_items oi
SET mwst = p.mwst
FROM public.products p
WHERE oi.product_id = p.artikel_nr
AND (oi.mwst IS NULL OR oi.mwst NOT IN ('A', 'B'));

-- Set any remaining NULL values to 'A'
UPDATE public.order_items
SET mwst = 'A'
WHERE mwst IS NULL OR mwst NOT IN ('A', 'B');

-- Now that all values are valid, add NOT NULL constraint
ALTER TABLE public.order_items 
ALTER COLUMN mwst SET NOT NULL,
ALTER COLUMN mwst SET DEFAULT 'A';

-- Add check constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE constraint_name = 'order_items_mwst_check'
  ) THEN
    ALTER TABLE public.order_items
    ADD CONSTRAINT order_items_mwst_check
    CHECK (mwst IN ('A', 'B'));
  END IF;
END $$;