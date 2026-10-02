# Plano: tirar o site institucional do Supabase (portal-web + portal-api + n8n)

Criado em 01/10/2026 e **refeito em 02/10/2026** depois de validar os workflows do n8n. Mesma direção da
migração do Watchtower: **MySQL do `portal-api`, auth próprio, storage em disco, e-mail por Resend**. O
inventário completo (tabelas, colunas, quem usa, RLS, fluxos do n8n) está em [MAPEAMENTO.md](MAPEAMENTO.md).
A convenção de nomes do n8n está em `.claude/rules/n8n-workflows.md` (workspace).

## Situação e premissas

- O projeto Supabase está **pausado**: login do cliente, CRM (leads, colaboradores, agendamentos, contatos),
  vitrine `/clientes`, landing de convites e os formulários do site que gravam lá estão **fora do ar**. Não há
  um corte "sem parada" a proteger; a migração é restaurar o serviço.
- O `portal-api` **já** tem MySQL, login de admin por cookie (`admin_users`), Resend, storage em disco e as
  entidades `clientes`, `projetos`, `etapas`, `artefatos`, `pedidos`, `pedido_respostas`. Falta o resto do CRM,
  o login do cliente, os uploads públicos e a ponte com o n8n.
- Seis tabelas restantes: `colaboradores`, `contatos_clientes`, `leads_ia`, `agendamentos`, `enrich_company`,
  `playground_analise`. O resto do Supabase (tabelas do Watchtower, Edge Functions) é descartado.
- **O n8n é parte do trabalho, não só uma troca de node.** Validado no n8n vivo: o Playground e o Enricher já
  estavam quebrados antes da pausa (payload, `LeadID`, tabela de destino e URL `webhook-test` no front), e os
  4 fluxos que gravam no Supabase têm webhooks sem autenticação. Detalhes no MAPEAMENTO (seção 7).
- Dados: ainda há valor (leads, agendamentos, contatos, imagens). A **Fase 0 vem antes de qualquer outra**.

## Decisões a tomar (recomendação em negrito)

1. **Login do cliente:** magic link ou código de 6 dígitos? → **magic link de uso único (hash, 15 min), sessão
   por cookie httpOnly com papel `cliente`**, igual ao admin.
2. **Imagens públicas:** Caddy direto do volume ou endpoint da API? → **endpoint público de leitura no
   `portal-api`**; upload e remoção só admin.
3. **Dados históricos:** importar ou começar vazio? → **importar**.
4. ~~**Workflow "Validação Comprovante PIX":**~~ **feito em 02/10/2026** (arquivado; receptor novo criado)
   (`[PRD]WTower-NotificarPagamento`).
5. **Workflows de outros contextos que estão com prefixo `SiteNPI`** (`AgentIA-FAQ` de e-commerce,
   `CadastroUsuariosSite` do site de astrologia, `Forms-SendEmail`): ficam em produção ou saem? → **decidir caso
   a caso**; o `AgentIA-FAQ` está quebrado (tool `produtos_dtc`) e o `CadastroUsuariosSite` reenvia senha em
   texto por e-mail.

## Contrato portal-api ↔ n8n (substitui o Database Webhook do Supabase)

Hoje: o front insere no Supabase e chama o n8n **do navegador**; o n8n escreve de volta direto no Supabase. Novo:

1. O front chama **só o `portal-api`** (nunca a URL do n8n).
2. O `portal-api` grava o registro e dispara o webhook do n8n **do servidor**, com `X-Webhook-Secret`, corpo
   **simples e sem envelope** (ex.: `{ "id": "...", "nomeEmpresa": "...", "segmento": "..." }`). Falha do n8n não
   derruba a requisição do usuário (log e segue).
3. O n8n responde ao produto por **HTTP Request ao endpoint de callback** do `portal-api` (mesmo segredo), por
   `id`, nunca por nó de banco.
4. O front faz polling no `portal-api` (`GET /.../{id}`), que devolve só o resultado.

