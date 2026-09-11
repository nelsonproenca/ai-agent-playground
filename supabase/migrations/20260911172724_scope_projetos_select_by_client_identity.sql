-- Ticket: Portal do cliente — login por magic link e lista de projetos (issue #5)
--
-- Até aqui, a policy de SELECT em `projetos` era "USING (true)" pra
-- qualquer role — inclusive `authenticated`. Isso é o suficiente pro
-- admin (que nunca autentica via Supabase Auth, só um flag local), mas
-- deixaria um cliente autenticado ver os projetos de QUALQUER cliente.
--
-- Troca: a policy permissiva passa a valer só pra `anon` (mantém o admin e
-- o resto do site funcionando exatamente como antes, já que a área admin
-- nunca cria sessão do Supabase Auth). Uma policy nova, escopada, restringe
-- `authenticated` (cliente logado via magic link) a enxergar somente os
-- projetos vinculados ao `cliente_id` cujo e-mail bate com o da sessão.

DROP POLICY "Allow public selects on projetos" ON public.projetos;

CREATE POLICY "Allow anon selects on projetos"
ON public.projetos FOR SELECT
TO anon
USING (true);

CREATE POLICY "Clients can select their own projetos"
ON public.projetos FOR SELECT
TO authenticated
USING (
  cliente_id = (
    SELECT id FROM public.clientes WHERE email = (auth.jwt() ->> 'email')
  )
);

-- Nota: INSERT/UPDATE/DELETE em `projetos` continuam permissivos pra
-- qualquer role (mesma convenção já usada nas outras tabelas do projeto —
-- a proteção de escrita hoje é só de UI/rota, não de RLS). Isso é uma
-- limitação pré-existente do modelo de segurança deste projeto, não
-- introduzida por esta migration.
