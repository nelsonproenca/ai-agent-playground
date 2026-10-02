# Fase 0: roteiro para salvar os dados do Supabase

Passo a passo da Fase 0 do [PLANO.md](PLANO.md). O objetivo é sair com **uma pasta de backup conferida** (6 tabelas,
schema real e imagens) e o projeto **pausado de novo**. O script `scripts/export-supabase.sh` faz a parte
mecânica; você faz os cliques no painel e a conferência.

**Quanto tempo:** de 20 a 40 minutos, quase todo esperando a restauração.
**Quando:** o quanto antes. Projeto pausado só pode ser restaurado dentro de um prazo, e o painel mostra esse prazo
na tela do projeto; confira antes de qualquer outra coisa.

## 0. Antes de começar

1. Escolha uma pasta de backup **fora de qualquer repositório e fora da VPS**, por exemplo
   `E:\Backups\supabase-2026-10-02\`. Ela terá e-mails e telefones de terceiros (leads, contatos, agendamentos).
2. Tenha à mão: o Git Bash, `curl` e `sha256sum` (já vêm com o Git for Windows) e o login do painel do Supabase.
3. O script lê a chave **pública** do `.env` do `portal-web` (`VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`).
   Não precisa de senha do banco nem de service role, e nunca imprime a chave.

## 1. Restaurar o projeto

1. Entre em `supabase.com/dashboard` e abra o projeto (referência `nsdektdgohfqfioonosc`).
2. Clique em **Restore project** (ou "Restore" no aviso de projeto pausado). Anote o prazo de restauração que o
   painel mostrar.
3. Espere o status ficar **Healthy/Active** (alguns minutos). O endereço `...supabase.co` só volta a resolver
   depois disso: hoje ele nem existe no DNS.

> **Atenção:** com o projeto ativo, as policies públicas das tabelas voltam a valer e qualquer pessoa com a chave
> do site consegue ler e alterar o CRM. Por isso o plano é **exportar logo e pausar de novo** (passo 6).

## 2. Exportar (um comando)

No Git Bash, na pasta do `portal-web`:

```bash
bash scripts/export-supabase.sh /e/Backups/supabase-2026-10-02 all
```

O que ele faz:
- **Tabelas** (`colaboradores`, `contatos_clientes`, `leads_ia`, `agendamentos`, `enrich_company`,
  `playground_analise`): um `.json` por tabela em `tables/`, paginado e conferido contra o total que o servidor
  informa.
- **Schema:** `schema/openapi.json`, com as colunas e tipos reais de todas as tabelas expostas (serve para
  corrigir o dicionário de dados, que está desatualizado).
- **Imagens:** todos os arquivos do bucket `uploads` (`clientes/`, `colaboradores/`, `convites/` e a raiz) em
  `uploads/`, mais `uploads.sha256` com o checksum de cada um.
- **MANIFESTO.txt:** contagens do servidor e do arquivo, por tabela, e o total de imagens.

Se ele parar com erro, a mensagem diz o motivo. Os mais prováveis:
- `Could not resolve host`: o projeto ainda não terminou de restaurar.
- `falha lendo a tabela X` com 401/403/permissão: a policy de leitura pública dessa tabela não existe. Use o
  **plano B** do passo 3 para essa tabela.
- `servidor diz N linhas, mas o arquivo tem M`: confira a tabela (pode não ter a coluna `id`); use o plano B.

## 3. Plano B e cópia extra (recomendado mesmo se o passo 2 deu certo)

No painel, **Table Editor**, para cada uma das 6 tabelas: menu **⋯ → Export data → CSV**, e guarde na mesma pasta
de backup (`csv/`). É uma segunda cópia em formato diferente e cobre a tabela que o script não conseguir ler.

Opcional (dump completo do Postgres): em **Project Settings → Database**, copie a *connection string*; se tiver o
cliente do Postgres instalado:

```bash
pg_dump "<connection-string>" --no-owner --no-privileges -Fc -f /e/Backups/supabase-2026-10-02/banco.dump
```

Nunca cole a connection string (tem a senha do banco) no chat nem em arquivo do repositório.

## 4. Conferir (é o que dá valor ao backup)

| # | Conferência | Como | Esperado |
|---|---|---|---|
| 1 | Contagem por tabela | Compare o `MANIFESTO.txt` com o número de linhas mostrado no **Table Editor** | iguais (`servidor` = `arquivo` = painel) |
| 2 | Tabelas que o script não conhece | Liste os nomes em `schema/openapi.json` (campo `definitions`) e compare com o Table Editor | só aparecem as tabelas esperadas; qualquer tabela de **CRM** fora das 6 deve ser avisada |
| 3 | Imagens | **Storage → uploads**: conte os arquivos por pasta e compare com `uploads/` | mesma quantidade |
| 4 | Abrir amostras | Abra 2 ou 3 imagens e 1 ou 2 arquivos `.json` | abrem e têm conteúdo legível |
| 5 | Checksums | `cd uploads && sha256sum -c ../uploads.sha256` | todas `OK` |
| 6 | Pasta fora dos repos | `git -C /e/Backups/supabase-2026-10-02 status` | "not a git repository" |

## 5. Guardar

1. Compacte a pasta com **senha** (7-Zip ou similar) e guarde uma segunda cópia em outro lugar seu (disco externo
   ou Drive pessoal). **Não** na VPS e **não** no GitHub.
2. Mantenha a pasta descompactada à mão: as Fases 1 e 2 importam a partir dela.

## 6. Pausar de novo

Só depois de **todas** as conferências do passo 4: **Project Settings → General → Pause project**. Isso fecha a
exposição das tabelas. Se preferir deixá-lo ativo por algum motivo, rode antes o SQL que remove as policies
públicas (peça e eu preparo).

## 7. O que me enviar para fechar a fase

Sem dados pessoais: (a) o **conteúdo do `MANIFESTO.txt`** (só contagens); (b) a **lista de tabelas** do
`schema/openapi.json`; (c) a **data limite de restauração** que o painel mostrou. Com isso eu valido os tipos
reais das colunas contra o MAPEAMENTO e começo a Fase 1 com o schema certo. Se preferir, diga o caminho da pasta
e eu leio **só** o schema e o manifesto (não abro os `.json` de dados).

## Checklist de aceite

- [ ] Projeto restaurado e exportação sem erro
- [ ] Contagens do `MANIFESTO.txt` = painel (6 tabelas)
- [ ] Imagens: mesma quantidade do painel e checksums `OK`
- [ ] CSVs do Table Editor guardados (cópia extra)
- [ ] Backup fora dos repos e fora da VPS, com cópia compactada e protegida
- [ ] Projeto pausado de novo
- [ ] Manifesto, lista de tabelas e prazo de restauração enviados
