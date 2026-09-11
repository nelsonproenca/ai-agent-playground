-- A migration anterior (create_projetos_table) esqueceu a policy de DELETE,
-- o que fez a limpeza dos testes de integração falhar silenciosamente
-- (delete não dava erro, mas não apagava nada) e deixar linhas órfãs no
-- banco. Necessário para a camada de serviço poder excluir projetos e para
-- os testes limparem os dados que criam.

CREATE POLICY "Allow public deletes on projetos"
ON public.projetos FOR DELETE
USING (true);
