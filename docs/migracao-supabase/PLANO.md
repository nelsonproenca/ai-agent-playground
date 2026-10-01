# Plano: tirar o site institucional do Supabase (portal-web + portal-api + n8n)

Criado em 01/10/2026. Mesma direção da migração do Watchtower: **MySQL do `portal-api`, auth próprio,
storage em disco, e-mail por Resend**. O inventário completo (tabelas, colunas, quem usa, RLS) está em
[MAPEAMENTO.md](MAPEAMENTO.md).

## Situação e premissas

- O projeto Supabase está **pausado**: login do cliente, CRM (leads, colaboradores, agendamentos, contatos),
  vitrine `/clientes`, landing de convites e os formulários do site que gravam lá estão **fora do ar** agora.
  Não há um corte "sem parada" a proteger; a migração é restaurar o serviço.
- O `portal-api` **já** tem MySQL, login de admin por cookie (`admin_users`), Resend, storage em disco e as
  entidades `clientes`, `projetos`, `etapas`, `artefatos`, `pedidos`, `pedido_respostas`. Falta o resto do CRM,
  o login do cliente e os uploads públicos.
- Seis tabelas restantes: `colaboradores`, `contatos_clientes`, `leads_ia`, `agendamentos`, `enrich_company`,
  `playground_analise`. O resto do Supabase (Watchtower, Edge Functions) é descartado.
- Dados: ainda há valor (leads, agendamentos, contatos, imagens). Dá para exportar enquanto o projeto puder ser
  restaurado, então **a Fase 0 vem antes de qualquer outra coisa**.

## Decisões a tomar (recomendação em negrito)

1. **Login do cliente:** magic link por e-mail (como hoje) ou código de 6 dígitos? → **magic link com token
   de uso único hasheado (validade 15 min), e sessão por cookie httpOnly com papel `cliente`**, igual ao admin
   (mesma origem, sem token em `localStorage`).
2. **Imagens públicas (logos, fotos, convites):** servidas pelo Caddy direto do volume ou por endpoint da API?
   → **endpoint público de leitura no `portal-api` (cache longo)**; upload e remoção só admin.
3. **Dados históricos:** restaurar e importar, ou começar vazio? → **importar** (volume pequeno; o padrão de
   backfill já existe em `ImportClientesCommand`).
4. **Workflow "Validação Comprovante PIX":** → **arquivar** (é do Watchtower antigo e já não bate com a API).

## Fases

### Fase 0: Salvar o que existe (antes de tudo)

1. No painel do Supabase, **restaurar o projeto** (projetos pausados têm prazo para restauração; conferir o
   prazo no dashboard e não deixar vencer).
2. Exportar: as 6 tabelas (CSV pelo dashboard ou `pg_dump --data-only -t ...`), o bucket `uploads`
   completo (`clientes/`, `colaboradores/`, `convites/`) e o schema real (`information_schema.columns`) das 6
   tabelas, para validar os tipos do MAPEAMENTO.
3. Guardar o backup fora do VPS e fora do repo. Os dados têm e-mail e telefone de terceiros.
4. Aproveitar a janela com o projeto ativo para **fechar as policies públicas** das tabelas (ou pausar de
   novo logo após exportar): o achado de segurança do MAPEAMENTO existe enquanto estiver ativo.

### Fase 1: `portal-api`, dados do CRM

Seguir o padrão do projeto (Clean Architecture, handlers registrados à mão, `Result<T>`).
1. Entidades e configurations para as 6 tabelas, **migration** única; `contatos_clientes` com FK real para
   `clientes` e `ON DELETE CASCADE`. Ids em `Guid` (preservando os do Supabase).
2. Endpoints (todos em `/api/portal/...`):
   - **Públicos com rate limit:** `POST /leads` (formulário do site), `POST /enrich` e `POST /playground`
     (criam o registro e devolvem o id), `GET /enrich/{id}` e `GET /playground/{id}` (o front faz polling do
     resultado), `GET /colaboradores` (landing e `/colabs`), `GET /convites` (lista de imagens).
   - **Admin (cookie + CSRF):** CRUD de `colaboradores`, `contatos_clientes`, leitura e marcação de `leads_ia`,
     leitura e edição de `agendamentos` (status, comissão), conversão lead → contato.
   - **Chamadas do n8n (header `X-Webhook-Secret`):** `POST /agendamentos` (fluxo do Instagram),
     `PATCH /leads/{id}/analise`, `PATCH /playground/{id}/resultado`, `PATCH /enrich/{id}/resultado`.
