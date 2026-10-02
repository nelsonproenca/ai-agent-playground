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

Pontos confirmados no n8n vivo (detalhes na seção 7):
- **`enrich_company` × `playground_analise` está de fato errado hoje:** o front lê o resultado em
  `enrich_company.output_ai`, mas o fluxo SearchCompany grava em `playground_analise.output_ia` (e ainda com o
  filtro quebrado). Na migração, cada fluxo grava na sua tabela pelo callback do `portal-api`.
- `agendamentos.indicado_por` é texto livre (nome do Nelson ou o `ref` do referral do Instagram), sem relação
  com `colaboradores`: manter como texto.
- Os 3 fluxos "AddX" esperam o envelope `body.record.*` de um **Database Webhook do Supabase**, o que deixa de
  existir. Em vez de imitar esse formato, o novo desenho define um contrato simples (seção 4 do PLANO) e corrige os
  fluxos.

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

## 7. n8n

Validado em 02/10/2026 lendo os workflows ativos pelo MCP (somente leitura). Todos os nodes Supabase usam a
credencial `Supabase account 2`. Não há HTTP Request para `supabase.co`, nem Postgres, nem Supabase Vector Store
nos workflows lidos.

### 7.1 Fluxos que gravam no Supabase

| Workflow | Webhook (sem autenticação) | Entrada esperada | Supabase | Problemas encontrados |
|---|---|---|---|---|
| `[PRD]SiteNPI-AddLeads` (`Xb6IvquUoQ6l94WN`) | `/webhook/leads-site` | envelope `body.record.{id,nome,contato,desafio_tecnico,canal}` (Database Webhook) | `leads_ia` update: `analise_ia`, `visto_pelo_nelson` (filtro por `LeadID`) | `$json.Contacto` (typo) no prompt vem vazio; também avisa por Telegram (chatId fixo) |
| `[PRD]SiteNPI-AddChallenger` (`G8znRFLuaeQyeeaS`) | `/webhook/analise-tecnica` | `body.record.{id,input_tecnico,tipo_analise}` | `playground_analise` update: `output_ia` | filtro usa `LeadID`, mas o node cria `AnaliseID` → **o update nunca acha a linha**; o prompt lê `tipo_analise`/`input_tecnico` e os campos criados são `TipoAnalise`/`InputTecnico` → **prompt vazio** |
| `[PRD]SiteNPI-SearchCompany` (`H2xEDyr0NjYsBnii`) | `/webhook/enriquecer-empresa` | `body.record.{nome_empresa,segmento_empresa}` (não lê o `id`) | `playground_analise` update: `output_ia` | não cria `LeadID` → **update não acha a linha**; grava em `playground_analise`, mas o front espera o resultado em `enrich_company.output_ai` → **o enriquecimento não fecha o ciclo hoje** |
| `[PRD]SiteNPI-AutomatedServiceInstagram` (`ltYe2RxTxW5TNcQo`) | `/webhook/atendimento_instagram` (payload da Meta, não é Database Webhook) | `body.entry[0].messaging[0]...` | `agendamentos` insert: `cliente_nome`, `cliente_email`, `cliente_whatsapp`, `data_reuniao`, `status="confirmado"`, `instagram_user_id`, `indicado_por`, `origem` (`site_instagram` ou `folder_fisico`) | expressões escritas `json.xxx` (sem `$`), provavelmente não resolvem; **Bearer da Meta escrito direto no node HTTP Request** (mover para credencial e rotacionar). Agenda sempre com o Nelson (único expert, calendário Google); `indicado_por` é só texto |

Como o **front chama o n8n hoje** (do navegador, `mode: "no-cors"`):
- `LeadEnricher` → `/webhook/enriquecer-empresa` com `{id, nome_empresa, segmento_empresa}` (corpo solto, sem
  `record`), e depois faz polling em `enrich_company.output_ai`.
- `TechPlayground` → **`/webhook-test/leads-site`** (URL de teste, que só responde com o editor aberto, e é o
  path de leads, não o de análise) com `{id, input_tecnico, tipo_analise}`, e depois polling em
  `playground_analise.output_ia`.
- `LeadForm` só insere em `leads_ia` (quem dispara o n8n é o Database Webhook do Supabase).

Conclusão: **o Playground e o Enricher já estavam inconsistentes antes da pausa** (contrato do payload,
`LeadID`, tabela de destino, URL de teste). A migração é a oportunidade de definir um contrato único e corrigir
os três fluxos, não só de trocar o node de banco.

### 7.2 Outros workflows ativos

