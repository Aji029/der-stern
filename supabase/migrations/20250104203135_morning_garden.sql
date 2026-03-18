-- Rename price columns back to original names
ALTER TABLE public.order_items
  RENAME COLUMN purchase_price_netto TO ek_price;

ALTER TABLE public.order_items  
  RENAME COLUMN selling_price_netto TO vk_price;

-- Drop computed columns if they exist
ALTER TABLE public.order_items
  DROP COLUMN IF EXISTS profit_netto;

ALTER TABLE public.order_items  
  DROP COLUMN IF EXISTS profit_margin;

-- Drop old check constraints
ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_purchase_price_check;

ALTER TABLE public.order_items  
  DROP CONSTRAINT IF EXISTS order_items_selling_price_check;

-- Add new check constraints
ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_ek_price_check 
    CHECK (ek_price >= 0);

ALTER TABLE public.order_items  
  ADD CONSTRAINT order_items_vk_price_check 
    CHECK (vk_price >= 0);

-- Update function to use original column names
CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.orders o
  SET total_amount = (
    SELECT SUM(
      CASE 
        WHEN o.mwst = 'A' THEN oi.vk_price * oi.quantity * 1.07
        WHEN o.mwst = 'B' THEN oi.vk_price * oi.quantity * 1.19
        ELSE oi.vk_price * oi.quantity
      END
    )
    FROM public.order_items oi
    WHERE oi.order_id = o.id
  )
  WHERE o.id = COALESCE(NEW.order_id, OLD.order_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;