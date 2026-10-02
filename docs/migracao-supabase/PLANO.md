# Plano em fases: Watchtower ↔ n8n e saída do Supabase (portal-web + portal-api + n8n)

Criado em 01/10/2026, **refeito em 02/10/2026** com a validação dos workflows do n8n, e **reorganizado em fases
para validação** (com testes do n8n do Watchtower). Inventário em [MAPEAMENTO.md](MAPEAMENTO.md); convenção de nomes
do n8n em `.claude/rules/n8n-workflows.md`.

**Roteiro operacional da Fase 0:** [FASE0_ROTEIRO.md](FASE0_ROTEIRO.md) (script `scripts/export-supabase.sh`).

**Escopo (decisão de 02/10/2026):** só contam os workflows de `SiteNPI`, `WTower` e `BeHair`. O resto era teste e
é ignorado.

## Visão geral

| Fase | O quê | Depende de | Risco em produção |
|---|---|---|---|
| **A** | Watchtower ↔ n8n: testar e ativar os 2 fluxos `WTower`, ligar a API, teste de ponta a ponta | nada (já criados, inativos) | baixo (só envia Telegram) |
| **B** | Watchtower: agendador do health check e dedup do alerta (achados novos) | A | médio (mexe na API em produção) |
| **0** | Portal: restaurar o Supabase e exportar tudo | nada (urgente: prazo de restauração) | nenhum |
| **1** | `portal-api`: tabelas do CRM, endpoints e ponte com o n8n | 0 | baixo (não deployado até a Fase 5) |
| **2** | `portal-api`: login do cliente e uploads | 1 | baixo |
| **3** | `portal-web`: trocar Supabase pela API | 1, 2 | baixo |
| **4** | n8n do site: corrigir os 4 fluxos e tirar o Supabase | 1 | médio (fluxos de IA em produção) |
| **5** | Deploy do portal, importação e smoke test | 0–4 | médio |
| **6** | Limpeza e encerramento do Supabase | 5 + 1 semana estável | alto se feito cedo |

As fases **A** e **0** são independentes e podem andar em paralelo; `B` só depois de `A`.

## Decisões a validar (recomendação em negrito)

1. **Login do cliente:** **magic link de uso único (hash, 15 min), sessão por cookie httpOnly com papel `cliente`**
   (igual ao admin) ou código de 6 dígitos?
2. **Imagens públicas:** **endpoint público de leitura no `portal-api`**, ou Caddy direto do volume?
3. **Dados históricos:** **importar** ou começar vazio?
4. **Health check do Watchtower:** **agendador dentro do `watchtower-api`** (`BackgroundService` usando o
   `check_interval_minutes` que já existe) ou um workflow n8n chamando `/api/health-check/run` com uma chave de
   serviço dedicada?
5. **Alerta de health:** **um aviso por incidente** (na transição para offline, mais "voltou" ao se recuperar) em
   vez de repetir a cada verificação?

---

## Fase A: Watchtower ↔ n8n (testar, ativar e ligar)

Estado: `[PRD]WTower-NotificarPagamento` (`wHEGtQZA90DrN0M2`, webhook `/webhook/wtower-pagamento`) e
`[PRD]WTower-AlertaHealthCamera` (`c8CvoUXg6SbLqGux`, `/webhook/wtower-health-alerta`) criados, **inativos**,
conexões verificadas. Ambos exigem o header `X-Webhook-Secret` (credencial `Watchtower Webhook Secret`) e avisam
no Telegram do Nelson.

### A1. Teste isolado no n8n (envia 2 a 4 mensagens de teste no seu Telegram; precisa do seu OK)

Feito por `test_workflow` do MCP ou pelo editor do n8n, com dados falsos. Casos e resultado esperado:

