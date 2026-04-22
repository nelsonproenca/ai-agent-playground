-- Adicionar colunas faltantes na tabela cameras para compatibilidade com DTO do frontend
ALTER TABLE public.cameras
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS hls_base_url text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Backfill: usar internal_stream_key como slug inicial onde estiver vazio
UPDATE public.cameras
SET slug = internal_stream_key
WHERE slug IS NULL;

-- Garantir unicidade do slug (necessário para lookups por slug)
CREATE UNIQUE INDEX IF NOT EXISTS cameras_slug_unique_idx
  ON public.cameras (slug)
  WHERE slug IS NOT NULL;

-- Index para filtros por status ativo
CREATE INDEX IF NOT EXISTS cameras_is_active_idx
  ON public.cameras (is_active);