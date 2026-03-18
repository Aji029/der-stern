/*
  # Add Gutschrift Schema

  1. New Tables
    - `gutschriften` - Stores credit note records
      - `id` (uuid, primary key)
      - `order_id` (text, references orders)
      - `product_id` (text, references products)
      - `quantity` (decimal)
      - `price` (decimal)
      - `reason` (text)
      - `created_at` (timestamp)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on `gutschriften` table
    - Add policies for authenticated users

  3. Changes
    - Add trigger to update order totals when gutschrift is added/removed
*/

-- Create gutschriften table
CREATE TABLE public.gutschriften (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT REFERENCES public.products(artikel_nr) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price < 0), -- Ensure price is negative
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Enable RLS
ALTER TABLE public.gutschriften ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own gutschriften"
  ON public.gutschriften
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gutschriften"
  ON public.gutschriften
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gutschriften"
  ON public.gutschriften
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_gutschriften_order_id ON public.gutschriften(order_id);
CREATE INDEX idx_gutschriften_product_id ON public.gutschriften(product_id);
CREATE INDEX idx_gutschriften_user_id ON public.gutschriften(user_id);

-- Create function to update order totals when gutschrift is added/removed
CREATE OR REPLACE FUNCTION update_order_total_with_gutschrift()
RETURNS TRIGGER AS $$
BEGIN
  -- Update order total
  UPDATE public.orders o
  SET 
    total_amount = (
      SELECT 
        COALESCE(SUM(oi.total), 0) + COALESCE(SUM(g.price * g.quantity), 0)
      FROM public.order_items oi
      LEFT JOIN public.gutschriften g ON g.order_id = o.id
      WHERE oi.order_id = o.id
    )
  WHERE o.id = COALESCE(NEW.order_id, OLD.order_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_order_total_with_gutschrift_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.gutschriften
  FOR EACH ROW
  EXECUTE FUNCTION update_order_total_with_gutschrift();