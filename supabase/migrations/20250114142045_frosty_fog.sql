-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS handle_product_price_updates ON products;
DROP TRIGGER IF EXISTS handle_order_item_price_updates ON order_items;
DROP FUNCTION IF EXISTS handle_price_updates();

-- Create simplified function for handling price updates
CREATE OR REPLACE FUNCTION handle_price_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent infinite recursion
  IF (TG_OP = 'UPDATE' AND TG_LEVEL = 'STATEMENT') THEN
    RETURN NULL;
  END IF;

  -- For product updates
  IF TG_TABLE_NAME = 'products' THEN
    -- Only proceed if prices actually changed
    IF NEW.ek_price IS DISTINCT FROM OLD.ek_price OR NEW.vk_price IS DISTINCT FROM OLD.vk_price THEN
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

  -- For order item updates
  IF TG_TABLE_NAME = 'order_items' THEN
    -- Only proceed if prices actually changed
    IF NEW.ek_price IS DISTINCT FROM OLD.ek_price OR NEW.vk_price IS DISTINCT FROM OLD.vk_price THEN
      -- Update the product
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
      AND id != NEW.id
      AND order_id IN (
        SELECT id FROM orders
        WHERE status IN ('Pending', 'Processing')
      );
    END IF;
  END IF;

  -- Update order total
  UPDATE orders
  SET total_amount = (
    SELECT COALESCE(SUM(total), 0)
    FROM order_items
    WHERE order_id = CASE
      WHEN TG_TABLE_NAME = 'order_items' THEN NEW.order_id
      ELSE (SELECT order_id FROM order_items WHERE product_id = NEW.artikel_nr LIMIT 1)
    END
  )
  WHERE id = CASE
    WHEN TG_TABLE_NAME = 'order_items' THEN NEW.order_id
    ELSE (SELECT order_id FROM order_items WHERE product_id = NEW.artikel_nr LIMIT 1)
  END
  AND status IN ('Pending', 'Processing');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for products table
CREATE TRIGGER handle_product_price_updates
  AFTER UPDATE OF ek_price, vk_price ON products
  FOR EACH ROW
  EXECUTE FUNCTION handle_price_updates();

-- Create trigger for order_items table
CREATE TRIGGER handle_order_item_price_updates
  AFTER UPDATE OF ek_price, vk_price ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION handle_price_updates();