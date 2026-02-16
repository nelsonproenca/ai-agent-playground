CREATE POLICY "Allow public select for dashboard"
ON public.leads_ia
FOR SELECT
USING (true);