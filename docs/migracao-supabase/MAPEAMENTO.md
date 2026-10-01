# Mapeamento: o que ainda depende do Supabase (portal-web, portal-api, n8n)

Levantado em 01/10/2026, com o projeto Supabase `nsdektdgohfqfioonosc` **pausado**. Plano de migração em
[PLANO.md](PLANO.md). Fontes: código do `portal-web` e do `portal-api`, `supabase/migrations`,
`supabase/functions`, `documentacao/` e leitura dos workflows ativos do n8n (somente leitura).

> **Atenção:** o schema real vivia no Supabase e as migrations versionadas cobrem só parte das tabelas
> (as do CRM foram criadas no Lovable, fora das migrations). Os tipos abaixo vêm de
> `documentacao/01-Dicionario_de_Dados.md` e do código; **conferir contra o schema real
> (`information_schema`) quando o projeto for restaurado, antes de escrever as migrations do MySQL.**

## 1. Já está no MySQL do portal-api (não migrar de novo)

`admin_users` (login do admin por cookie), `clientes`, `projetos`, `etapas`, `artefatos`, `pedidos`,
`pedido_respostas`. Artefatos (bucket `portfolio-privado`) já usam disco local (`Storage:ArtefatosRoot`).
O e-mail de notificação do portfólio já foi portado para o backend (`PortfolioNotificationService`).

## 2. Tabelas do Supabase que faltam migrar (6)

| Tabela | Colunas (origem) | Quem lê/escreve hoje | RLS no Supabase | Destino no portal-api |
|---|---|---|---|---|
| `colaboradores` | id uuid, created_at, nome, cargo, departamento, email (único), foto_url | `GestaoColabs` (CRUD), `pages/Colabs`, `LandingPage`, `GeradorConvites` (leitura) | anon: select, insert, update | `colaboradores`; `GET` público (landing/colabs), escrita admin |
| `contatos_clientes` | id, cliente_id → `clientes.id` (cascade), nome, telefone, email, created_at | `GestaoClientes` (CRUD), `GestaoLeads` (cria contato a partir do lead) | anon: select, insert, update, **delete** | `contatos_clientes` com FK real para `clientes` (a FK foi derrubada no Supabase porque `clientes` já tinha ido para MySQL); só admin |
| `leads_ia` | id, nome, contato, desafio_tecnico, canal, created_at, visto_pelo_nelson (bool), origem (default `Site_Institucional`), analise_ia, empresa | `LeadForm` (insert público), `GestaoLeads` (lista, marca visto), n8n **AddLeads** (update de `analise_ia`) | anon: insert (nas migrations); o painel também lê e atualiza com a chave anon, policy não versionada | `leads_ia`; `POST` público com rate limit; leitura/atualização admin; callback do n8n por segredo |
| `agendamentos` | id, created_at, cliente_nome, cliente_email, cliente_whatsapp, data_reuniao, status (default `pendente`), instagram_user_id, expert_responsavel, indicado_por, origem, valor_projeto numeric(10,2), comissao_paga bool | `DashboardAgendamentos` (lista, status, comissão), n8n **Instagram** (create) | anon: select, insert, update | `agendamentos`; escrita do n8n por segredo, painel admin |
| `enrich_company` | id, company_name, segment, output_ai, created_at | `LeadEnricher` (insert + polling de resposta) | anon: insert, select | `enrich_company`; `POST` público com rate limit + `GET` do resultado por id |
| `playground_analise` | id, input_tecnico, tipo_analise, output_ia, status, created_at | `TechPlayground` (insert + polling), n8n **AddChallenger** e **SearchCompany** (update de `output_ia`) | anon: insert, select | `playground_analise`; mesmo padrão do `enrich_company` |

Pendências de conferência nessa tabela:
- **`enrich_company` × `playground_analise`:** o front (`LeadEnricher`) usa `enrich_company`, mas o export do
  n8n SearchCompany atualiza `playground_analise`. Ver no n8n vivo qual tabela cada fluxo realmente grava.
- `agendamentos.indicado_por` guarda o **nome** do colaborador (não o id): manter como texto ou migrar para FK
  em `colaboradores`.
- Os 3 fluxos do n8n (AddLeads, AddChallenger, SearchCompany) recebem `body.record.*`, ou seja, o payload de um
  **Database Webhook do Supabase** (disparado por insert). No novo desenho o próprio portal-api chama o webhook
  do n8n depois do insert, mantendo o formato `{ record: {...} }` para quase não mexer nos fluxos.

## 3. Tabelas do Supabase que NÃO migram (descartar após backup)

- **Watchtower** (schema novo já está no MySQL do `watchtower-api`, sem usuários reais): `profiles`, `cameras`,
  `subscriptions`, `pending_payments`, `contact_messages`, `camera_health_logs`, `camera_health_config`,
  `plans`, `user_roles`, `plan_highlight_audit`.
- `produtos_dtc` (já removida em 12/09/2026).
- Funções SQL, triggers e tipos do Watchtower (`has_role`, `approve_pending_payment`, `handle_new_user`,
  `app_role`, `validate_subscription_plan_type`, etc.): morrem junto.

## 4. Auth (Supabase Auth → próprio)

