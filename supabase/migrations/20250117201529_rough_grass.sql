-- Update products table
UPDATE public.products
SET user_id = 'efa944b5-5390-4e28-9b5c-55d71a226446'
WHERE user_id IS NULL;

-- Update customers table
UPDATE public.customers
SET user_id = 'efa944b5-5390-4e28-9b5c-55d71a226446'
WHERE user_id IS NULL;

-- Update suppliers table
UPDATE public.suppliers
SET user_id = 'efa944b5-5390-4e28-9b5c-55d71a226446'
WHERE user_id IS NULL;

-- Update orders table
UPDATE public.orders
SET user_id = 'efa944b5-5390-4e28-9b5c-55d71a226446'
WHERE user_id IS NULL;

-- Update order_items table
UPDATE public.order_items
SET user_id = 'efa944b5-5390-4e28-9b5c-55d71a226446'
WHERE user_id IS NULL;

-- Update categories table
UPDATE public.categories
SET user_id = 'efa944b5-5390-4e28-9b5c-55d71a226446'
WHERE user_id IS NULL;

-- Update customer_favorites table
UPDATE public.customer_favorites
SET user_id = 'efa944b5-5390-4e28-9b5c-55d71a226446'
WHERE user_id IS NULL;

-- Update sammelrechnungen table
UPDATE public.sammelrechnungen
SET user_id = 'efa944b5-5390-4e28-9b5c-55d71a226446'
WHERE user_id IS NULL;

-- Update profiles table
INSERT INTO public.profiles (id, name, company_name, phone, created_at, updated_at)
SELECT 
  'efa944b5-5390-4e28-9b5c-55d71a226446',
  'Default User',
  'Default Company',
  '',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = 'efa944b5-5390-4e28-9b5c-55d71a226446'
);