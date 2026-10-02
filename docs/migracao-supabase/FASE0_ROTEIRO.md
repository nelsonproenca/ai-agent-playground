# Fase 0: salvar os dados do Supabase (tudo em um lugar)

Este é o **único documento** que você precisa para executar a Fase 0 do [PLANO.md](PLANO.md). Ele junta o motivo,
os links, os cliques, os comandos, os erros prováveis e o que me enviar. Tudo o que não está aqui está fora desta fase.

## 1. O que é e por que agora

O projeto Supabase do site institucional está **pausado**. Nele estão o CRM (leads, colaboradores, agendamentos,
contatos, enriquecimento, playground) e as imagens (logos, fotos, convites). Antes de migrar o portal para MySQL é
preciso **tirar uma cópia conferida** desses dados. Projeto pausado só pode ser restaurado dentro de um **prazo**,
então esta é a fase com risco de perda: **quanto antes, melhor**.

O que é salvo: **6 tabelas** (`colaboradores`, `contatos_clientes`, `leads_ia`, `agendamentos`, `enrich_company`,
`playground_analise`) em JSON e CSV, o **schema real** (colunas e tipos) e **todas as imagens** do bucket `uploads`.
O que **não** é salvo, de propósito: as tabelas do Watchtower antigo (`profiles`, `cameras`, `subscriptions`,
`plans`, etc.; o Watchtower já tem banco novo e não tem usuários reais) e as que já foram para o MySQL do portal
(`clientes`, `projetos`, `etapas`, `artefatos`, `pedidos`, `pedido_respostas`).

**Tempo:** de 20 a 40 minutos, quase todo esperando a restauração (o script espera por você).

## 2. Onde cada coisa roda

| Símbolo | Lugar | O que é |
|---|---|---|
| 🖥️ **LOCAL** | seu computador | **Git Bash**, dentro de `institucional/portal-web` |
| 🌐 **SITE** | navegador | painel do Supabase |
| 🛰️ **VPS** | PuTTY | **nenhum passo da Fase 0 roda na VPS**, e o backup também **não** vai para lá (são dados de terceiros) |

**Links diretos** (projeto `nsdektdgohfqfioonosc`):
- Projeto: `https://supabase.com/dashboard/project/nsdektdgohfqfioonosc`
- Lista dos seus projetos: `https://supabase.com/dashboard/projects`
- Table Editor: `https://supabase.com/dashboard/project/nsdektdgohfqfioonosc/editor`
- Storage (bucket uploads): `https://supabase.com/dashboard/project/nsdektdgohfqfioonosc/storage/buckets/uploads`
- Configurações gerais (pausar): `https://supabase.com/dashboard/project/nsdektdgohfqfioonosc/settings/general`

## 3. Já conferido por mim (você não precisa refazer)

- 🖥️ Na sua máquina existem `curl`, `sha256sum` e `7z`, e o `.env` do `portal-web` tem a URL e a chave pública do
  Supabase. O script usa só essa chave pública (não precisa de senha do banco) e **nunca a imprime**.
- O script foi testado com um servidor simulado: espera, paginação, CSV, tabela vazia, nome de arquivo com espaço
  e acento, imagem adulterada, arquivo criptografado e as guardas. A única coisa que **não** foi testada é a chamada
  ao Supabase real, que só funciona depois da restauração.
- O endereço do projeto pausado **nem resolve no DNS** hoje. Isso é esperado enquanto ele estiver pausado.

## 4. Passo a passo

### Passo 0. 🖥️ LOCAL: preparar a pasta (1 minuto)
No Git Bash, dentro de `institucional/portal-web`:
```bash
mkdir -p /e/Backups/supabase-2026-10-02
```
Essa pasta fica **fora de qualquer repositório e fora da VPS**; o script recusa gravar dentro de um repo git.

### Passo 1. 🌐 SITE: restaurar o projeto e anotar o prazo
1. Abra `https://supabase.com/dashboard/project/nsdektdgohfqfioonosc`. Entre com a conta que criou o projeto.
2. A tela mostra o projeto **pausado**, com uma mensagem de quando foi pausado e um botão **Restore project**.
   **Anote a data limite** que aparecer (é o "prazo de restauração" que eu preciso).
3. Clique em **Restore project** e confirme. A restauração leva alguns minutos; **não precisa ficar olhando**, vá
   para o passo 2.

