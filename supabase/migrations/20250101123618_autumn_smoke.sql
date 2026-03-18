/*
  # Update Product Groups
  
  1. Changes
    - Update existing invalid produktgruppe values to 'Backwaren' (default)
    - Add new product group options to check constraint
*/

-- First update any existing rows with invalid produktgruppe values
UPDATE public.products 
SET produktgruppe = 'Backwaren'
WHERE produktgruppe NOT IN (
  'Backwaren',
  'Getränke',
  'Konserven',
  'Süßwaren', 
  'Tiefkühlkost',
  'Obst & Gemüse',
  'Molkerei & Feinkost'
);

-- Then remove existing check constraint if it exists
ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS products_produktgruppe_check;

-- Finally add new check constraint with updated product groups
ALTER TABLE public.products
ADD CONSTRAINT products_produktgruppe_check 
CHECK (produktgruppe IN (
  'Backwaren',
  'Getränke',
  'Konserven',
  'Süßwaren',
  'Tiefkühlkost',
  'Obst & Gemüse',
  'Molkerei & Feinkost'
));