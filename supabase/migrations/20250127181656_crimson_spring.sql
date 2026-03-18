-- Add indexes for frequently queried fields in orders table
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON public.orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_orders_customer_date ON public.orders(customer_id, order_date);
CREATE INDEX IF NOT EXISTS idx_orders_status_date ON public.orders(status, order_date);

-- Add indexes for order items table for better join performance
CREATE INDEX IF NOT EXISTS idx_order_items_product_order ON public.order_items(product_id, order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON public.order_items(created_at);

-- Add indexes for common sorting and filtering
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON public.orders(updated_at DESC);