| # | Fluxo | Entrada | Esperado |
|---|---|---|---|
| T1 | pagamento | payload normal (nome, CPF de 11 dígitos, plano, URL do comprovante com `&`) | HTTP 200 `{"ok":true}`; 1 mensagem com **CPF mascarado** (`***.***.***-NN`), nome, plano e os 2 links |
| T2 | pagamento | nome `<b>x</b> & Cia` e e-mail com `<`/`&` | mensagem **não quebra** e mostra o texto literal (escape de HTML); o link do comprovante preserva os `&` |
| T3 | pagamento | corpo sem campos (`{}`) | 200 e mensagem com campos vazios, sem erro de execução |
| T4 | pagamento | **sem** o header de segredo | rejeitado (401/403), **nenhuma** mensagem, nenhuma execução de sucesso |
| T5 | pagamento | header **errado** | rejeitado, nenhuma mensagem |
| T6 | health | payload normal (câmera, 3 falhas, erro, `checkedAt` UTC) | 200; mensagem com a hora em **America/Sao_Paulo** (`dd/MM/yyyy HH:mm`) e link do painel |
| T7 | health | `lastError` com 500 caracteres e `<script>` | erro truncado em 300, sem quebrar o HTML |
| T8 | health | sem `checkedAt` | mensagem com "agora" |
| T9 | health | sem header / header errado | rejeitado, sem mensagem |

Verificação: 1 execução `success` por caso aceito em `search_workflow_executions`; nenhuma execução para os casos
rejeitados (T4, T5, T9). O caminho de falha do Telegram (resposta 502) é conferido só pela fiação
(`main[1]` → `Responder 502`) para não depender de derrubar o bot.

### A2. Ativar

`publish` dos dois fluxos (só depois de A1 verde). As URLs de produção passam a responder.

### A3. Ligar a API (VPS)

Sem imprimir segredo, pelo padrão do `scripts/vps-prepare.sh`:
1. Novo subcomando `set-n8n` no script: grava `N8n__WebhookUrl=https://n8n.nelson-proenca-info.com.br/webhook/wtower-pagamento`
   e `N8n__WebhookSecret` (lido da entrada, sem eco) no `watchtower.env`.
2. `docker compose up -d --force-recreate` no `watchtower-api` (o `env_file` só é lido na subida).
3. No painel admin, em Configurações de health: URL do webhook =
   `https://n8n.nelson-proenca-info.com.br/webhook/wtower-health-alerta`.
4. O valor de `N8n__WebhookSecret` precisa ser igual ao da credencial do n8n (a mesma dos dois webhooks).

### A4. Teste de ponta a ponta

| # | Cenário | Esperado |
|---|---|---|
| E1 | Conta de teste envia um comprovante pelo site | em poucos segundos chega o Telegram com o **link do comprovante abrindo** o arquivo e o link do painel; o pagamento aparece em `/dashboard/admin/payments` |
| E2 | Admin aprova o pagamento | `user_access` fica `Active` e o cliente passa a ver as câmeras |
| E3 | **n8n fora do ar / URL errada** (temporário) | o comprovante **continua sendo gravado** e o cliente recebe a confirmação; o log da API mostra o aviso de falha do webhook (o envio é fire-and-forget) |
| E4 | Segredo diferente entre API e n8n (temporário) | n8n rejeita; comprovante gravado; aviso no log; **nenhuma** mensagem |
| E5 | Câmera de teste com URL HLS inválida + URL de health configurada; rodar o health check repetidas vezes (`/api/health-check/run` pelo painel) até atingir `NotifyAfterFailures` | **1 Telegram** de câmera sem sinal com o nome, o slug e a hora corretos |
| E6 | Continuar rodando o health check com a câmera ainda offline | **achado do código atual:** o alerta é reenviado a cada verificação (sem dedup). Registrar o resultado; a correção é a Fase B |
| E7 | Remover a câmera de teste e a URL de teste | volta ao estado inicial |

**Critério de aceite da Fase A:** T1–T9 e E1–E5 passando, com E6 documentado. Rollback: despublicar os dois fluxos e
limpar `N8n__WebhookUrl` (a API volta a ignorar o webhook).

---

## Fase B: Watchtower, agendador e dedup do health check (achados novos)

Descobertos ao preparar a Fase A:
- **Não existe agendador do health check.** Não há `BackgroundService` nem chamada externa; só o `/run`, que
  hoje exige admin. Sem alguém clicando, **nenhum alerta automático acontece**, e o fluxo `AlertaHealthCamera`
  nunca dispara sozinho.
