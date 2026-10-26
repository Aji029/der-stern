-- Make the customer-favourites trigger tolerate an order that lists the same
-- article twice.
--
-- update_customer_favorites() runs AFTER INSERT OR UPDATE ON orders and upserts
-- one customer_favorites row per order line. When an order carries the same
-- product on two lines, that single INSERT ... ON CONFLICT proposes the same
-- (customer_id, product_id) twice and Postgres aborts the whole save with
--   21000: ON CONFLICT DO UPDATE command cannot affect row a second time
-- so such an order can no longer be saved, completed or corrected from the app
-- (seen on order 14991 on 26 Oct 2026 after a double-tapped save).
--
-- Aggregating per product first makes the upsert well-formed whatever the lines
-- look like. Behaviour is otherwise unchanged. Run in the Supabase SQL editor;
-- safe to run more than once.

CREATE OR REPLACE FUNCTION update_customer_favorites()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status != 'Cancelled' THEN
    INSERT INTO public.customer_favorites (
      customer_id,
      product_id,
      order_count,
      total_quantity,
      last_ordered_at,
      user_id
    )
    SELECT
      NEW.customer_id,
      oi.product_id,
      1,
      SUM(oi.quantity),
      NEW.order_date,
      NEW.user_id
    FROM order_items oi
    WHERE oi.order_id = NEW.id
    GROUP BY oi.product_id
    ON CONFLICT (customer_id, product_id) DO UPDATE SET
      order_count = customer_favorites.order_count + 1,
      total_quantity = customer_favorites.total_quantity + EXCLUDED.total_quantity,
      last_ordered_at = GREATEST(customer_favorites.last_ordered_at, EXCLUDED.last_ordered_at),
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
