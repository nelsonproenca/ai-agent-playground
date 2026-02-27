
CREATE TABLE public.produtos_dtc (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC NOT NULL,
  preco_comparativo NUMERIC,
  imagem_url TEXT,
  shopify_variant_id TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.produtos_dtc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public selects on produtos_dtc" ON public.produtos_dtc FOR SELECT USING (true);
CREATE POLICY "Allow public inserts on produtos_dtc" ON public.produtos_dtc FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public updates on produtos_dtc" ON public.produtos_dtc FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public deletes on produtos_dtc" ON public.produtos_dtc FOR DELETE USING (true);
