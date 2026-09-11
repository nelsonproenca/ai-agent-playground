-- Ticket: Admin cria projeto vinculado a um cliente (issue #2)
-- Tabela de projetos do portal/portfólio, vinculada a um cliente já cadastrado.

CREATE TABLE public.projetos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nome text NOT NULL,
  categoria text,
  status_publico text NOT NULL DEFAULT 'em_andamento'
    CHECK (status_publico IN ('em_andamento', 'concluido')),
  visibilidade text NOT NULL DEFAULT 'privado'
    CHECK (visibilidade IN ('publico', 'privado')),
  imagem_capa_url text,
  link_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_projetos_cliente_id ON public.projetos(cliente_id);
CREATE INDEX idx_projetos_visibilidade ON public.projetos(visibilidade);

-- RLS: segue o mesmo padrão já usado em `clientes`/`colaboradores` neste projeto
-- (acesso liberado via anon key; a proteção de rota fica no front-end/useAuth).
-- Escopo mais restrito (cliente só vê os próprios projetos, visitante só vê
-- projetos públicos) é responsabilidade da camada de serviço nas próximas tickets.
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts on projetos"
ON public.projetos FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public selects on projetos"
ON public.projetos FOR SELECT
USING (true);

CREATE POLICY "Allow public updates on projetos"
ON public.projetos FOR UPDATE
USING (true) WITH CHECK (true);
