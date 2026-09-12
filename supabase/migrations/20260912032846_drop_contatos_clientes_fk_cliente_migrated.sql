-- Ticket #15 (ai-agent-playground#15): a tabela `clientes` migrou pro portal-backend
-- (MySQL, fora do Supabase). `contatos_clientes.cliente_id` continua existindo aqui
-- (contatos_clientes é CRM, fora de escopo da migração — fica no Supabase/n8n), mas
-- os IDs que ele referencia agora vivem em outro banco, então a FK local não pode
-- mais ser validada pelo Postgres. Sem isso, criar um contato pra um cliente NOVO
-- (criado só no portal-backend depois deste ticket) falharia com violação de FK,
-- já que esse ID nunca vai existir na tabela `clientes` local.
--
-- Os dados existentes (linhas antigas de `clientes`) continuam intactos aqui — só
-- paramos de aceitar novas escritas nessa tabela pelo Supabase (ver GestaoClientes.tsx),
-- então a FK vai gradualmente parar de fazer sentido de qualquer forma.

ALTER TABLE public.contatos_clientes
  DROP CONSTRAINT IF EXISTS contatos_clientes_cliente_id_fkey;
