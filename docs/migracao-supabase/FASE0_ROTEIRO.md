# Fase 0: roteiro para salvar os dados do Supabase

Passo a passo da Fase 0 do [PLANO.md](PLANO.md). O objetivo é sair com **uma pasta de backup conferida** (6 tabelas
em JSON e CSV, schema real e imagens) **compactada com senha**, e o projeto **pausado de novo**.

**Quanto tempo:** de 20 a 40 minutos, quase todo esperando a restauração (o script espera por você).
**Quando:** o quanto antes. Projeto pausado só pode ser restaurado dentro de um prazo, e o painel mostra esse prazo.

## Onde cada coisa roda

| Símbolo | Lugar | O que é |
|---|---|---|
| 🖥️ **LOCAL** | seu computador | **Git Bash**, dentro da pasta `institucional/portal-web` |
| 🌐 **SITE** | navegador | painel do Supabase (`supabase.com/dashboard`) |
| 🛰️ **VPS** | PuTTY (root@191.252.220.204) | **nenhum passo da Fase 0 roda na VPS.** O backup também **não** deve ir para lá |

> A VPS só entra mais tarde (Fase 5, deploy). Aqui ela é propositalmente deixada de fora: os dados são de
> terceiros e a VPS não é lugar de backup.

## Visão geral

| # | Onde | O quê | Quanto |
|---|---|---|---|
| 0 | 🖥️ LOCAL | Preparar a pasta de backup e checar as ferramentas | 2 min |
| 1 | 🌐 SITE | Restaurar o projeto e anotar o prazo | 2 min + espera |
| 2 | 🖥️ LOCAL | `--wait`: o script espera a restauração terminar sozinho | espera |
| 3 | 🖥️ LOCAL | `all`: exporta tudo e já confere (um comando) | 2 a 10 min |
| 4 | 🌐 SITE | Comparar as contagens com o painel e abrir amostras | 5 min |
| 5 | 🖥️ LOCAL | `pack`: compactar com senha e copiar para um segundo lugar | 2 min |
| 6 | 🌐 SITE | Pausar o projeto de novo | 1 min |
| 7 | 🖥️ LOCAL | Gerar o resumo (sem dados pessoais) para me enviar | 1 min |

## Colinha (todos os comandos, na ordem)

Tudo em 🖥️ **LOCAL**, no Git Bash, dentro de `institucional/portal-web`:

```bash
# 0. preparar (cria a pasta e confere ferramentas e .env; não imprime a chave)
mkdir -p /e/Backups/supabase-2026-10-02
for c in curl sha256sum 7z; do command -v $c >/dev/null && echo "ok: $c" || echo "FALTA: $c"; done
test -s .env && grep -q '^VITE_SUPABASE_URL=' .env && echo "ok: .env com a URL do Supabase"

# 2. (depois de clicar em Restore no painel) esperar o projeto responder
bash scripts/export-supabase.sh --wait

# 3. exportar tudo: tabelas JSON e CSV, schema, imagens e conferência automática
bash scripts/export-supabase.sh /e/Backups/supabase-2026-10-02 all

# 5. compactar com senha (ele pede a senha; guarde-a no seu gerenciador de senhas)
bash scripts/export-supabase.sh /e/Backups/supabase-2026-10-02 pack

# 7. resumo para me enviar (só contagens e nomes de tabelas, sem dados pessoais)
grep -E '^(tabela|uploads|schema)' /e/Backups/supabase-2026-10-02/MANIFESTO.txt
cat /e/Backups/supabase-2026-10-02/schema/tabelas.txt
```

Para reconferir uma exportação a qualquer momento: `bash scripts/export-supabase.sh <pasta> verify`.

## Passo a passo

### 0. 🖥️ LOCAL: preparar
Rode o bloco "0. preparar" da colinha. Se aparecer `FALTA: 7z`, instale o 7-Zip (7-zip.org) ou deixe: o `pack` usa
`zip` como alternativa. A pasta de backup tem e-mails e telefones de terceiros: o script **recusa** gravar dentro
de qualquer repositório git, e você deve guardá-la **fora da VPS**.

### 1. 🌐 SITE: restaurar o projeto
1. Entre em `supabase.com/dashboard` e abra o projeto (referência `nsdektdgohfqfioonosc`).
2. Clique em **Restore project**. **Anote o prazo de restauração** que o painel mostrar.
3. Não precisa esperar olhando a tela: vá para o passo 2.

> **Atenção:** com o projeto ativo, as policies públicas das tabelas voltam a valer e qualquer pessoa com a chave
> do site consegue ler e alterar o CRM. Por isso o plano é exportar logo e pausar de novo (passo 6).

### 2. 🖥️ LOCAL: esperar a restauração
```bash
bash scripts/export-supabase.sh --wait
```
Ele consulta o projeto a cada 15 segundos (até 20 minutos) e termina com `OK: projeto respondendo`. Hoje o endereço
do projeto pausado nem resolve no DNS; é normal enquanto restaura.

### 3. 🖥️ LOCAL: exportar e conferir
```bash
bash scripts/export-supabase.sh /e/Backups/supabase-2026-10-02 all
```
O que ele faz, em ordem:
- **Tabelas** (`colaboradores`, `contatos_clientes`, `leads_ia`, `agendamentos`, `enrich_company`,
  `playground_analise`) em **JSON** (`tables/`) e em **CSV** (`csv/`), paginado e conferido contra o total que o
  servidor informa. O CSV substitui as 6 exportações manuais pelo painel.
