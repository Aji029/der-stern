-- Stop maintaining customer_favorites through a trigger.
--
-- update_customer_favorites_trigger ran AFTER INSERT OR UPDATE ON orders and
-- added every line of the order to customer_favorites again on EVERY save
-- (edit, status change, packing), so order_count and total_quantity grew to
-- several times the truth (5.6x on average for Ganymed Brasserie) and the
-- ranking was wrong. It also rejected any order that listed the same article
-- twice (21000: ON CONFLICT DO UPDATE command cannot affect row a second time),
-- which blocked saving order 14991 on 26 Oct 2026.
--
-- The app now computes favourites from the real order history when the
-- product search opens (src/components/search/ProductSearchInput.tsx), so the
-- trigger and its function are no longer needed. The table is kept for now;
-- nothing reads it any more.
--
-- Supersedes 20261026000000_customer_favorites_group_by.sql, which only made
-- the trigger tolerate duplicate lines. Run in the Supabase SQL editor; safe to
-- run more than once.

DROP TRIGGER IF EXISTS update_customer_favorites_trigger ON orders;
DROP FUNCTION IF EXISTS update_customer_favorites();
