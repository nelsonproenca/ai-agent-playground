CREATE POLICY "Allow public update visto_pelo_nelson"
ON public.leads_ia
FOR UPDATE
USING (true)
WITH CHECK (true);