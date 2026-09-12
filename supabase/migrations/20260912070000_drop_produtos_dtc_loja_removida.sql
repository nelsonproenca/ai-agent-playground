-- Remove a loja de teste (produtos_dtc) e suas policies.
-- Dados (26 produtos) foram exportados antes desta migration para
-- .llm/backup-produtos-dtc/produtos_dtc_backup_20260912.json.
-- Edge functions relacionadas (shopify-cart, shopify-token,
-- resolve-shopify-images) já foram removidas do projeto Supabase.

drop table if exists public.produtos_dtc cascade;
