/*
  # Add MwSt column to orders table
  
  1. Changes
    - Add mwst column to orders table
    - Set default value to 'B'
    - Add check constraint to ensure valid values
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add mwst column with default value
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS mwst TEXT NOT NULL DEFAULT 'B';

-- Add check constraint to ensure valid values
ALTER TABLE public.orders
ADD CONSTRAINT orders_mwst_check
CHECK (mwst IN ('A', 'B'));

-- Create index for mwst queries
CREATE INDEX IF NOT EXISTS idx_orders_mwst 
ON public.orders(mwst);

-- Update order totals function to use order-level mwst
CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update order total when items are modified
  UPDATE public.orders o
  SET total_amount = (
    SELECT SUM(
      CASE 
        WHEN o.mwst = 'A' THEN oi.selling_price_netto * oi.quantity * 1.07
        WHEN o.mwst = 'B' THEN oi.selling_price_netto * oi.quantity * 1.19
        ELSE oi.selling_price_netto * oi.quantity
      END
    )
    FROM public.order_items oi
    WHERE oi.order_id = o.id
  )
  WHERE o.id = COALESCE(NEW.order_id, OLD.order_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;