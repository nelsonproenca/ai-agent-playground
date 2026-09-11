-- Ticket: Portal do cliente — detalhe do projeto (issue #8)
--
-- Mesmo padrão aplicado a `projetos` na issue #5: a policy de SELECT
-- permissiva passa a valer só pra `anon` (admin); uma policy nova, escopada
-- por `authenticated`, garante que um cliente logado só leia etapas e
-- artefatos dos SEUS próprios projetos (join até `clientes.email`).

DROP POLICY "Allow public selects on etapas" ON public.etapas;

CREATE POLICY "Allow anon selects on etapas"
ON public.etapas FOR SELECT
TO anon
USING (true);

CREATE POLICY "Clients can select etapas of their own projetos"
ON public.etapas FOR SELECT
TO authenticated
USING (
  projeto_id IN (
    SELECT p.id FROM public.projetos p
    JOIN public.clientes c ON c.id = p.cliente_id
    WHERE c.email = (auth.jwt() ->> 'email')
  )
);

DROP POLICY "Allow public selects on artefatos" ON public.artefatos;

CREATE POLICY "Allow anon selects on artefatos"
ON public.artefatos FOR SELECT
TO anon
USING (true);

CREATE POLICY "Clients can select artefatos of their own projetos"
ON public.artefatos FOR SELECT
TO authenticated
USING (
  projeto_id IN (
    SELECT p.id FROM public.projetos p
    JOIN public.clientes c ON c.id = p.cliente_id
    WHERE c.email = (auth.jwt() ->> 'email')
  )
);

-- Storage: o path de cada objeto no bucket privado começa com o
-- `projeto_id` (ver uploadArtefatoArquivo). Um cliente autenticado só pode
-- gerar/usar signed URL para objetos cujo projeto é seu.
DROP POLICY "Allow selects on portfolio-privado bucket" ON storage.objects;

CREATE POLICY "Allow anon selects on portfolio-privado bucket"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'portfolio-privado');

CREATE POLICY "Clients can select files of their own projetos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'portfolio-privado'
  AND EXISTS (
    SELECT 1 FROM public.projetos p
    JOIN public.clientes c ON c.id = p.cliente_id
    WHERE p.id::text = (storage.foldername(name))[1]
      AND c.email = (auth.jwt() ->> 'email')
  )
);