- **O alerta repete a cada verificação** enquanto as últimas N leituras forem offline (a condição continua
  verdadeira), ou seja, 1 mensagem a cada ciclo.

Entregas (conforme as decisões 4 e 5):
1. `BackgroundService` no `watchtower-api` que executa o `RunHealthCheckHandler` a cada
   `check_interval_minutes` (padrão 5), com proteção contra execuções sobrepostas e log.
2. Dedup: alertar **na transição** para offline (a N-ésima falha seguida) e opcionalmente avisar "voltou ao ar";
   guardar o estado do último alerta por câmera (coluna ou tabela nova + migration).
3. Testes xUnit do handler (EF InMemory): não alerta antes de N falhas; alerta uma vez ao atingir N; não repete
   nas seguintes; volta a alertar após recuperar e cair de novo.
4. Re-rodar E5–E6 depois do deploy: 1 aviso por incidente.

**Aceite:** com uma câmera de teste fora, chega 1 Telegram por incidente sem ninguém abrir o painel. Reversível
desligando o serviço por configuração.

---

## Fase 0: Portal, salvar o que existe (antes de tudo)

1. **Restaurar o projeto no Supabase** (projetos pausados têm prazo de restauração; conferir no dashboard).
2. Exportar as 6 tabelas (`colaboradores`, `contatos_clientes`, `leads_ia`, `agendamentos`, `enrich_company`,
   `playground_analise`), o bucket `uploads` completo (`clientes/`, `colaboradores/`, `convites/`) e o schema real
   (`information_schema.columns`) para validar os tipos do MAPEAMENTO.
3. Guardar o backup fora do VPS e fora do repo (tem e-mail e telefone de terceiros).
4. Com o projeto ativo, **fechar as policies públicas** ou pausar de novo logo após exportar.

**Aceite:** contagem de linhas por tabela anotada, arquivos do bucket baixados, schema salvo, backup conferido.

## Fase 1: `portal-api`, dados do CRM e ponte com o n8n

1. Entidades e configurations das 6 tabelas e **uma migration**; `contatos_clientes` com FK real para `clientes`
   (`ON DELETE CASCADE`). Ids `Guid`, preservando os do Supabase.
2. Endpoints em `/api/portal/...`: **públicos com rate limit e limite de tamanho** (`POST /leads`, `/enrich`,
   `/playground`; `GET /enrich/{id}`, `/playground/{id}`, `/colaboradores`, `/convites`); **admin** (CRUD de
   colaboradores e contatos; leitura e marcação de leads; agendamentos; lead → contato); **n8n** com
   `X-Webhook-Secret` (`PATCH /leads/{id}/analise`, `/playground/{id}/resultado`, `/enrich/{id}/resultado`,
   `POST /agendamentos`).
3. **Cliente do n8n** (`INotificadorN8n`): dispara os webhooks do contrato abaixo, com timeout curto e sem
   propagar falha.
4. Importadores únicos lendo os arquivos da Fase 0, preservando ids e `created_at`.
5. Testes xUnit (EF InMemory) dos handlers e do cliente do n8n, no padrão do `watchtower-api`.

**Aceite:** build com 0 avisos e testes verdes; endpoints públicos limitados; admin só com cookie.

### Contrato `portal-api` ↔ n8n (substitui o Database Webhook do Supabase)

O front chama **só o `portal-api`**; o `portal-api` grava e dispara o webhook do n8n do servidor (`X-Webhook-Secret`,
corpo simples, sem envelope `record`); o n8n responde por **callback HTTP** no `portal-api`; o front faz polling
no `portal-api`.

