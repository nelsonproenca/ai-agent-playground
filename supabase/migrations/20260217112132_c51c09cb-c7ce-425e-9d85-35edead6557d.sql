-- Enable RLS on enrich_company
ALTER TABLE public.enrich_company ENABLE ROW LEVEL SECURITY;

-- Allow public inserts
CREATE POLICY "Allow public inserts on enrich_company"
ON public.enrich_company
FOR INSERT
WITH CHECK (true);

-- Allow public selects
CREATE POLICY "Allow public selects on enrich_company"
ON public.enrich_company
FOR SELECT
USING (true);
