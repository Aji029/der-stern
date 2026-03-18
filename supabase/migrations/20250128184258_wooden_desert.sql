-- Create sequences table
CREATE TABLE IF NOT EXISTS public.sequences (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view sequences"
  ON public.sequences
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert sequences"
  ON public.sequences
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update sequences"
  ON public.sequences
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE TRIGGER set_sequences_updated_at
  BEFORE UPDATE ON public.sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();