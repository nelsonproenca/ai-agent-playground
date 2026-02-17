
-- RLS policies for colaboradores (public access like leads_ia)
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts on colaboradores"
ON public.colaboradores FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public selects on colaboradores"
ON public.colaboradores FOR SELECT
USING (true);

CREATE POLICY "Allow public updates on colaboradores"
ON public.colaboradores FOR UPDATE
USING (true) WITH CHECK (true);

-- RLS policies for clientes
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts on clientes"
ON public.clientes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public selects on clientes"
ON public.clientes FOR SELECT
USING (true);

CREATE POLICY "Allow public updates on clientes"
ON public.clientes FOR UPDATE
USING (true) WITH CHECK (true);

-- RLS policies for contatos_clientes
ALTER TABLE public.contatos_clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts on contatos_clientes"
ON public.contatos_clientes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public selects on contatos_clientes"
ON public.contatos_clientes FOR SELECT
USING (true);

CREATE POLICY "Allow public updates on contatos_clientes"
ON public.contatos_clientes FOR UPDATE
USING (true) WITH CHECK (true);

CREATE POLICY "Allow public deletes on contatos_clientes"
ON public.contatos_clientes FOR DELETE
USING (true);