**Se a tela for outra:**
| O que aparece | O que significa | O que fazer |
|---|---|---|
| "Project not found" / o projeto não está na sua lista | o projeto está em **outra conta** ou foi criado pelo **Lovable** | tente outra conta/e-mail; se foi o Lovable, abra o projeto no Lovable e procure a aba/área do Supabase (Cloud) dali. Me diga o que viu |
| O botão **Restore project** está desabilitado ou pede upgrade | o plano gratuito permite poucos projetos **ativos** ao mesmo tempo | em `https://supabase.com/dashboard/projects`, pause outro projeto que você não use e tente de novo |
| Só aparece **Download backup** (sem Restore) | o prazo de restauração já passou | **baixe o backup primeiro**, antes de qualquer outra coisa, guarde em `/e/Backups/supabase-2026-10-02/` e me avise: o plano muda |
| Pede senha, 2FA ou confirmação de e-mail | login da conta | faça o login normal; eu não preciso desses dados |

### Passo 2. 🖥️ LOCAL: esperar a restauração terminar (automático)
```bash
bash scripts/export-supabase.sh --wait
```
Ele consulta o projeto a cada 15 segundos, por até 20 minutos, e termina com `OK: projeto respondendo`. Se estourar
os 20 minutos, veja o status no painel e rode de novo.

### Passo 3. 🖥️ LOCAL: exportar e conferir (um comando)
```bash
bash scripts/export-supabase.sh /e/Backups/supabase-2026-10-02 all
```
Ele faz, em ordem: as 6 tabelas em JSON e em CSV (paginado, conferido contra o total do servidor), o schema e a
**lista de tabelas expostas** (com **aviso** para qualquer tabela que o plano não conheça), todas as imagens do
bucket com checksum, e uma **conferência automática** no fim. Procure a última linha importante:
- `VEREDITO: exportação conferida` → pode seguir.
- `VEREDITO: há pendências` ou qualquer `AVISO` → **não pause o projeto**; me mande a saída.

### Passo 3b. 🌐 SITE: schema e inventário do Storage pelo SQL Editor (obrigatório)
O Supabase só entrega o schema (OpenAPI) para a chave `service_role`, então com a chave pública o `all` sempre
avisa `schema INDISPONÍVEL`. O caminho é o **SQL Editor** do painel: `https://supabase.com/dashboard/project/nsdektdgohfqfioonosc/sql/new`.
Cole **uma consulta por vez** e clique em **Run**. São só leituras (`select`).

**Q1. Colunas das 6 tabelas do CRM** (é o schema real). Atenção: o SQL Editor **corta qualquer resultado em 100
linhas**, e uma Q1 sobre todas as tabelas passa disso e some com as últimas (foi o que aconteceu na 1ª rodada: sumiram
`leads_ia` e `playground_analise`). Por isso ela é restrita às 6 tabelas (cerca de 50 linhas). Depois de rodar, use
**Download CSV** e salve como `/e/Backups/supabase-2026-10-02/schema/colunas.csv` (sobrescreva o anterior):
```sql
select table_name, ordinal_position as pos, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('agendamentos','colaboradores','contatos_clientes','enrich_company','leads_ia','playground_analise')
order by table_name, ordinal_position;
```

**Q2. Inventário do Storage** (todos os buckets, inclusive privados, que a chave pública não enxerga):
```sql
select b.id as bucket, b.public as publico,
       coalesce(nullif(split_part(o.name, '/', 1), o.name), '(raiz)') as pasta,
       count(o.id) as arquivos,
       coalesce(sum((o.metadata->>'size')::bigint), 0) as bytes
from storage.buckets b
left join storage.objects o on o.bucket_id = b.id
group by b.id, b.public, 3
order by b.id, 3;
```

**Q3. Policies (quem pode ler e escrever o quê hoje)**:
```sql
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;
```