- **Schema real** (`schema/openapi.json`, colunas e tipos) e a **lista de tabelas expostas** (`schema/tabelas.txt`),
  com **aviso** para qualquer tabela que o plano não conheça (pode ser dado de CRM).
- **Imagens** do bucket `uploads` (`clientes/`, `colaboradores/`, `convites/` e a raiz), com checksums.
- **Conferência automática** (`verify`) no fim: contagem servidor = arquivo por tabela, checksums das imagens,
  presença do schema e CSVs, e um **VEREDITO**. Se não for "exportação conferida", **não pause o projeto**.

### 4. 🌐 SITE: comparar com o painel (o que só o painel sabe)
| Conferência | Onde olhar | Esperado |
|---|---|---|
| Linhas por tabela | **Table Editor**, número de linhas de cada uma das 6 tabelas | igual ao que o `all` imprimiu (`servidor = arquivo`) |
| Tabelas fora do plano | os avisos `NÃO MAPEADA` do passo 3 | nenhum, ou tabelas que você reconhece como descartáveis (Watchtower antigo) |
| Imagens | **Storage → uploads**, quantidade de arquivos por pasta | soma igual ao `N arquivos` do `all` |
| Amostra | abra 2 ou 3 imagens e 1 arquivo de `tables/` e de `csv/` | abrem e têm conteúdo legível |

Se uma tabela falhou com 401/403 ou ficou diferente, use o botão **Export data → CSV** do Table Editor só para ela.

### 5. 🖥️ LOCAL: compactar com senha e copiar
```bash
bash scripts/export-supabase.sh /e/Backups/supabase-2026-10-02 pack
```
Gera `supabase-2026-10-02.7z` (ou `.zip`) criptografado, ao lado da pasta. Depois **copie o arquivo compactado** para um
segundo lugar seu (disco externo ou Drive pessoal) e **guarde a senha** no gerenciador de senhas. **Não** envie para a
VPS nem para o GitHub. Mantenha a pasta descompactada: as Fases 1 e 2 importam a partir dela.

### 6. 🌐 SITE: pausar de novo
Só depois de o `VEREDITO` estar verde **e** o passo 4 conferido: **Project Settings → General → Pause project**.
Isso fecha a exposição das tabelas.

### 7. 🖥️ LOCAL: resumo para me enviar
Rode as duas últimas linhas da colinha e cole aqui o resultado (só contagens e nomes de tabelas), junto com o
**prazo de restauração** que o painel mostrou. Com isso eu valido os tipos reais contra o MAPEAMENTO e começo a
Fase 1. Se preferir, diga o caminho da pasta e eu leio **só** o schema e o manifesto, sem abrir os dados.

## Opcional: dump completo do Postgres (cópia extra)
- 🌐 **SITE:** em **Project Settings → Database**, copie a *connection string* (tem a senha do banco; reset se perdeu).
- 🖥️ **LOCAL** (só se tiver o cliente do Postgres instalado, `pg_dump`):
  ```bash
  pg_dump "<connection-string>" --no-owner --no-privileges -Fc -f /e/Backups/supabase-2026-10-02/banco.dump
  ```
Nunca cole a connection string no chat nem em arquivo de repositório. É dispensável se o `all` passou no
`verify`: o JSON e o CSV cobrem as 6 tabelas.

## Se algo der errado

| Sintoma | Onde | Causa provável | O que fazer |
|---|---|---|---|
| `Could not resolve host` | 🖥️ | projeto ainda restaurando ou pausado | rode `--wait`; confira o status no painel |
| `falha lendo a tabela X` (401/403) | 🖥️ | a policy pública de leitura dessa tabela não existe | 🌐 exporte só essa tabela em CSV pelo Table Editor |
| `servidor diz N linhas, mas o arquivo tem M` | 🖥️ | tabela sem coluna `id` ou resposta cortada | use o CSV (`csv/`) dessa tabela e me avise |
| `tabela NÃO MAPEADA` | 🖥️ | existe uma tabela que o plano não previa | me diga o nome antes de pausar o projeto |
| `algum checksum falhou` | 🖥️ | download corrompido | rode `... storage` de novo e depois `verify` |
| `a pasta de saída está dentro de um repositório git` | 🖥️ | pasta escolhida dentro de um repo | escolha uma pasta fora de qualquer repo (ex.: `/e/Backups/...`) |
| `nem 7-Zip nem zip encontrados` | 🖥️ | ferramenta ausente | instale o 7-Zip e rode `pack` de novo |

## Checklist de aceite

- [ ] 🌐 Projeto restaurado; prazo de restauração anotado
- [ ] 🖥️ `all` terminou com **VEREDITO: exportação conferida**
- [ ] 🌐 Contagens do painel (6 tabelas) e do Storage iguais às do `all`
- [ ] 🌐 Nenhuma tabela `NÃO MAPEADA` pendente
- [ ] 🖥️ Arquivo `.7z`/`.zip` com senha criado e copiado para um segundo lugar (fora da VPS)
- [ ] 🌐 Projeto pausado de novo
- [ ] 🖥️ Resumo (contagens, lista de tabelas) e prazo de restauração enviados
