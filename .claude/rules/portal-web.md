# Regras do portal-web (site institucional)

Vale para tudo dentro de `institucional/portal-web` (repo GitHub `nelsonproenca/ai-agent-playground`).
Contexto geral e deploy estão no `CLAUDE.md` desta pasta e no da raiz do workspace.

## Escopo

- Este projeto é só o **site institucional + CRM interno** de Nelson Proença. Watchtower e BeautyHairApp
  **não vivem aqui**: qualquer mudança neles vai em `saas/watchtower/` ou `saas/beautyhairapp/`.
- Não recriar `src/watchtower/` nem rotas `/watchtower/*` (removidos no commit `23dc038`).
- Textos, `<title>`, meta tags, favicon e `og:image` são da marca **NPI / Nelson Proença**, nunca de um
  produto (já houve um bug do site institucional se anunciando como "Watchtower").
- `/clientes` (vitrine pública de logos) e `/admin/clientes` (CRM) são coisas diferentes; ambos leem a
  tabela `clientes` do Supabase. Não unificar nem renomear sem pedido.

## Dados e integrações

- **Este projeto ainda depende do Supabase** (Auth, Postgres, Storage e Edge Functions em `supabase/`), mas o
  projeto Supabase está **pausado**: login, CRM e vitrine `/clientes` estão fora do ar até reativar ou migrar
  (pendência no `CLAUDE.md` da raiz). Não adicionar chamadas novas ao Supabase.
- Cliente do Supabase: `src/integrations/supabase/client.ts`. `types.ts` é **gerado**, não editar à mão.
- Chamadas ao `portal-backend` (portfólio `/projetos`, portal do cliente) passam por
  `src/features/portal-shared/apiClient.ts`; dados de cada domínio ficam em `src/features/<dominio>/api.ts`.
  Não usar `fetch` solto dentro de páginas ou componentes.
- Mudança de schema = nova migration em `supabase/migrations/` (nunca editar uma já aplicada).
- `.env` guarda só chaves públicas (anon/publishable). Nunca colocar service role, tokens ou senhas em
  `VITE_*` (vão para o bundle) nem commitar segredos. Ao diagnosticar, não imprimir o conteúdo de `.env`.

## Código

- Imports pelo alias `@/` (`@/components/...`, `@/features/...`), não caminhos relativos longos.
- `src/components/ui/` é shadcn gerado: não editar à mão nem criar componente ali; para adicionar,
  usar o CLI do shadcn (`components.json`). Componentes próprios ficam em `src/components/` (por área:
  `admin/`, `dashboard/`).
- Estado de servidor com TanStack Query (chave de query estável e específica); estado local com
  `useState`. Não adicionar outra lib de estado ou de requisição sem alinhar.
- Páginas em `src/pages/` com sufixo `Page` para as novas rotas (`ProjetosPage`); a rota é registrada em
  `src/App.tsx`. Rotas admin ficam atrás do guard de auth existente (`useAuth`).
- Estilo: Tailwind + tokens do tema (`index.css`/`tailwind.config.ts`); sem CSS inline nem cores
  hardcoded quando existir token. Layout deve funcionar em mobile (grid responsivo, sem scroll horizontal).
- TypeScript está com `strict: false`: código novo deve ser tipado de verdade mesmo assim, evitar `any`,
  e não ligar `strict` ou afrouxar o lint em massa dentro de uma mudança de feature.
- Textos de interface em **pt-BR** com acentuação correta; identificadores novos seguem o padrão do
  arquivo vizinho (hoje misturam português de domínio e inglês técnico).

## Qualidade

- Antes de dar algo como pronto: `npm run lint`, `npm test` e `npm run build` passando. Testes com
  Vitest, ao lado do código (`*.test.ts[x]`, ex.: `src/features/portfolio/api.test.ts`).
- Lógica de `features/*/api.ts` e regras de negócio ganham teste; JSX puramente visual não precisa.
- Não commitar `dist/`, `*.tsbuildinfo` nem alterar lockfiles (`package-lock.json`, `bun.lock*`) sem
  mudar dependência de verdade.
- Não deixar `console.log` de depuração no código entregue.

## Deploy e Git

- Deploy **só** por `bash deploy.sh front` (ou `all`) na raiz do workspace. O script `npm run deploy` do
  `package.json` está obsoleto (aponta para VPS/paths antigos): não usar.
- Commits em português, no padrão do histórico: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, mensagem
  curta explicando o porquê. Um assunto por commit.
- Deploy, push e qualquer ação no VPS (`191.252.220.204`) só com o pedido explícito do Nelson.