| Workflow | Gatilho | Observação |
|---|---|---|
| `[PRD]SiteNPI-Validação Comprovante PIX` (`nc6px6dcRJigkUQe`) | webhook `/validar-pagamento` (header auth) | **Watchtower antigo**: usa `profiles` e `subscriptions` do Supabase e espera outro payload; não bate com o `watchtower-api`. Arquivar |
| `[PRD]SiteNPI-AgentIA-FAQ` (`1pOv6396VsYt6gTs`) | WhatsApp Trigger | agente de FAQ de e-commerce (curso); tool Supabase `produtos_dtc` getAll — **tabela removida em 12/09/2026, tool quebrada**; também usa Pinecone (não é Supabase) |
| `[PRD]SiteNPI-CadastroUsuariosSite` (`JC1ytFdRKYjRAOhm`) | Form Trigger | cadastro do "site de astrologia"; usa **Google Sheets**, sem Supabase. **Reenvia a senha em texto por e-mail e a guarda na planilha**: risco |
| `[PRD]SiteNPI-Forms-SendEmail` (`kpLRdPGtoFFxJ7xm`) | Execute Workflow (sub-workflow) | e-mail de funcionário pelo Gmail; sem Supabase |
| `[PRD]SiteNPI-AjudanteCadastro`, `-AjudanteTelegranAtividades` | Form / Telegram | Google Sheets e Gemini; sem Supabase |
| `[PRD]LinkedInPost`, `[PRD]LinkedInInsights` | Telegram | Gemini, Gmail, Docs, SerpAPI; sem Supabase |
| `BeautyHairApp - Assistente Telegram` (`7naUAYLjSKSPPs6s`) | webhook | chama `beautyhairapp-api`; sem Supabase |

**Ainda não verificado:** `[PRD]SiteNPI-ChatCriarEventos` (`1Xgl5uys9ge3IV78`) segue com "MCP desabilitado"
(o flag não ficou ligado depois do renome; reativar no card do workflow). Também fechados para o MCP, ambos
inativos: `AgenteIASite` e `[AulasHA]AgentIA-CreateVector` (este último pode ter Supabase Vector Store).

### 7.3 Separação por projeto (regra em `.claude/rules/n8n-workflows.md`)

Convenção: `[PRD]<Projeto>-<Fluxo>` com `SiteNPI` (site institucional), `WTower` (Watchtower) e `BeHair`
(BeautyHairApp). Situação hoje e renomes propostos (executar só com o OK do Nelson):

| Hoje | Projeto | Nome proposto | Obs. |
|---|---|---|---|
| `[PRD]SiteNPI-AddLeads` / `-AddChallenger` / `-SearchCompany` / `-AutomatedServiceInstagram` | SiteNPI | já corretos | corrigir os fluxos (Fase 4) |
| `[PRD]SiteNPI-AjudanteCadastro`, `-AjudanteTelegranAtividades`, `-AgentIA-FAQ`, `-CadastroUsuariosSite`, `-Forms-SendEmail`, `-ChatCriarEventos` | SiteNPI | já corretos | conteúdo vem de curso/outros contextos; decidir se ficam em produção |
| `BeautyHairApp - Assistente Telegram` | BeHair | `[PRD]BeHair-AssistenteTelegram` | |
| `BeautyHairApp - RAG: Carregar Conteudo` (inativo) | BeHair | `[PRD]BeHair-RAGCarregarConteudo` | setup único |
| `[PRD]SiteNPI-Validação Comprovante PIX` | WTower (legado) | arquivar | substituído pelo fluxo novo abaixo |
| `C6 Bank - Pix Conciliação` (inativo) | WTower? | `[PRD]WTower-ConciliacaoPixC6` ou arquivar | decidir |
| `[PRD]LinkedInPost`, `[PRD]LinkedInInsights` | SiteNPI? | `[PRD]SiteNPI-LinkedInPost` / `-LinkedInInsights` | conteúdo do próprio Nelson; confirmar |
| `[PROD]AjudanteTelegran`, `AgenteIASite`, `LeitorPlanilhasCB`, `TranscreverPDFSite` (inativos) | ? | classificar ou arquivar | |
| `[AulasHA]*` (inativos) | fora dos 3 projetos | manter | prefixo próprio |

**Watchtower não tem nenhum workflow hoje.** Faltam (a criar com o prefixo novo): `[PRD]WTower-NotificarPagamento`
(receptor do webhook de pagamento do `watchtower-api`, payload `PaymentWebhookPayload`) e
`[PRD]WTower-AlertaHealthCamera` (receptor do alerta de health, `HealthAlertWebhookPayload`). Sem eles, a API
envia para uma URL vazia e a aprovação de pagamento fica só manual no painel.

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
