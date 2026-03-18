-- Add discount columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS discount JSONB,
ADD COLUMN IF NOT EXISTS final_amount DECIMAL(10,2);

-- Update existing orders to set final_amount equal to total_amount
UPDATE public.orders
SET final_amount = total_amount
WHERE final_amount IS NULL;

-- Make final_amount NOT NULL with default
ALTER TABLE public.orders
ALTER COLUMN final_amount SET NOT NULL,
ALTER COLUMN final_amount SET DEFAULT 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_final_amount ON public.orders(final_amount);