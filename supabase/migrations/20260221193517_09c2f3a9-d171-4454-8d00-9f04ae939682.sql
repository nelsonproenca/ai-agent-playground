-- Enable RLS (if not already)
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- Allow public select
CREATE POLICY "Allow public selects on agendamentos"
  ON public.agendamentos FOR SELECT
  USING (true);

-- Allow public updates (for status/comissao changes)
CREATE POLICY "Allow public updates on agendamentos"
  ON public.agendamentos FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow public inserts
CREATE POLICY "Allow public inserts on agendamentos"
  ON public.agendamentos FOR INSERT
  WITH CHECK (true);