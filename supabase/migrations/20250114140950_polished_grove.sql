-- Drop existing triggers and functions first
DROP TRIGGER IF EXISTS sync_order_product_changes_trigger ON order_items;
DROP FUNCTION IF EXISTS sync_order_product_changes();

-- Create improved function to sync product changes
CREATE OR REPLACE FUNCTION sync_product_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync changes for Pending or Processing orders
  IF EXISTS (
    SELECT 1 FROM orders 
    WHERE id = NEW.order_id 
    AND status IN ('Pending', 'Processing')
  ) THEN
    -- Update all order items with the same product
    UPDATE order_items
    SET 
      ek_price = NEW.ek_price,
      vk_price = NEW.vk_price,
      total = NEW.quantity * NEW.vk_price
    WHERE product_id = NEW.product_id
    AND order_id IN (
      SELECT id FROM orders
      WHERE status IN ('Pending', 'Processing')
    );
    
    -- Update product prices
    UPDATE products
    SET 
      ek_price = NEW.ek_price,
      vk_price = NEW.vk_price,
      updated_at = NOW()
    WHERE artikel_nr = NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order items changes
CREATE TRIGGER sync_product_changes_trigger
  AFTER UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_changes();

-- Create function to sync price updates from products to order items
CREATE OR REPLACE FUNCTION sync_price_to_orders()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update prices for Pending or Processing orders
  UPDATE order_items
  SET 
    ek_price = CASE 
      WHEN NEW.ek_price IS DISTINCT FROM OLD.ek_price THEN NEW.ek_price 
      ELSE ek_price 
    END,
    vk_price = CASE 
      WHEN NEW.vk_price IS DISTINCT FROM OLD.vk_price THEN NEW.vk_price 
      ELSE vk_price 
    END,
    total = quantity * CASE 
      WHEN NEW.vk_price IS DISTINCT FROM OLD.vk_price THEN NEW.vk_price 
      ELSE vk_price 
    END
  WHERE product_id = NEW.artikel_nr
  AND order_id IN (
    SELECT id FROM orders
    WHERE status IN ('Pending', 'Processing')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product price changes
CREATE TRIGGER sync_price_to_orders_trigger
  AFTER UPDATE ON products
  FOR EACH ROW
  WHEN (
    NEW.ek_price IS DISTINCT FROM OLD.ek_price OR 
    NEW.vk_price IS DISTINCT FROM OLD.vk_price
  )
  EXECUTE FUNCTION sync_price_to_orders();