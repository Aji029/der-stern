-- Add number column to sammelrechnungen
ALTER TABLE public.sammelrechnungen
ADD COLUMN IF NOT EXISTS number TEXT UNIQUE;

-- Create sequence for sammelrechnung numbers
CREATE SEQUENCE IF NOT EXISTS sammelrechnung_number_seq
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