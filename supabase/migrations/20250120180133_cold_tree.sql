-- Add unique constraint for order_id and product_id combination
ALTER TABLE public.gutschriften
ADD CONSTRAINT gutschriften_order_product_unique 
UNIQUE (order_id, product_id);

-- Drop existing trigger
DROP TRIGGER IF EXISTS update_order_total_with_gutschrift_trigger ON public.gutschriften;
DROP FUNCTION IF EXISTS update_order_total_with_gutschrift();

-- Create improved function to update order totals
CREATE OR REPLACE FUNCTION update_order_total_with_gutschrift()
RETURNS TRIGGER AS $$
BEGIN
  -- Update order total and final amount
  UPDATE public.orders o
  SET 
    total_amount = (
      SELECT COALESCE(SUM(oi.total), 0)
      FROM public.order_items oi
      WHERE oi.order_id = o.id
    ),
    final_amount = (
      SELECT 
        COALESCE(SUM(oi.total), 0) + COALESCE(SUM(g.price * g.quantity), 0)
      FROM public.order_items oi
      LEFT JOIN public.gutschriften g ON g.order_id = o.id
      WHERE oi.order_id = o.id
    )
  WHERE o.id = COALESCE(NEW.order_id, OLD.order_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_order_total_with_gutschrift_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.gutschriften
  FOR EACH ROW
  EXECUTE FUNCTION update_order_total_with_gutschrift();