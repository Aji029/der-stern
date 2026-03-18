-- Add MwSt column to order_items table
DO $$ 
BEGIN
  -- First add the column without constraints
  ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS mwst TEXT DEFAULT 'A';

  -- Update existing records with MwSt values from products
  WITH product_mwst AS (
    SELECT artikel_nr, mwst 
    FROM public.products 
    WHERE mwst IN ('A', 'B')
  )
  UPDATE public.order_items oi
  SET mwst = pm.mwst
  FROM product_mwst pm
  WHERE oi.product_id = pm.artikel_nr;

  -- Set any remaining NULL values to 'A' as default
  UPDATE public.order_items
  SET mwst = 'A'
  WHERE mwst IS NULL OR mwst NOT IN ('A', 'B');

  -- Now that all records have a valid value, make it required and add the check constraint
  ALTER TABLE public.order_items
  ALTER COLUMN mwst SET NOT NULL;

  -- Add check constraint if it doesn't exist
  DO $constraint$ BEGIN
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.constraint_column_usage 
      WHERE constraint_name = 'order_items_mwst_check'
    ) THEN
      ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_mwst_check
      CHECK (mwst IN ('A', 'B'));
    END IF;
  END $constraint$;

END $$;