| Webhook novo (n8n) | Disparado por | Corpo | Callback |
|---|---|---|---|
| `/webhook/sitenpi-leads` (`[PRD]SiteNPI-AddLeads`) | `POST /leads` | `{id, nome, empresa, contato, canal, desafioTecnico}` | `PATCH /leads/{id}/analise` |
| `/webhook/sitenpi-playground` (`[PRD]SiteNPI-AddChallenger`) | `POST /playground` | `{id, tipoAnalise, inputTecnico}` | `PATCH /playground/{id}/resultado` |
| `/webhook/sitenpi-enriquecer-empresa` (`[PRD]SiteNPI-SearchCompany`) | `POST /enrich` | `{id, nomeEmpresa, segmento}` | `PATCH /enrich/{id}/resultado` |
| `/webhook/atendimento_instagram` (`[PRD]SiteNPI-AutomatedServiceInstagram`) | Meta | payload da Meta | `POST /agendamentos` |

Os paths antigos (`leads-site`, `analise-tecnica`, `enriquecer-empresa`) ficam até o corte. O webhook da Meta deve
**validar `X-Hub-Signature-256`**.

## Fase 2: `portal-api`, login do cliente e uploads

1. **Login do cliente:** `cliente_login_tokens` (hash, e-mail, expiração, uso único); `POST /auth/cliente/solicitar`
   (rate limit, resposta igual exista o e-mail ou não), `GET /auth/cliente/verificar?token=` (consome e emite o
   cookie com papel `cliente`), `POST /auth/cliente/logout`; e-mail pelo `IEmailService` (Resend).
2. `AdminOrClient` usa só o esquema de cookie; **remover o esquema `SupabaseJwt`** e a exigência de `Supabase:Url`
   no startup. `GET /clientes/me` lê o e-mail do cookie.
3. **Uploads:** `POST /uploads/{pasta}` (admin; tipo e tamanho validados, máx. 2 MB, nome gerado pelo servidor),
   `DELETE /uploads/...` (admin), `GET /uploads/{pasta}/{arquivo}` público; volume Docker; pastas `clientes`,
   `colaboradores`, `convites`; reescrever `logo_url`/`foto_url` no import.

**Aceite:** testes de token (uso único, expiração, resposta genérica) e de upload (tipo, tamanho, path traversal).

## Fase 3: `portal-web`

Trocar cada chamada ao Supabase por funções em `src/features/<dominio>/api.ts`: `GestaoClientes`, `GestaoColabs`,
`GestaoLeads`, `LeadEnricher`, `LeadForm`, `TechPlayground`, `pages/{Colabs,DashboardAgendamentos,GeradorConvites,
LandingPage}`, `ImageUpload`, `useClientAuth`, `portal-shared/apiClient`, `portfolio/api`. **`LeadEnricher` e
`TechPlayground` deixam de chamar o n8n** (inclusive a URL `webhook-test`). Remover `src/integrations/supabase/`,
`supabase/`, `@supabase/supabase-js` e `VITE_SUPABASE_*`. **Desconectar a sincronização do Lovable** antes de
começar.

**Aceite:** `npm run lint`, `npm test`, `npm run build` verdes; nenhuma ocorrência de `supabase` em `src/`.

## Fase 4: n8n do site (corrigir e desligar o Supabase)

1. **Corrigir e migrar os 4 fluxos** (contrato acima): webhook com header auth e path novo; leitura do corpo sem
   envelope; `AddLeads` (typo `Contacto`), `AddChallenger` (filtro `LeadID`×`AnaliseID` **e** prompt),
   `SearchCompany` (ler o `id`, gravar na tabela certa); trocar "Update a row" por HTTP Request ao callback;
   `AutomatedServiceInstagram`: "Create a row" → `POST /agendamentos`, validar assinatura da Meta, corrigir as
   expressões `json.xxx`, **mover o Bearer da Meta para credencial e rotacionar**.
2. Credencial de header (`X-Webhook-Secret`) igual ao segredo do `portal-api`.
3. **Testes do n8n do site** (dados de teste, antes de ativar): para cada fluxo, (a) sem header → rejeitado;
   (b) payload válido → callback chega e o registro no `portal-api` é atualizado; (c) polling do front devolve o
   resultado; (d) falha do callback → registro fica com status de erro e o front mostra timeout amigável.
4. Remover os nodes Supabase e só então apagar a credencial `Supabase account 2`.

**Aceite:** os 4 fluxos sem nenhum node Supabase, testes (a)–(d) verdes, token da Meta rotacionado.

