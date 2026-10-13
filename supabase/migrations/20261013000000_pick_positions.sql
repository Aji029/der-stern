-- Store-walk order for Today's Pick.
--
-- products.pick_position  : where the article sits on the walk through the
--                           market. Lower numbers are picked first; articles
--                           without a number stay alphabetical at the end of
--                           their supplier group.
-- suppliers.pick_position : order of the supplier groups on the pick list.
--
-- Run in the Supabase SQL editor. Safe to run more than once.

ALTER TABLE public.products  ADD COLUMN IF NOT EXISTS pick_position integer;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS pick_position integer;
