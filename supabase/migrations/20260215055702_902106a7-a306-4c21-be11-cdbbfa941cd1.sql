
-- Enable RLS
ALTER TABLE public.leads_ia ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public form)
CREATE POLICY "Allow public inserts" ON public.leads_ia
FOR INSERT WITH CHECK (true);
