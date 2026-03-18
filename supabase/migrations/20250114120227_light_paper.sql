-- Create function to update product details from order items
CREATE OR REPLACE FUNCTION update_product_from_order_item()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update products for Pending or Processing orders
  IF EXISTS (
    SELECT 1 FROM orders 
    WHERE id = NEW.order_id 
    AND status IN ('Pending', 'Processing')
  ) THEN
    UPDATE products
    SET 
      name = COALESCE(NEW.product_name, name),
      supplier_id = COALESCE(NEW.supplier_id, supplier_id),
      mwst = COALESCE(NEW.mwst, mwst),
      ek_price = COALESCE(NEW.ek_price, ek_price),
      vk_price = COALESCE(NEW.vk_price, vk_price),
      updated_at = NOW()
    WHERE artikel_nr = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product updates
CREATE TRIGGER update_product_from_order_item_trigger
  AFTER UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_product_from_order_item();

-- Add product_name column to order_items if it doesn't exist
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS product_name TEXT;