3. **Gatilho para o n8n:** depois de gravar um lead, um enrich ou um playground, o `portal-api` chama o webhook
   do n8n com `{ "record": { ... } }` (mesmo formato do Database Webhook do Supabase) e o segredo. Falha do n8n
   não derruba o POST do usuário (log e segue).
4. Importadores únicos (`dotnet run -- import-<tabela> <arquivo>`) que leem os CSV/JSON exportados e
   preservam ids e `created_at` (padrão do `ImportClientesCommand`, mas lendo de arquivo, não da API do
   Supabase). Rodar com os dados da Fase 0.
5. Testes xUnit (EF InMemory) dos handlers novos, no padrão do `watchtower-api`.

### Fase 2: `portal-api`, login do cliente e uploads

1. **Login do cliente:** tabela `cliente_login_tokens` (hash do token, e-mail, expiração, uso único);
   `POST /auth/cliente/solicitar` (rate limit, resposta igual exista o e-mail ou não, só envia se houver
   `clientes.email`), `GET /auth/cliente/verificar?token=` (consome o token e emite o cookie com papel
   `cliente`), `POST /auth/cliente/logout`. O e-mail sai pelo `IEmailService` (Resend) que já existe.
2. Trocar a policy `AdminOrClient` para usar **só** o esquema de cookie (admin ou cliente) e **remover o esquema
   `SupabaseJwt`** e a exigência de `Supabase:Url` no startup. `GET /clientes/me` passa a ler o e-mail do
   cookie. Manter a regra atual de "cliente só vê o que é seu" dentro dos handlers.
3. **Uploads:** `POST /uploads/{pasta}` (admin, tipo e tamanho validados, máx. 2 MB, nome gerado pelo servidor),
   `DELETE /uploads/...` (admin) e `GET /uploads/{pasta}/{arquivo}` público. Volume Docker dedicado. Pastas
   permitidas: `clientes`, `colaboradores`, `convites`. Copiar os arquivos do bucket (Fase 0) e reescrever
   `logo_url`/`foto_url` no import.

### Fase 3: `portal-web`

Trocar cada chamada ao Supabase por funções em `src/features/<dominio>/api.ts` (cliente HTTP central, sem
`fetch` solto). Arquivos afetados:
- Dados: `GestaoClientes`, `GestaoColabs`, `GestaoLeads`, `LeadEnricher`, `LeadForm`, `TechPlayground`,
  `pages/Colabs`, `pages/DashboardAgendamentos`, `pages/GeradorConvites`, `pages/LandingPage`.
- Storage: `ImageUpload`, `GeradorConvites`, `LandingPage`.
- Auth do cliente: `features/portfolio/useClientAuth.tsx` (magic link pelo `portal-api`),
  `features/portal-shared/apiClient.ts` (sem `supabase.auth.getSession`; passa a usar cookie com
  `credentials: "include"`), `features/portfolio/api.ts` e `api.test.ts` (referências).
- Remover: `src/integrations/supabase/`, a pasta `supabase/` (migrations e functions), a dependência
  `@supabase/supabase-js`, as variáveis `VITE_SUPABASE_*` do `.env` e do `.env.example`.
- **Lovable:** o projeto nasceu no Lovable, que regenera `integrations/supabase` e `supabase/`. Desconectar a
  sincronização com o Lovable antes de começar para não reintroduzir isso.
Testes: ajustar `api.test.ts`, rodar `npm run lint`, `npm test`, `npm run build`.

### Fase 4: n8n

1. **AddLeads, AddChallenger, SearchCompany:** trocar o node Supabase "Update a row" por **HTTP Request** ao
   endpoint `PATCH` correspondente do `portal-api` (credencial de header com o segredo); o webhook de entrada
   passa a exigir o header secreto.
