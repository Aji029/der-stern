-- Drop triggers first
DROP TRIGGER IF EXISTS update_order_totals_trigger ON public.order_items;
DROP TRIGGER IF EXISTS set_sammelrechnung_number_trigger ON sammelrechnungen;
DROP TRIGGER IF EXISTS update_sammelrechnung_totals_trigger ON public.orders;

-- Drop functions
DROP FUNCTION IF EXISTS update_order_totals();
DROP FUNCTION IF EXISTS set_sammelrechnung_number();
DROP FUNCTION IF EXISTS generate_sammelrechnung_number();
DROP FUNCTION IF EXISTS update_sammelrechnung_totals();

-- Drop sequences
DROP SEQUENCE IF EXISTS sammelrechnung_number_seq;

-- Remove sammelrechnung_id from orders
ALTER TABLE public.orders 
DROP COLUMN IF EXISTS sammelrechnung_id;

-- Drop sammelrechnungen table
DROP TABLE IF EXISTS public.sammelrechnungen;

-- Remove mwst column from orders
ALTER TABLE public.orders 
DROP COLUMN IF EXISTS mwst;

-- Remove constraints from order_items
ALTER TABLE public.order_items
DROP CONSTRAINT IF EXISTS order_items_ek_price_check;

ALTER TABLE public.order_items
DROP CONSTRAINT IF EXISTS order_items_vk_price_check;

-- Remove indexes
DROP INDEX IF EXISTS idx_orders_mwst;
DROP INDEX IF EXISTS idx_order_items_profit_margin;