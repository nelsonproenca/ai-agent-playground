# nelson-proenca-info (portal-web)

Site institucional de Nelson Proença (`nelson-proenca-info.com.br`) — apresentação profissional, vitrine de clientes/parceiros e CRM interno (leads, colaboradores, clientes, agendamentos).

**Repo GitHub:** `nelsonproenca/ai-agent-playground` (nome do repo não mudou; só a pasta local foi
renomeada — ver `CLAUDE.md` na raiz do workspace pra estrutura completa).

## Stack

- React 18 + TypeScript + Vite
- shadcn-ui (Radix) + Tailwind CSS
- React Router (`react-router-dom`)
- TanStack Query
- Supabase: Auth, Postgres, Storage, Edge Functions (`supabase/functions/*`, `supabase/migrations/*`)

Projeto originado no Lovable — pode ser editado localmente ou pela plataforma, ambos sincronizam com o mesmo repositório Git.

## Estrutura de páginas

- **Público**: `/` (Index/landing), `/landing`, `/contato`, `/claw3d`, `/colabs`, `/clientes` (vitrine de logos de empresas parceiras — **não confundir** com o CRM de clientes), `/projetos` (vitrine pública de portfólio, fala com o `portal-backend`)
- **Admin** (autenticado via `/login`, hook `useAuth`): `/admin`, `/admin/leads`, `/admin/colaboradores`, `/admin/clientes` (CRM — "Gestão de Clientes"), `/admin/agendamentos`, `/admin/projetos`
- **Watchtower** (`/watchtower/*`, pasta `src/watchtower/`): **legado** — o Watchtower já foi extraído
  pra repositório e domínio próprios (`saas/watchtower/watchtower-web`, servido em
  `watchtower.nelson-proenca-info.com.br`). O código aqui dentro não recebe mais features novas (a
  cópia daqui ficou parada em 13/09); só existe ainda porque as rotas `/watchtower/*` continuam
  registradas no `App.tsx` deste app. Não usar como referência — qualquer mudança no Watchtower vai
  em `saas/watchtower/`, não aqui. Pendência de limpeza: remover `src/watchtower/` e as rotas daqui
  quando o standalone estiver 100% assumido em produção.

## Dados

Tabela `clientes` (Supabase) já tem `email`, `nome`, `empresa`, `logo_url`, `segmento`, `site_url`, `status` — é a fonte de verdade dos clientes/parceiros, usada tanto no CRM admin quanto na vitrine pública.

## Deploy

**Use `bash deploy.sh front` (ou `all`) na raiz do workspace** — não o script `npm run deploy` deste
`package.json` (desatualizado, aponta pra path/VPS antigos, não é mais usado). O `deploy.sh` builda
este repo (`institucional/portal-web`) e envia pro path `/opt/watchtower-stack/site` na VPS.

**VPS atual: `191.252.220.204`** (migrada de volta de `209.61.37.142` em 13-14/09/2026 — ver
`CLAUDE.md` na raiz do workspace pro histórico completo da migração). O VPS roda Docker + Caddy na
frente de tudo (site, n8n, portal-api, watchtower-api, claw3d, openclaw) — não mais nginx direto.

## Agent skills

### Issue tracker

Issues e specs deste repositório vivem como GitHub Issues em `nelsonproenca/ai-agent-playground`, via CLI `gh`. Ver `docs/agents/issue-tracker.md`.

### Domain docs

Layout single-context — `CONTEXT.md` + `docs/adr/` na raiz do repo, criados sob demanda pela skill `/domain-modeling`. Ver `docs/agents/domain.md`.
