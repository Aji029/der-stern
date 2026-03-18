-- Create function to sync product changes from orders
CREATE OR REPLACE FUNCTION sync_order_product_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync changes for Pending or Processing orders
  IF NEW.order_id IN (
    SELECT id FROM orders 
    WHERE status IN ('Pending', 'Processing')
  ) THEN
    -- Update product EK price if it has changed
    IF NEW.ek_price IS DISTINCT FROM OLD.ek_price THEN
      UPDATE products
      SET 
        ek_price = NEW.ek_price,
        updated_at = NOW()
      WHERE artikel_nr = NEW.product_id;
    END IF;

    -- Update product VK price if it has changed
    IF NEW.vk_price IS DISTINCT FROM OLD.vk_price THEN
      UPDATE products
      SET 
        vk_price = NEW.vk_price,
        updated_at = NOW()
      WHERE artikel_nr = NEW.product_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order items changes
CREATE TRIGGER sync_order_product_changes_trigger
  AFTER UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION sync_order_product_changes();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION sync_order_product_changes() TO authenticated;