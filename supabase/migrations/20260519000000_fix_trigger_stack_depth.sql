/*
  # Fix trigger stack depth error on price updates

  The following three triggers create a feedback loop:
    order_items UPDATE → products UPDATE → order_items UPDATE → ...

  update_product_from_order_item_trigger has no recursion guard at all.
  update_order_item_prices_trigger and handle_order_item_updates_trigger
  have guards but still fire at every level, adding stack frames.

  The two products-side triggers (update_product_prices_trigger,
  handle_product_updates_trigger) already cascade price changes from
  products → order_items correctly. No reverse cascade is needed —
  price changes originate in the app and flow one-way: products → order_items.
*/

-- Remove the no-guard feedback trigger (primary culprit)
DROP TRIGGER IF EXISTS update_product_from_order_item_trigger ON order_items;

-- Remove the two redundant order_items triggers (they return early at depth > 1
-- anyway, but still add stack frames and fire unnecessarily)
DROP TRIGGER IF EXISTS update_order_item_prices_trigger ON order_items;
DROP TRIGGER IF EXISTS handle_order_item_updates_trigger ON order_items;

-- Drop the backing functions that are no longer needed
DROP FUNCTION IF EXISTS update_product_from_order_item();
