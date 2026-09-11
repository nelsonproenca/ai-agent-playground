-- Ticket: Admin sobe artefatos vinculados a projeto/etapa (issue #4)

CREATE TABLE public.artefatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  etapa_id uuid REFERENCES public.etapas(id) ON DELETE SET NULL,
  nome text NOT NULL,
  -- Para arquivos: o PATH do objeto no bucket privado (não uma URL pública,
  -- já que o bucket não é público — a URL de acesso é assinada sob demanda).
  -- Para links externos: a URL completa.
  url text NOT NULL,
  tipo text NOT NULL DEFAULT 'arquivo' CHECK (tipo IN ('arquivo', 'link')),
  uploaded_by text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_artefatos_projeto_id ON public.artefatos(projeto_id);
CREATE INDEX idx_artefatos_etapa_id ON public.artefatos(etapa_id);

ALTER TABLE public.artefatos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts on artefatos"
ON public.artefatos FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public selects on artefatos"
ON public.artefatos FOR SELECT
USING (true);

CREATE POLICY "Allow public updates on artefatos"
ON public.artefatos FOR UPDATE
USING (true) WITH CHECK (true);

CREATE POLICY "Allow public deletes on artefatos"
ON public.artefatos FOR DELETE
USING (true);

-- Bucket de Storage PRIVADO (public = false) para artefatos de projeto —
-- separado do bucket `uploads` público já existente (usado por convites).
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-privado', 'portfolio-privado', false)
ON CONFLICT (id) DO NOTHING;

-- Nesta ticket o único consumidor é a área admin (mesmo modelo de acesso
-- "público via anon key" já usado no resto do projeto). Quando o portal do
-- cliente existir (issue #5/#8), o acesso de leitura passa a ser mediado por
-- signed URLs geradas pela camada de serviço, escopadas ao dono do projeto.
CREATE POLICY "Allow inserts on portfolio-privado bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'portfolio-privado');

CREATE POLICY "Allow selects on portfolio-privado bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio-privado');

CREATE POLICY "Allow deletes on portfolio-privado bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'portfolio-privado');
