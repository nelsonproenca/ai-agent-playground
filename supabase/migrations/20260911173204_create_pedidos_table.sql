-- Ticket: Admin cria pedidos (pergunta ou validação) vinculados a uma etapa
-- (issue #6). Mecanismo unificado (decisão Q12 do spec): um "pedido" cobre
-- tanto perguntas estruturadas quanto validação de entrega, diferenciados
-- pelo campo `tipo`.

CREATE TABLE public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  etapa_id uuid REFERENCES public.etapas(id) ON DELETE SET NULL,
  tipo text NOT NULL CHECK (tipo IN ('pergunta', 'validacao')),
  titulo text NOT NULL,
  status text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'respondido', 'aprovado', 'ajuste_solicitado')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pedidos_projeto_id ON public.pedidos(projeto_id);
CREATE INDEX idx_pedidos_etapa_id ON public.pedidos(etapa_id);

-- RLS: convenção permissiva atual (mesma de projetos/etapas/artefatos antes
-- da issue #5). Esta ticket cobre só o lado admin (criar pedidos). Escopo
-- de leitura pro cliente autenticado (só pedidos do próprio projeto) fica
-- pra quando o portal do cliente também ler/responder pedidos (issue #8/#9),
-- seguindo o mesmo padrão de scoping aplicado em `projetos` na issue #5.
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts on pedidos"
ON public.pedidos FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public selects on pedidos"
ON public.pedidos FOR SELECT
USING (true);

CREATE POLICY "Allow public updates on pedidos"
ON public.pedidos FOR UPDATE
USING (true) WITH CHECK (true);

CREATE POLICY "Allow public deletes on pedidos"
ON public.pedidos FOR DELETE
USING (true);
