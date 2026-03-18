-- Drop existing foreign key constraint
ALTER TABLE public.customer_favorites
DROP CONSTRAINT IF EXISTS customer_favorites_customer_id_fkey;

-- Re-add constraint with ON DELETE CASCADE
ALTER TABLE public.customer_favorites
ADD CONSTRAINT customer_favorites_customer_id_fkey
FOREIGN KEY (customer_id)
REFERENCES public.customers(id)
ON DELETE CASCADE;