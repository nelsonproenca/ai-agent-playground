
-- Enable RLS
ALTER TABLE public.produtos_dtc ENABLE ROW LEVEL SECURITY;

-- Allow public reads (loja pública)
CREATE POLICY "Allow public selects on produtos_dtc"
ON public.produtos_dtc
FOR SELECT
USING (true);

-- Allow public inserts (admin sem auth por enquanto)
CREATE POLICY "Allow public inserts on produtos_dtc"
ON public.produtos_dtc
FOR INSERT
WITH CHECK (true);

-- Allow public updates
CREATE POLICY "Allow public updates on produtos_dtc"
ON public.produtos_dtc
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow public deletes
CREATE POLICY "Allow public deletes on produtos_dtc"
ON public.produtos_dtc
FOR DELETE
USING (true);