| Fluxo (novo nome do path) | Disparado por | Corpo para o n8n | Callback do n8n |
|---|---|---|---|
| `/webhook/sitenpi-leads` (`[PRD]SiteNPI-AddLeads`) | `POST /leads` (form do site) | `{id, nome, empresa, contato, canal, desafioTecnico}` | `PATCH /leads/{id}/analise` `{analise}` |
| `/webhook/sitenpi-playground` (`[PRD]SiteNPI-AddChallenger`) | `POST /playground` | `{id, tipoAnalise, inputTecnico}` | `PATCH /playground/{id}/resultado` `{output}` |
| `/webhook/sitenpi-enriquecer-empresa` (`[PRD]SiteNPI-SearchCompany`) | `POST /enrich` | `{id, nomeEmpresa, segmento}` | `PATCH /enrich/{id}/resultado` `{output}` |
| `/webhook/atendimento_instagram` (`[PRD]SiteNPI-AutomatedServiceInstagram`) | Meta (não muda) | payload da Meta | `POST /agendamentos` |

Os paths antigos (`leads-site`, `analise-tecnica`, `enriquecer-empresa`) ficam ativos até o corte e depois saem.
O webhook da Meta continua público, mas **precisa validar a assinatura** (`X-Hub-Signature-256`) em vez de
aceitar qualquer POST.

## Fases

### Fase 0: Salvar o que existe (antes de tudo)

1. **Restaurar o projeto no Supabase** (projetos pausados têm prazo para restauração; conferir o prazo no
   dashboard).
2. Exportar as 6 tabelas (CSV pelo dashboard ou `pg_dump --data-only -t ...`), o bucket `uploads` completo
   (`clientes/`, `colaboradores/`, `convites/`) e o schema real (`information_schema.columns`) para validar os
   tipos do MAPEAMENTO.
3. Guardar o backup fora do VPS e fora do repo (tem e-mail e telefone de terceiros).
4. Com o projeto ativo, **fechar as policies públicas** das tabelas ou pausar de novo logo após exportar.
5. No n8n: `ChatCriarEventos` já foi verificado (sem Supabase); checar no
   editor `AgenteIASite` e `[AulasHA]AgentIA-CreateVector` (inativos, podem ter Vector Store).

### Fase 1: `portal-api`, dados do CRM e ponte com o n8n

Padrão do projeto (Clean Architecture, handlers registrados à mão, `Result<T>`).
1. Entidades e configurations das 6 tabelas e **uma migration**; `contatos_clientes` com FK real para `clientes`
   (`ON DELETE CASCADE`). Ids `Guid`, preservando os do Supabase.
2. Endpoints em `/api/portal/...`:
   - **Públicos com rate limit e limite de tamanho:** `POST /leads`, `POST /enrich`, `POST /playground`,
     `GET /enrich/{id}` e `GET /playground/{id}` (só `status` e resultado), `GET /colaboradores`,
     `GET /convites`.
   - **Admin (cookie + CSRF):** CRUD de `colaboradores` e `contatos_clientes`; leitura e marcação de `leads_ia`;
     leitura e edição de `agendamentos` (status, comissão); conversão lead → contato.
   - **n8n (header `X-Webhook-Secret`):** `PATCH /leads/{id}/analise`, `PATCH /playground/{id}/resultado`,
     `PATCH /enrich/{id}/resultado`, `POST /agendamentos`.
3. **Cliente do n8n** (`INotificadorN8n`): dispara os webhooks da tabela do contrato, com timeout curto e sem
   propagar falha. URLs e segredo em configuração (`N8n:*`), gerados/guardados só na VPS.
4. Importadores únicos (`dotnet run -- import-<tabela> <arquivo>`) lendo os CSV/JSON da Fase 0, preservando ids e
   `created_at`, no padrão do `ImportClientesCommand`, mas lendo de arquivo e não da API do Supabase.
5. Testes xUnit (EF InMemory) dos handlers e do cliente do n8n, no padrão do `watchtower-api`.

### Fase 2: `portal-api`, login do cliente e uploads

1. **Login do cliente:** tabela `cliente_login_tokens` (hash, e-mail, expiração, uso único);
   `POST /auth/cliente/solicitar` (rate limit; resposta igual exista o e-mail ou não; só envia se houver
   `clientes.email`), `GET /auth/cliente/verificar?token=` (consome e emite o cookie com papel `cliente`),
   `POST /auth/cliente/logout`. O e-mail sai pelo `IEmailService` (Resend) que já existe.
2. A policy `AdminOrClient` passa a usar **só** o esquema de cookie (admin ou cliente). **Remover o esquema
   `SupabaseJwt`** e a exigência de `Supabase:Url` no startup. `GET /clientes/me` lê o e-mail do cookie; a regra
   "cliente só vê o que é seu" continua dentro dos handlers.
