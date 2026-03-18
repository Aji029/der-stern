-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS set_sammelrechnung_number_trigger ON sammelrechnungen;
DROP FUNCTION IF EXISTS set_sammelrechnung_number();
DROP FUNCTION IF EXISTS generate_sammelrechnung_number();

-- Create new function to generate sammelrechnung number
CREATE OR REPLACE FUNCTION generate_sammelrechnung_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Get next number from sequence
  SELECT nextval('sammelrechnung_number_seq') INTO next_number;
  
  -- Format as YYYYMMDD-XXXX where XXXX is the padded number
  RETURN to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$;

-- Create new trigger function
CREATE OR REPLACE FUNCTION set_sammelrechnung_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.number IS NULL THEN
    NEW.number := generate_sammelrechnung_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger
CREATE TRIGGER set_sammelrechnung_number_trigger
  BEFORE INSERT ON sammelrechnungen
  FOR EACH ROW
  EXECUTE FUNCTION set_sammelrechnung_number();