-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS set_order_number_trigger ON orders;
DROP FUNCTION IF EXISTS set_order_number();
DROP FUNCTION IF EXISTS generate_order_number();
DROP SEQUENCE IF EXISTS order_number_seq;

-- Create a new sequence starting from 10001
CREATE SEQUENCE order_number_seq
  START WITH 10001
  INCREMENT BY 1
  MAXVALUE 99999
  MINVALUE 10001
  CYCLE;

-- Create function to generate next order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN LPAD(nextval('order_number_seq')::TEXT, 5, '0');
END;
$$;

-- Create trigger function
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.id := generate_order_number();
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();