2. **Instagram (AutomatedServiceInstagram):** trocar "Create a row" por `POST /agendamentos` no portal-api.
   Mover o Bearer que está escrito direto no node HTTP Request para uma credencial do n8n e **rotacionar** o token.
3. **Validação Comprovante PIX:** arquivar.
4. **Conferir os 4 workflows que o MCP não abre** (`CadastroUsuariosSite`, `[AulasHA]AgentIA-FAQ`,
   `[AulasHA]Forms-SendEmail`, `TesteChat`) e os inativos com Vector Store (`[AulasHA]AgentIA-CreateVector`,
   `AgenteIASite`) para garantir que nenhum depende do Supabase antes de desligá-lo.
5. Apagar a credencial `Supabase account 2` quando nenhum workflow a usar.

### Fase 5: Deploy e validação (portal-api e portal-web)

1. Variáveis novas no `.env` do `portal-api` na VPS (segredo do webhook do n8n, URL do webhook, base URL pública
   para o link do e-mail), volume de uploads, e remoção de `Supabase__*`. Gerar segredos na VPS, sem imprimi-los
   (padrão `scripts/vps-prepare.sh` do Watchtower).
2. `bash deploy.sh portal back` e `bash deploy.sh portal front` (confirmar o nome do alvo no `deploy.sh`).
3. Rodar os importadores com os dados da Fase 0 e conferir contagens por tabela.
4. Smoke test: login admin; CRUD de colaboradores e contatos; formulário de lead (+ resposta da IA chegando);
   enrich e playground com polling; agendamento criado pelo fluxo do Instagram; landing de convites; vitrine
   `/clientes`; login do cliente por e-mail e `GET /clientes/me`; upload e remoção de imagem.
5. Sem usuários dependendo hoje (o Supabase está pausado), não há janela de manutenção a combinar.

### Fase 6: Limpeza

- `portal-api`: apagar `ImportClientesCommand`, `ImportProjetosCommand` (backfills já usados), config
  `Supabase:*` e os comentários que citam o Supabase.
- Workspace: `CLAUDE.md` (remover a pendência), `.claude/rules/*`, `.claude/settings.local.json` (permissões do
  CLI `supabase`), `documentacao/01-Dicionario_de_Dados.md` (reescrever para MySQL) e
  `02-Inventario_de_Fluxos_n8n.md`. Os PRDs de `.llm/` ficam como histórico.
- Encerrar de vez o projeto Supabase só depois de: backup confirmado, dados importados e validados, 4
  workflows conferidos e uma semana de produção estável.
- Rotacionar o que passou por lugares inseguros: token Bearer do fluxo do Instagram e a chave anon do Supabase
  (já no histórico do git e no bundle).

## Ordem e dependências

`Fase 0` (salvar) → `1` e `2` (backend, podem andar juntas) → `3` (front, depende dos endpoints) → `4` (n8n,
depende dos endpoints de callback) → `5` (deploy e importação) → `6` (limpeza). A Fase 0 é urgente por causa do
prazo de restauração; o restante não tem pressa de calendário.

## Riscos

1. **Prazo de restauração do projeto pausado:** perder o prazo = perder leads, agendamentos e imagens. Fazer a
   Fase 0 primeiro.
2. **Schema real diferente do documentado:** o dicionário de dados está desatualizado (tem até títulos
   repetidos). Validar com `information_schema` antes das migrations.
3. **Login do cliente é a peça sensível:** token de uso único e curto, guardado só como hash, rate limit, resposta
   genérica (não revela quais e-mails são clientes), cookie `HttpOnly`/`Secure`/`SameSite`, CSRF nas escritas.
4. **Endpoints públicos que acionam IA** (`leads`, `enrich`, `playground`): rate limit por IP e limites de
   tamanho do texto, senão viram canal de abuso e custo (cada chamada dispara um fluxo de IA no n8n).
5. **Fluxos do n8n sem autenticação hoje:** qualquer um pode disparar. Resolver junto com a Fase 4.
6. **Lovable reintroduzindo o Supabase** se a sincronização continuar ligada.
7. **Divergência `enrich_company` × `playground_analise`** entre front e n8n: confirmar antes de escrever o
   callback.
