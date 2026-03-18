/*
  # Update order_items price columns
  
  1. Changes
    - Rename price columns to be more explicit
    - Add computed profit columns
    - Add price constraints and indexes
    - Update order total calculation
  
  2. Security
    - Maintain existing RLS policies
    - Add constraints to ensure valid prices
*/

-- Rename price columns one at a time
ALTER TABLE public.order_items
  RENAME COLUMN ek_price TO purchase_price_netto;

ALTER TABLE public.order_items  
  RENAME COLUMN vk_price TO selling_price_netto;

-- Add computed columns for profit
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS profit_netto DECIMAL(10,2) 
  GENERATED ALWAYS AS (
    selling_price_netto - purchase_price_netto
  ) STORED;

ALTER TABLE public.order_items  
  ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(10,2) 
  GENERATED ALWAYS AS (
    CASE 
      WHEN purchase_price_netto > 0 
      THEN ((selling_price_netto - purchase_price_netto) / purchase_price_netto * 100)
      ELSE 0 
    END
  ) STORED;

-- Create index on profit margin for faster queries
CREATE INDEX IF NOT EXISTS idx_order_items_profit_margin 
ON public.order_items(profit_margin);

-- Add check constraints to ensure valid prices
ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_purchase_price_check 
    CHECK (purchase_price_netto >= 0);

ALTER TABLE public.order_items  
  ADD CONSTRAINT order_items_selling_price_check 
    CHECK (selling_price_netto >= 0);

-- Update function to handle price updates
CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update order total when items are modified
  UPDATE public.orders o
  SET total_amount = (
    SELECT SUM(
      CASE 
        WHEN oi.mwst = 'A' THEN oi.selling_price_netto * oi.quantity * 1.07
        WHEN oi.mwst = 'B' THEN oi.selling_price_netto * oi.quantity * 1.19
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

-- Create or replace trigger
DROP TRIGGER IF EXISTS update_order_totals_trigger ON public.order_items;
CREATE TRIGGER update_order_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_order_totals();