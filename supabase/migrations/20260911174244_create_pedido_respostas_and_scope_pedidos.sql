-- Ticket: Cliente responde a um pedido tipo pergunta (issue #9)

CREATE TABLE public.pedido_respostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  texto text NOT NULL,
  -- Path do objeto no bucket privado (mesmo formato de artefatos.url) —
  -- nunca uma URL pública/permanente.
  arquivo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pedido_respostas_pedido_id ON public.pedido_respostas(pedido_id);

ALTER TABLE public.pedido_respostas ENABLE ROW LEVEL SECURITY;

-- Escrita permissiva (mesma convenção do resto do projeto — a UI do portal
-- só deixa o cliente responder pedidos que ele já enxerga via SELECT
-- escopado, ver abaixo).
CREATE POLICY "Allow public inserts on pedido_respostas"
ON public.pedido_respostas FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow anon selects on pedido_respostas"
ON public.pedido_respostas FOR SELECT
TO anon
USING (true);

CREATE POLICY "Clients can select responses of their own projetos"
ON public.pedido_respostas FOR SELECT
TO authenticated
USING (
  pedido_id IN (
    SELECT ped.id FROM public.pedidos ped
    JOIN public.projetos p ON p.id = ped.projeto_id
    JOIN public.clientes c ON c.id = p.cliente_id
    WHERE c.email = (auth.jwt() ->> 'email')
  )
);

-- `pedidos` também precisa de SELECT escopado agora que o portal do
-- cliente vai listar os pedidos do próprio projeto (mesmo padrão de
-- projetos/etapas/artefatos das issues #5/#8).
DROP POLICY "Allow public selects on pedidos" ON public.pedidos;

CREATE POLICY "Allow anon selects on pedidos"
ON public.pedidos FOR SELECT
TO anon
USING (true);

CREATE POLICY "Clients can select pedidos of their own projetos"
ON public.pedidos FOR SELECT
TO authenticated
USING (
  projeto_id IN (
    SELECT p.id FROM public.projetos p
    JOIN public.clientes c ON c.id = p.cliente_id
    WHERE c.email = (auth.jwt() ->> 'email')
  )
);