| Quem | Hoje | Onde está |
|---|---|---|
| Admin | **já é próprio**: cookie httpOnly + `admin_users` no portal-api (`/auth/login`, CSRF) | `features/admin-auth`, `AuthEndpoints.cs` |
| Cliente do portal (`/portal`) | **Supabase magic link** (`signInWithOtp`) → JWT validado pelo `portal-api` (esquema `SupabaseJwt`, JWKS) → `GET /clientes/me` resolve o cliente pelo e-mail do token | `useClientAuth.tsx`, `apiClient.ts` (`portalClientApi`), `Program.cs` (policy `AdminOrClient`) |

Não há o que importar: o cliente é identificado pelo e-mail em `clientes.email`. `auth.users` do Supabase
tem também contas do Watchtower, que são descartadas.

Efeito colateral hoje: o `portal-api` **exige `Supabase:Url` no startup** e valida o JWT pela chave pública
remota; com o projeto pausado o login do cliente não funciona.

## 5. Storage

| Bucket | Conteúdo | Uso | Destino |
|---|---|---|---|
| `uploads` (público, com policies de insert/update/delete para anon) | `clientes/` (logos), `colaboradores/` (fotos), `convites/` (imagens do gerador de convites) | `ImageUpload` (upload, máx. 2 MB), `GeradorConvites` (lista/upload/remove), `LandingPage` (lista convites) | disco no portal-api (volume Docker), servido publicamente em leitura; upload/remoção só admin |
| `portfolio-privado` | artefatos de projeto | já migrado | disco local (`Storage:ArtefatosRoot`) |

As `logo_url` e `foto_url` gravadas hoje são URLs públicas do Supabase: reescrever para o novo caminho no import.

## 6. Edge Functions (`supabase/functions/`, 5)

| Função | Status | Ação |
|---|---|---|
| `portfolio-notify-email` | já portada para o `portal-api` (`PortfolioNotificationService`) | apagar |
| `camera-health-check`, `send-health-alert-email`, `watchtower-notify-access`, `watchtower-send-email` | Watchtower antigo, sem chamadores no `portal-web`; o `watchtower-api` tem health check próprio | apagar |

## 7. n8n (workflows ativos que usam Supabase; todos com a credencial `Supabase account 2`)

| Workflow | Node | Uso | Ação |
|---|---|---|---|
| `[PRD]SiteNPI-AddLeads` | Update a row | `leads_ia.update` (`analise_ia`, `visto_pelo_nelson`) | trocar por HTTP Request ao portal-api (com segredo) |
| `[PRD]SiteNPI-AddChallenger` | Update a row | `playground_analise.update` (`output_ia`) | idem |
| `[PRD]SiteNPI-SearchCompany` | Update a row | `playground_analise.update` (`output_ia`) | idem (confirmar tabela, ver acima) |
| `[PRD]SiteNPI-AutomatedServiceInstagram` | Create a row | `agendamentos.create` | idem; **também há um Bearer token escrito direto num node HTTP Request**: mover para credencial e rotacionar |
| `[PRD]SiteNPI-Validação Comprovante PIX` | 3 nodes | `profiles` / `subscriptions` (Watchtower antigo) | **arquivar**: já não corresponde ao `watchtower-api` (outro schema e outro payload) |

Os webhooks dos 3 fluxos "AddX" não têm autenticação (qualquer um pode disparar a IA): passar a exigir header
secreto.

**Não verificados** (o MCP do n8n não consegue abri-los): `CadastroUsuariosSite`, `[AulasHA]AgentIA-FAQ`,
`[AulasHA]Forms-SendEmail` e `TesteChat`. Abrir no editor do n8n e conferir nodes Supabase antes de desligar o
projeto. Dos inativos, `[AulasHA]AgentIA-CreateVector` e `AgenteIASite` podem usar Supabase Vector Store.

Workflows ativos lidos **sem** Supabase: `BeautyHairApp - Assistente Telegram`, `[PRD]LinkedInPost`,
`[PRD]LinkedInInsights`, `[PRD]SiteNPI-AjudanteCadastro`, `[PRD]SiteNPI-AjudanteTelegranAtividades`.

## 8. Achado de segurança (existe até hoje)

As policies RLS versionadas do CRM são **públicas**: `colaboradores`, `clientes`, `contatos_clientes` e
`agendamentos` aceitam select/update (e `contatos_clientes` até delete) com a chave anon, que vai no bundle do
site; `leads_ia` aceita insert público e o painel a lê e atualiza com a mesma chave. Quem abrir o site consegue
ler e alterar leads, e-mails e telefones de contatos e agendamentos. A migração fecha isso (leitura e escrita do
CRM só com sessão de admin no `portal-api`).

## 9. Referências no código (para a limpeza final)

- `portal-web`: `src/integrations/supabase/{client,types}.ts`, `supabase/` (config, 32 migrations, 5 functions),
  dependência `@supabase/supabase-js`, `.env` (`VITE_SUPABASE_*`), 16 arquivos em `src/` (lista no plano).
- `portal-api`: `Program.cs` (esquema `SupabaseJwt`, `Supabase:Url`), `appsettings.json`
  (`Supabase:Url`), `ImportClientesCommand.cs`, `ImportProjetosCommand.cs` (backfills únicos já usados),
  comentários em `ClienteEndpoints`, `ProjetoEndpoints`, `ProjetoDtos`, `Cliente`, `ClaimsPrincipalExtensions`.
- Workspace: `CLAUDE.md` (pendência), `.claude/rules/*`, `.claude/settings.local.json` (permissões do CLI
  `supabase`), documentação em `documentacao/` e `.llm/` (histórica).