3. **Uploads:** `POST /uploads/{pasta}` (admin; tipo e tamanho validados, máx. 2 MB, nome gerado pelo servidor),
   `DELETE /uploads/...` (admin) e `GET /uploads/{pasta}/{arquivo}` público. Volume Docker dedicado; pastas
   `clientes`, `colaboradores`, `convites`. Copiar os arquivos do bucket (Fase 0) e reescrever
   `logo_url`/`foto_url` no import.

### Fase 3: `portal-web`

Trocar cada chamada ao Supabase por funções em `src/features/<dominio>/api.ts` (cliente HTTP central, sem `fetch`
solto). Arquivos:
- Dados: `GestaoClientes`, `GestaoColabs`, `GestaoLeads`, `LeadEnricher`, `LeadForm`, `TechPlayground`,
  `pages/Colabs`, `pages/DashboardAgendamentos`, `pages/GeradorConvites`, `pages/LandingPage`.
- **`LeadEnricher` e `TechPlayground` deixam de chamar o n8n** (`fetch` para `n8n.nelson-proenca-info.com.br`,
  inclusive a URL `webhook-test`): chamam `POST /enrich` e `POST /playground` e fazem polling no `portal-api`.
- Storage: `ImageUpload`, `GeradorConvites`, `LandingPage`.
- Auth do cliente: `useClientAuth.tsx` (magic link pelo `portal-api`) e `portal-shared/apiClient.ts` (sem
  `supabase.auth.getSession`; passa a usar o cookie com `credentials: "include"`), mais `portfolio/api.ts` e
  `api.test.ts`.
- Remover: `src/integrations/supabase/`, a pasta `supabase/` (migrations e functions), `@supabase/supabase-js`,
  `VITE_SUPABASE_*` do `.env` e do `.env.example`.
- **Lovable:** o projeto nasceu no Lovable, que regenera `integrations/supabase` e `supabase/`. Desconectar a
  sincronização antes de começar.
Pronto = `npm run lint`, `npm test`, `npm run build`.

### Fase 4: n8n (corrigir, separar por projeto e desligar o Supabase)

**4.1 Corrigir e migrar os 4 fluxos** (contrato acima):
- `AddLeads`: webhook com header auth e path novo; ler o corpo sem envelope; corrigir o typo `Contacto`; trocar
  "Update a row" por HTTP Request `PATCH /leads/{id}/analise`; manter o aviso no Telegram.
- `AddChallenger`: corrigir o filtro (`LeadID` × `AnaliseID`) **e o prompt** (campos `TipoAnalise`/
  `InputTecnico`); callback `PATCH /playground/{id}/resultado`.
- `SearchCompany`: ler também o `id`; callback `PATCH /enrich/{id}/resultado` (hoje grava na tabela errada).
- `AutomatedServiceInstagram`: trocar "Create a row" por `POST /agendamentos`; **validar a assinatura da Meta**;
  revisar as expressões `json.xxx` (sem `$`) que provavelmente não resolvem; mover o **Bearer da Meta para
  credencial do n8n e rotacionar o token**.
- Credencial nova de header (`X-Webhook-Secret`) no n8n, igual ao segredo do `portal-api`.
- Testar cada fluxo com dado de teste antes de ativar (regra do n8n).

**4.2 Separar por projeto** (convenção `[PRD]<Projeto>-<Fluxo>`; tabela de renomes em MAPEAMENTO 7.3, só com o OK
do Nelson):
- `SiteNPI`: os 4 fluxos acima e os já prefixados; decidir os de outros contextos (decisão 5).
- `BeHair`: renomear `BeautyHairApp - Assistente Telegram` → `[PRD]BeHair-AssistenteTelegram` e
  `BeautyHairApp - RAG: Carregar Conteudo` → `[PRD]BeHair-RAGCarregarConteudo`.
- `WTower`: arquivar `Validação Comprovante PIX`; **criar** `[PRD]WTower-NotificarPagamento` (recebe o
  `PaymentWebhookPayload` do `watchtower-api`, avisa o Nelson e leva ao painel de aprovação) e
  `[PRD]WTower-AlertaHealthCamera` (`HealthAlertWebhookPayload`). Depois preencher `N8n__WebhookUrl` em
  `watchtower.env` na VPS.