## Fase 5: Deploy do portal e validação

1. `.env` do `portal-api` na VPS (segredo e URLs do n8n, base URL do link do e-mail, volume de uploads; sem
   `Supabase__*`), segredos gerados na VPS e sem imprimir.
2. `bash deploy.sh portal back` e `bash deploy.sh portal front`; rodar os importadores; conferir contagens.
3. **Smoke test:** login admin; CRUD de colaboradores e contatos; formulário de lead com a análise chegando;
   enrich e playground com polling; agendamento pelo fluxo do Instagram; landing de convites; vitrine `/clientes`;
   login do cliente por e-mail e `GET /clientes/me`; upload e remoção de imagem.

**Aceite:** todos os itens do smoke test passando; contagens iguais às da Fase 0.

## Fase 6: Limpeza e encerramento do Supabase

- `portal-api`: apagar `ImportClientesCommand`, `ImportProjetosCommand`, config `Supabase:*` e comentários.
- Workspace: `CLAUDE.md`, `.claude/rules/*`, `.claude/settings.local.json`, `documentacao/01-Dicionario_de_Dados.md`
  e `02-Inventario_de_Fluxos_n8n.md` (por projeto).
- Encerrar o Supabase só com: backup confirmado, dados validados, **os workflows de `SiteNPI`/`WTower`/`BeHair` sem
  nenhum node Supabase** e uma semana de produção estável.
- Rotacionar token da Meta e a chave anon do Supabase (já no histórico do git e no bundle).

## Riscos

1. **Prazo de restauração do Supabase** (Fase 0 primeiro).
2. **Schema real diferente do documentado** (validar com `information_schema`).
3. **Login do cliente é a peça sensível** (token curto e de uso único, só o hash, rate limit, resposta genérica,
   cookie `HttpOnly`/`Secure`/`SameSite`, CSRF).
4. **Endpoints públicos que acionam IA:** rate limit e limite de tamanho (custo e abuso).
5. **Alerta de health sem dedup e sem agendador** (Fase B) pode gerar spam ou silêncio.
6. **Mensagens de teste no Telegram** dos testes A1/A4: avisar antes de rodar.
7. **Lovable reintroduzindo o Supabase** se a sincronização continuar ligada.
8. **Fluxos do site quebrados antes da pausa:** não há comportamento anterior para comparar; definir o resultado
   correto na Fase 4 e testar com dado de teste.

---

## Resultado da Fase A1/A2 (02/10/2026)

Decisões 1 a 5 aceitas (todas as recomendações). Testes isolados executados com `test_workflow` (gatilho e node
do Telegram fixados, então **nenhuma mensagem real foi enviada**; os nodes Set rodaram de verdade):

| # | Resultado |
|---|---|
| T1 | passou: CPF `***.***.***-01`, link com `&` escapado, caminho até `Responder 200` |
| T2 | **achou falha e foi corrigida**: o link do comprovante não escapava `<` e `>`; agora escapa. Reteste passou (nome, e-mail e link com HTML saem literais) |
| T3 | passou: corpo vazio não gera erro (campos vazios, CPF `***.***.***-`) |
| T4, T5 | passaram: sem header e com header errado, o webhook real responde **403** e não cria execução |
| T6 | passou: `12:00Z` virou `02/10/2026 09:00` (São Paulo) |
| T7 | passou: erro de 500 caracteres cortado em 300, `<script>` escapado |
| T8 | passou: sem `checkedAt` mostra "agora" |
| T9 | passou: 403 sem header ou com header errado; `GET` retorna 404; nenhuma execução criada |

Os dois fluxos foram **publicados (ativos)**: sem o segredo nada dispara. Ainda **não** foi verificado o texto final
da mensagem no Telegram (o node estava fixado): isso fica para E1 e E5, com a API ligada (Fase A3).

## Resultado da Fase A3 (02/10/2026): API ligada ao n8n

- Segredo novo definido nos dois lados (credencial `Watchtower Webhook Secret` do n8n e `watchtower.env`), e
  `N8n__WebhookUrl` gravado; container `watchtower-api` recriado com `scripts/vps-prepare.sh set-n8n`.