**Q4. Contagem EXATA de linhas** das 6 tabelas e das demais (para achar dado fora das 6 e comparar com o MySQL).
A versão antiga desta consulta usava estimativas do Postgres (`pg_stat_user_tables`), que **zeram em projeto restaurado**
e davam 0 para tudo, até para `leads_ia`, que tem 5 linhas. Esta usa `count(*)`:
```sql
select 'agendamentos' as tabela, count(*) as linhas from public.agendamentos
union all select 'colaboradores', count(*) from public.colaboradores
union all select 'contatos_clientes', count(*) from public.contatos_clientes
union all select 'enrich_company', count(*) from public.enrich_company
union all select 'leads_ia', count(*) from public.leads_ia
union all select 'playground_analise', count(*) from public.playground_analise
union all select 'clientes', count(*) from public.clientes
union all select 'projetos', count(*) from public.projetos
union all select 'etapas', count(*) from public.etapas
union all select 'artefatos', count(*) from public.artefatos
union all select 'pedidos', count(*) from public.pedidos
union all select 'pedido_respostas', count(*) from public.pedido_respostas
union all select 'contact_messages', count(*) from public.contact_messages
union all select 'admin_audit_log', count(*) from public.admin_audit_log
union all select 'profiles', count(*) from public.profiles
union all select 'subscriptions', count(*) from public.subscriptions
union all select 'user_access', count(*) from public.user_access
union all select 'payments', count(*) from public.payments
union all select 'pending_payments', count(*) from public.pending_payments
union all select 'cameras', count(*) from public.cameras
order by 1;
```

Cole aqui os resultados de **Q2, Q3 e Q4** (só nomes e contagens; nenhum dado pessoal). Com o Q1 salvo em
`schema/colunas.csv`, o `verify` aceita o schema. O que cada uma responde:
- **Q2:** se existem imagens em outros buckets (por exemplo `portfolio-privado`) que o `all` não exporta. Se existirem,
  eu preparo a exportação delas.
- **Q4:** a contagem exata de cada tabela: confirma as 6 e mostra se há dado de CRM fora delas (e se as tabelas já migradas para o MySQL ainda têm linhas aqui).

### Passo 4. 🌐 SITE: comparar com o painel (só o painel sabe)
| Conferência | Onde | Esperado |
|---|---|---|
| Linhas por tabela | `.../editor`: abra cada uma das 6 tabelas e veja o total de registros | igual ao que o passo 3 imprimiu (`servidor = arquivo`) |
| Imagens | `.../storage/buckets/uploads`: abra as pastas `clientes`, `colaboradores`, `convites` e a raiz e conte | soma igual ao `N arquivos` do passo 3 |
| Tabelas fora do plano | os avisos `NÃO MAPEADA` do passo 3 | nenhum, ou só as que você reconhece como descartáveis |
| Amostra | abra 2 ou 3 imagens e 1 arquivo de `tables/` e de `csv/` | abrem e têm conteúdo legível |

Se uma tabela falhou com 401/403 ou ficou diferente, exporte **só ela** pelo botão **Export data → CSV** do Table Editor.

### Passo 5. 🖥️ LOCAL: compactar com senha e copiar (2 minutos)
```bash
bash scripts/export-supabase.sh /e/Backups/supabase-2026-10-02 pack
```
Ele pede uma **senha** (use o gerenciador de senhas) e gera `supabase-2026-10-02.7z` ao lado da pasta. **Copie esse
arquivo para um segundo lugar seu** (disco externo ou Drive pessoal). Mantenha também a pasta descompactada: as
Fases 1 e 2 importam a partir dela. **Nunca** na VPS nem no GitHub.

### Passo 6. 🌐 SITE: pausar de novo
**Só quando** o passo 3 deu `VEREDITO: exportação conferida` **e** o passo 4 bateu. Abra
`.../settings/general` e use **Pause project**. Isso fecha a exposição do CRM. Com o projeto ativo, as policies
públicas das tabelas valem de novo: qualquer pessoa com a chave que está no site consegue ler e alterar leads,
contatos e agendamentos. Por isso a janela com o projeto ativo deve ser curta.

### Passo 7. 🖥️ LOCAL: o resumo para me enviar (só contagens, sem dados pessoais)
```bash
grep -E '^(tabela|uploads|schema)' /e/Backups/supabase-2026-10-02/MANIFESTO.txt
cat /e/Backups/supabase-2026-10-02/schema/tabelas.txt
```
Cole aqui a saída desses dois comandos **e a data limite de restauração** do passo 1. Com isso eu valido os tipos
reais contra o mapeamento e começo a Fase 1. Se preferir, só me diga o caminho da pasta: eu leio **apenas** o
schema e o manifesto, sem abrir os arquivos de dados.

## 4b. Resultado da primeira exportação (02/10/2026)

