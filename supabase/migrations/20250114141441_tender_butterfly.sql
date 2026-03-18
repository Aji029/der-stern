-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS sync_product_changes_trigger ON order_items;
DROP TRIGGER IF EXISTS sync_price_to_orders_trigger ON products;
DROP FUNCTION IF EXISTS sync_product_changes();
DROP FUNCTION IF EXISTS sync_price_to_orders();

-- Create a single, optimized function to handle price updates
CREATE OR REPLACE FUNCTION update_product_and_order_prices()
RETURNS TRIGGER AS $$
DECLARE
  price_changed BOOLEAN;
BEGIN
  -- Check if we're in a recursive call
  IF EXISTS (
    SELECT 1 FROM pg_trigger_depth() WHERE pg_trigger_depth() > 1
  ) THEN
    RETURN NEW;
  END IF;

  price_changed := FALSE;

  -- Handle updates from products table
  IF TG_TABLE_NAME = 'products' THEN
    IF NEW.ek_price IS DISTINCT FROM OLD.ek_price OR NEW.vk_price IS DISTINCT FROM OLD.vk_price THEN
      price_changed := TRUE;
      
      -- Update order items for pending/processing orders
      UPDATE order_items
      SET 
        ek_price = NEW.ek_price,
        vk_price = NEW.vk_price,
        total = quantity * NEW.vk_price
      WHERE product_id = NEW.artikel_nr
      AND order_id IN (
        SELECT id FROM orders
        WHERE status IN ('Pending', 'Processing')
      );
    END IF;
  END IF;

  -- Handle updates from order_items table
  IF TG_TABLE_NAME = 'order_items' THEN
    IF EXISTS (
      SELECT 1 FROM orders 
      WHERE id = NEW.order_id 
      AND status IN ('Pending', 'Processing')
    ) THEN
      price_changed := TRUE;
      
      -- Update product prices
      UPDATE products
      SET 
        ek_price = NEW.ek_price,
        vk_price = NEW.vk_price,
        updated_at = NOW()
      WHERE artikel_nr = NEW.product_id;
      
      -- Update other order items with the same product
      UPDATE order_items
      SET 
        ek_price = NEW.ek_price,
        vk_price = NEW.vk_price,
        total = quantity * NEW.vk_price
      WHERE product_id = NEW.product_id
      AND order_id IN (
        SELECT id FROM orders
        WHERE status IN ('Pending', 'Processing')
      )
      AND id != NEW.id; -- Skip the current row to avoid recursion
    END IF;
  END IF;

  -- Update order totals if prices changed
  IF price_changed THEN
    UPDATE orders o
    SET total_amount = (
      SELECT SUM(oi.total)
      FROM order_items oi
      WHERE oi.order_id = o.id
    )
    WHERE id IN (
      SELECT DISTINCT order_id 
      FROM order_items 
      WHERE product_id = CASE
        WHEN TG_TABLE_NAME = 'products' THEN NEW.artikel_nr
        ELSE NEW.product_id
      END
    )
    AND status IN ('Pending', 'Processing');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for both tables
CREATE TRIGGER update_product_prices_trigger
  AFTER UPDATE OF ek_price, vk_price ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_and_order_prices();

CREATE TRIGGER update_order_item_prices_trigger
  AFTER UPDATE OF ek_price, vk_price ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_product_and_order_prices();