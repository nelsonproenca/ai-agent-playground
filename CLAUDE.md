# nelson-proenca-info

Site institucional de Nelson Proença (`nelson-proenca-info.com.br`) — apresentação profissional, vitrine de clientes/parceiros, CRM interno (leads, colaboradores, clientes, agendamentos) e uma loja simples.

## Stack

- React 18 + TypeScript + Vite
- shadcn-ui (Radix) + Tailwind CSS
- React Router (`react-router-dom`)
- TanStack Query
- Supabase: Auth, Postgres, Storage, Edge Functions (`supabase/functions/*`, `supabase/migrations/*`)

Projeto originado no Lovable — pode ser editado localmente ou pela plataforma, ambos sincronizam com o mesmo repositório Git.

## Estrutura de páginas

- **Público**: `/` (Index/landing), `/landing`, `/contato`, `/loja`, `/claw3d`, `/colabs`, `/clientes` (vitrine de logos de empresas parceiras — **não confundir** com o CRM de clientes)
- **Admin** (autenticado via `/login`, hook `useAuth`): `/admin`, `/admin/leads`, `/admin/colaboradores`, `/admin/clientes` (CRM — "Gestão de Clientes"), `/admin/agendamentos`, `/admin/produtos`
- **Watchtower** (`/watchtower/*`): produto SaaS de monitoramento de câmeras hospedado no mesmo repositório e mesmo VPS por conveniência de deploy, mas é um **produto distinto** em processo de separação em projeto próprio. Não usar os padrões do Watchtower (rotas, auth, services) como referência para novas features do site institucional.

## Dados

Tabela `clientes` (Supabase) já tem `email`, `nome`, `empresa`, `logo_url`, `segmento`, `site_url`, `status` — é a fonte de verdade dos clientes/parceiros, usada tanto no CRM admin quanto na vitrine pública.

## Deploy

`npm run deploy` → `tsc -b && vite build && scp -r ./dist/* root@<vps>:/var/www/meu-site/`

O VPS roda nginx na frente de tudo (site, n8n, e os serviços do Watchtower). Mudanças em nginx/infra do servidor não fazem parte deste repositório.

## Agent skills

### Issue tracker

Issues e specs deste repositório vivem como GitHub Issues em `nelsonproenca/ai-agent-playground`, via CLI `gh`. Ver `docs/agents/issue-tracker.md`.

### Domain docs

Layout single-context — `CONTEXT.md` + `docs/adr/` na raiz do repo, criados sob demanda pela skill `/domain-modeling`. Ver `docs/agents/domain.md`.
