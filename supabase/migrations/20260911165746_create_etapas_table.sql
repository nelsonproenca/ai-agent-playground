-- Ticket: Admin define etapas de um projeto (issue #3)
-- Timeline de etapas de um projeto, definida manualmente por Nelson (sem
-- conjunto fixo/padronizado — ver decisão Q19 do spec da issue #1).

CREATE TABLE public.etapas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'em_andamento', 'concluida')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_etapas_projeto_id ON public.etapas(projeto_id);

-- RLS: mesmo padrão permissivo já usado em `projetos`/`clientes` neste
-- projeto (inclui DELETE desde já — ver bug da migration anterior).
ALTER TABLE public.etapas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts on etapas"
ON public.etapas FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public selects on etapas"
ON public.etapas FOR SELECT
USING (true);

CREATE POLICY "Allow public updates on etapas"
ON public.etapas FOR UPDATE
USING (true) WITH CHECK (true);

CREATE POLICY "Allow public deletes on etapas"
ON public.etapas FOR DELETE
USING (true);