- Classificar ou arquivar os inativos sem projeto (`[PROD]AjudanteTelegran`, `AgenteIASite`, `LeitorPlanilhasCB`,
  `TranscreverPDFSite`, `C6 Bank - Pix Conciliação`).
- Atualizar `documentacao/02-Inventario_de_Fluxos_n8n.md` (hoje lista só 4 fluxos) com o inventário por projeto.

**4.3 Segurança do que sobrou:** `CadastroUsuariosSite` reenvia a senha em texto e a guarda em planilha
(trocar por fluxo de definição de senha ou desativar); webhooks restantes sem autenticação passam a exigir header.

**4.4 Desligar o Supabase no n8n:** remover os nodes Supabase (inclusive a tool `produtos_dtc` do `AgentIA-FAQ`,
que já está quebrada) e só então apagar a credencial `Supabase account 2`.

### Fase 5: Deploy e validação (portal-api e portal-web)

1. `.env` do `portal-api` na VPS: segredo e URLs do n8n, base URL pública do link do e-mail, volume de uploads,
   remoção de `Supabase__*`. Segredos gerados na VPS, sem imprimir (padrão `scripts/vps-prepare.sh` do
   Watchtower).
2. `bash deploy.sh portal back` e `bash deploy.sh portal front`.
3. Rodar os importadores e conferir as contagens por tabela.
4. Smoke test: login admin; CRUD de colaboradores e contatos; formulário de lead com a análise chegando no
   Telegram e no painel; enrich e playground com polling; agendamento criado pelo fluxo do Instagram; landing de
   convites; vitrine `/clientes`; login do cliente por e-mail e `GET /clientes/me`; upload e remoção de imagem.
5. Sem usuários dependendo hoje, não há janela de manutenção a combinar.

### Fase 6: Limpeza

- `portal-api`: apagar `ImportClientesCommand`, `ImportProjetosCommand`, a config `Supabase:*` e os comentários
  que citam o Supabase.
- Workspace: `CLAUDE.md` (remover a pendência), `.claude/rules/*`, `.claude/settings.local.json` (permissões do
  CLI `supabase`), `documentacao/01-Dicionario_de_Dados.md` (reescrever para MySQL) e o inventário do n8n. Os PRDs
  de `.llm/` ficam como histórico.
- Encerrar de vez o projeto Supabase só depois de: backup confirmado, dados importados e validados, os workflows
  do n8n sem nenhum node Supabase (inclusive `ChatCriarEventos`) e uma semana de produção estável.
- Rotacionar o que passou por lugares inseguros: token Bearer da Meta (Instagram) e a chave anon do Supabase (já
  no histórico do git e no bundle).

## Ordem e dependências

`Fase 0` (salvar) → `1` e `2` (backend, andam juntas) → `3` (front, depende dos endpoints) → `4` (n8n; o 4.1
depende dos endpoints de callback e o 4.2 pode ser feito antes, independentemente) → `5` (deploy e importação) →
`6` (limpeza). A Fase 0 é urgente por causa do prazo de restauração; os renomes do 4.2 e a criação dos fluxos
`WTower` podem ser feitos já, sem esperar o resto.

## Riscos

1. **Prazo de restauração do projeto pausado:** perder = perder leads, agendamentos e imagens. Fase 0 primeiro.
2. **Schema real diferente do documentado:** o dicionário de dados está desatualizado. Validar com
   `information_schema` antes das migrations.
3. **Login do cliente é a peça sensível:** token de uso único e curto (só o hash no banco), rate limit, resposta
   genérica, cookie `HttpOnly`/`Secure`/`SameSite`, CSRF nas escritas.
4. **Endpoints públicos que acionam IA** (`leads`, `enrich`, `playground`): rate limit por IP e limite de tamanho;
   cada chamada vira um fluxo de IA no n8n (custo de Gemini/SerpAPI e canal de abuso).
5. **Webhooks do n8n sem autenticação hoje** (e o da Meta sem validar assinatura): resolvidos na Fase 4.
6. **Fluxos quebrados antes da migração:** o comportamento "esperado" não existe para comparar. Definir o
   resultado correto na Fase 4 e testar com dado de teste.
7. **Lovable reintroduzindo o Supabase** se a sincronização continuar ligada.
8. **Renomear workflows:** o path do webhook não muda com o nome, mas conferir referências por nome
   (sub-workflows como `Forms-SendEmail`, documentação) antes de renomear.