- `scripts/vps-prepare.sh test-n8n` (pagamento de teste) → **HTTP 200** e mensagem no Telegram.
- Achados do caminho: (1) o primeiro `test-n8n` deu 403 porque o valor colado era diferente do da credencial
  (o n8n não mostra o valor salvo; foi preciso definir um novo); (2) depois deu 502 com `chat not found` até o
  `/start` no bot `AtividadesSiteNPIBot`. O 502 era o caminho de erro funcionando como projetado.
- **Falta da Fase A3:** configurar no painel admin (tela de health) a URL
  `https://n8n.nelson-proenca-info.com.br/webhook/wtower-health-alerta`. Depois: E1 a E7 (ponta a ponta).

## Resultado de E1–E6 e da Fase B (02/10/2026)

| Teste | Resultado |
|---|---|
| E1, E2 | passaram: comprovante real → Telegram com link → aprovação → acesso ativo (conferido no banco). Ajustes feitos no caminho: comprovante abre em modal; slot vazio mostra "Plano ativo" quando há acesso |
| E5 | passou: câmera de teste offline gerou o alerta no Telegram; seletor de dono passou a mostrar nome e e-mail |
| E6 | **confirmou o achado**: 4 mensagens idênticas para a mesma queda (13:37 e três às 13:49), uma por verificação |
| E3 | não executado (n8n fora do ar não pode travar o cliente) |

Achados e correções além do plano:
- **Cadastro de câmera dava 500**: `SyncStreamsAsync` escrevia `/opt/go2rtc/streams.yaml` (arquivo do host) depois de gravar a câmera; agora a falha vira aviso (commit `4f2a2a9`). Câmeras **Bridge** não sincronizam o go2rtc a partir do container.
- **Caddy em duas redes** derrubou o site com 502 (UFW); corrigido com `ufw allow` do IP do Caddy (ver CLAUDE.md).
- Pendências de UI vistas nas capturas: URL do stream com token (`jwt=`) aparece na mensagem de erro do player;
  o cartão mostra "AO VIVO" para câmera offline (vem do cadastro, não da saúde); o resumo do Health Check pode
  mostrar "0 offline" com câmera offline.

**Fase B implementada (commit `a5d18ae`), falta o deploy:** `HealthAlertRules` (um aviso na N-ésima falha e um na
recuperação, derivados do histórico, sem estado novo), `HealthCheckBackgroundService` (verificação automática a
cada `check_interval_minutes`, 1 a 60 min, sequencial; desliga com `HealthCheck__Enabled=false`) e campo `event`
(`down`/`up`) no webhook. 36 testes xUnit; o teste do handler falha no código antigo com os mesmos 4 avisos do E6.
O fluxo `[PRD]WTower-AlertaHealthCamera` já foi atualizado e publicado (monta a mensagem no node Set; sem `event`
assume `down`, então é compatível com a API antiga).

Para validar depois do deploy (E5/E6 refeitos): com a câmera de teste offline, **1 aviso** na 2ª falha (agora
automático, sem clicar), **nenhum** nas seguintes, e **1 "voltou ao ar"** ao corrigir a URL ou remover o bloqueio.

## Fechamento das Fases A e B (02/10/2026)

**Fase A concluída** (T1–T9, E1, E2, E5, E6; E3 não executado). **Fase B concluída e validada em produção:**
com a câmera de teste, o n8n recebeu **exatamente 2 alertas reais** depois do deploy, a recuperação ("✅ voltou ao
ar", 14:26) e a nova queda ("🚨 sem sinal", 14:36), com 10 minutos entre eles (2 rodadas de 5 min) e **nenhum a
mais**; antes, com a câmera offline de forma contínua, o agendador rodou sem gerar aviso novo. Também corrigidos no
front: status em minúsculas (contadores e cores), token fora da mensagem de erro do player, selo "AO VIVO" fiel ao
vídeo, seletor de dono por nome/e-mail e comprovante em modal.

**Próxima frente:** Fase 0 do portal (restaurar o Supabase e exportar os dados), que não depende de nada e tem
prazo de restauração.
