/*
  # Create Sammelrechnungen (Collective Invoices) Table

  1. New Tables
    - `sammelrechnungen`
      - `id` (uuid, primary key)
      - `number` (text, unique invoice number)
      - `customer_id` (uuid, references customers)
      - `total_netto` (decimal)
      - `total_vat` (decimal)
      - `total_brutto` (decimal)
      - `status` (text: draft, sent, paid, cancelled)
      - `payment_status` (text: pending, paid, overdue)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `user_id` (uuid, references auth.users)

  2. Changes
    - Add `sammelrechnung_id` to orders table
    - Create sequence for sammelrechnung numbers
    - Add automatic number generation

  3. Security
    - Enable RLS
    - Add policies for CRUD operations
*/

-- Create sammelrechnungen table
CREATE TABLE public.sammelrechnungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT UNIQUE,
  customer_id UUID REFERENCES public.customers(id) NOT NULL,
  total_netto DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_vat DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_brutto DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Add sammelrechnung_id to orders
ALTER TABLE public.orders
ADD COLUMN sammelrechnung_id UUID REFERENCES public.sammelrechnungen(id);

-- Create sequence for sammelrechnung numbers
CREATE SEQUENCE sammelrechnung_number_seq
  START WITH 1000
  INCREMENT BY 1;

-- Create function to generate next sammelrechnung number
CREATE OR REPLACE FUNCTION generate_sammelrechnung_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Get next number from sequence
  SELECT nextval('sammelrechnung_number_seq') INTO next_number;
  
  -- Format as SR-YYYY-XXXX where XXXX is the padded number
  RETURN 'SR-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$;

-- Create trigger function to set number on insert
CREATE OR REPLACE FUNCTION set_sammelrechnung_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.number IS NULL THEN
    NEW.number := generate_sammelrechnung_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER set_sammelrechnung_number_trigger
  BEFORE INSERT ON sammelrechnungen
  FOR EACH ROW
  EXECUTE FUNCTION set_sammelrechnung_number();

-- Create indexes
CREATE INDEX idx_sammelrechnungen_customer_id ON public.sammelrechnungen(customer_id);
CREATE INDEX idx_sammelrechnungen_user_id ON public.sammelrechnungen(user_id);
CREATE INDEX idx_orders_sammelrechnung_id ON public.orders(sammelrechnung_id);

-- Enable RLS
ALTER TABLE public.sammelrechnungen ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own sammelrechnungen"
  ON public.sammelrechnungen
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sammelrechnungen"
  ON public.sammelrechnungen
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sammelrechnungen"
  ON public.sammelrechnungen
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sammelrechnungen"
  ON public.sammelrechnungen
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER set_sammelrechnungen_updated_at
  BEFORE UPDATE ON public.sammelrechnungen
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to update totals
CREATE OR REPLACE FUNCTION update_sammelrechnung_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update totals in sammelrechnungen when orders are added/removed/updated
  WITH order_totals AS (
    SELECT 
      sammelrechnung_id,
      SUM(total_amount) as total_brutto,
      SUM(CASE 
        WHEN oi.mwst = 'A' THEN total_amount / (1 + 0.07)
        WHEN oi.mwst = 'B' THEN total_amount / (1 + 0.19)
        ELSE total_amount
      END) as total_netto,
      SUM(CASE 
        WHEN oi.mwst = 'A' THEN total_amount - (total_amount / (1 + 0.07))
        WHEN oi.mwst = 'B' THEN total_amount - (total_amount / (1 + 0.19))
        ELSE 0
      END) as total_vat
    FROM public.orders o
    JOIN public.order_items oi ON o.id = oi.order_id
    WHERE sammelrechnung_id IS NOT NULL
    GROUP BY sammelrechnung_id
  )
  UPDATE public.sammelrechnungen sr
  SET 
    total_brutto = COALESCE(ot.total_brutto, 0),
    total_netto = COALESCE(ot.total_netto, 0),
    total_vat = COALESCE(ot.total_vat, 0),
    updated_at = NOW()
  FROM order_totals ot
  WHERE sr.id = ot.sammelrechnung_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update totals
CREATE TRIGGER update_sammelrechnung_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH STATEMENT
  EXECUTE FUNCTION update_sammelrechnung_totals();