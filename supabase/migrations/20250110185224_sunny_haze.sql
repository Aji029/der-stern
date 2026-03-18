-- Add user_id column to order_items
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create index for user_id
CREATE INDEX IF NOT EXISTS idx_order_items_user_id ON public.order_items(user_id);

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Update existing order_items with user_id from their parent orders
UPDATE public.order_items oi
SET user_id = o.user_id
FROM public.orders o
WHERE oi.order_id = o.id
AND oi.user_id IS NULL;

-- Make user_id NOT NULL after updating existing records
ALTER TABLE public.order_items
ALTER COLUMN user_id SET NOT NULL;

-- Create RLS policies
CREATE POLICY "Users can view their own order items"
  ON public.order_items
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own order items"
  ON public.order_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own order items"
  ON public.order_items
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own order items"
  ON public.order_items
  FOR DELETE
  USING (auth.uid() = user_id);