Rodada real no seu backup `/e/Backups/supabase-2026-10-02/`:

| Item | Resultado |
|---|---|
| Tabelas (servidor = arquivo, JSON e CSV) | `colaboradores` 3, `contatos_clientes` 0, `leads_ia` 5, `agendamentos` 5, `enrich_company` 2, `playground_analise` 0 |
| Colunas das 4 tabelas com dados | conferem com o dicionário de dados |
| Imagens | **1 arquivo** (`convites/convite-nelson-proenca.png`, PNG 1024×1024, 43 KB, checksum ok); `clientes/` e `colaboradores/` estão vazias |
| `colaboradores.foto_url` | os 3 apontam para `images.unsplash.com` (externo), sem dependência do Storage |
| Schema | **pendente**: a chave pública não acessa o OpenAPI (ver Passo 3b) |

O primeiro `all` mostrou "0 arquivos" por um **bug do script** (a listagem real traz um bloco `metadata` aninhado que o
leitor não aceitava). Foi corrigido, testado com o formato real e o arquivo foi baixado. O `verify` também passou a
validar o **conteúdo** do schema, não só o tamanho do arquivo.

## 5. Atalhos úteis (todos 🖥️ LOCAL)

| Comando | Para quê |
|---|---|
| `bash scripts/export-supabase.sh <pasta> verify` | reconferir uma exportação a qualquer momento |
| `bash scripts/export-supabase.sh <pasta> tables` / `csv` / `schema` / `storage` | refazer só uma parte |
| `PAGE_SIZE=200 bash scripts/export-supabase.sh <pasta> all` | páginas menores, se a conexão for ruim |

Dump completo do Postgres (opcional; o `all` com veredito verde já cobre as 6 tabelas): 🌐 em
`.../settings/database` copie a *connection string* (tem a senha do banco), e 🖥️ `pg_dump "<connection-string>"
--no-owner --no-privileges -Fc -f /e/Backups/supabase-2026-10-02/banco.dump`. **Nunca** cole essa string no chat.

## 6. Se algo der errado

| Sintoma | Onde | Causa provável | O que fazer |
|---|---|---|---|
| `Could not resolve host` | 🖥️ | projeto ainda restaurando ou pausado | rode `--wait`; confira o status no painel |
| `falha lendo a tabela X` (401/403) | 🖥️ | a tabela não tem leitura pública | 🌐 exporte essa tabela em CSV pelo Table Editor |
| `servidor diz N linhas, mas o arquivo tem M` | 🖥️ | tabela sem coluna `id` ou resposta cortada | use o `csv/` dessa tabela e me avise |
| `tabela NÃO MAPEADA: X` | 🖥️ | existe uma tabela que o plano não previa | me diga o nome **antes** de pausar o projeto |
| `algum checksum falhou` | 🖥️ | download corrompido | `... storage` de novo e depois `verify` |
| `a pasta de saída está dentro de um repositório git` | 🖥️ | pasta dentro de um repo | use uma pasta fora dos repos (`/e/Backups/...`) |
| `nem 7-Zip nem zip encontrados` | 🖥️ | ferramenta ausente | instale o 7-Zip e rode `pack` de novo |

## 7. Como eu ajudo em cada passo

Você não precisa interpretar nada sozinho. Em qualquer passo, **me mande um print da tela** (painel) ou **a saída do
comando** (terminal) e eu digo o próximo clique ou comando. No passo 1 em especial, mande o print da tela do projeto
assim que abrir o link: é lá que aparece o prazo e o botão certo.

## 8. Checklist de aceite

- [ ] 🌐 Projeto restaurado e **prazo de restauração anotado**
- [ ] 🖥️ `all` terminou com `VEREDITO: exportação conferida` (depois do Passo 3b: `schema/colunas.csv` salvo)
- [ ] 🌐 Consultas Q2, Q3 e Q4 do Passo 3b rodadas e coladas para mim
- [ ] 🌐 Linhas das 6 tabelas e arquivos do Storage iguais às do `all`
- [ ] 🌐 Nenhuma tabela `NÃO MAPEADA` pendente
- [ ] 🖥️ `.7z` com senha criado e copiado para um segundo lugar (fora da VPS)
- [ ] 🌐 Projeto pausado de novo
- [ ] 🖥️ Saída do passo 7 e o prazo enviados para mim
