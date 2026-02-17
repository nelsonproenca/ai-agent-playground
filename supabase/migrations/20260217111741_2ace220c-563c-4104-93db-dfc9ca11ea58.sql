-- Enable RLS on playground_analise
ALTER TABLE public.playground_analise ENABLE ROW LEVEL SECURITY;

-- Allow public inserts
CREATE POLICY "Allow public inserts on playground_analise"
ON public.playground_analise
FOR INSERT
WITH CHECK (true);

-- Allow public selects
CREATE POLICY "Allow public selects on playground_analise"
ON public.playground_analise
FOR SELECT
USING (true);
