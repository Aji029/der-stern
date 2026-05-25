/*
  # Drop the dead products -> order_items cascade trigger

  handle_product_updates_trigger was meant to copy a product's ek_price/vk_price
  onto order_items for active orders, but it no longer fires in production — which
  is why EK price edits in Today's Pick reverted on refresh.

  The application now performs this cascade explicitly (see updatePriceDirectly in
  src/lib/supabase.ts), so the trigger is redundant. Removing it also prevents a
  future double-write loop (app + trigger) if it were ever re-enabled — that loop
  was the source of the earlier stack-depth crashes.

  The order_items-side counterpart (handle_order_item_updates_trigger) was already
  dropped in 20260519000000_fix_trigger_stack_depth.sql, so the backing function is
  now unused and can go too.
*/

DROP TRIGGER IF EXISTS handle_product_updates_trigger ON products;
DROP FUNCTION IF EXISTS handle_product_updates();
