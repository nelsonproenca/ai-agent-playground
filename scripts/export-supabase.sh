#!/usr/bin/env bash
# Exporta do Supabase (projeto restaurado) tudo que o portal precisa levar para o MySQL: as 6 tabelas do CRM
# (JSON e CSV), o schema real e as imagens do bucket "uploads". Fase 0 de docs/migracao-supabase/PLANO.md.
# RODA NA SUA MÁQUINA (Git Bash), nunca na VPS.
#
#   bash scripts/export-supabase.sh --wait                      # espera o projeto terminar de restaurar
#   bash scripts/export-supabase.sh <pasta> all                 # exporta tudo e já confere (verify)
#   bash scripts/export-supabase.sh <pasta> tables|csv|schema|storage   # só uma parte
#   bash scripts/export-supabase.sh <pasta> verify              # reconfere uma exportação existente
#   bash scripts/export-supabase.sh <pasta> pack                # compacta com senha (7-Zip/zip)
#
# - Usa a chave PÚBLICA (anon/publishable) de .env (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY): as tabelas
#   e o bucket têm policy pública de leitura, então não precisa de service role nem senha do banco. A chave nunca é
#   impressa.
# - A pasta de saída tem e-mail e telefone de terceiros: o script RECUSA gravar dentro de um repositório git.
# - Só lê (GET e list). Não altera nada no Supabase.

set -euo pipefail

CURL="${CURL:-curl}"            # sobrescrevível nos testes
PAGE_SIZE="${PAGE_SIZE:-1000}"
WAIT_MINUTES="${WAIT_MINUTES:-20}"
WAIT_INTERVAL="${WAIT_INTERVAL:-15}"
ENV_FILE="${ENV_FILE:-$(dirname "$0")/../.env}"
TABLES=(colaboradores contatos_clientes leads_ia agendamentos enrich_company playground_analise)
FOLDERS=(clientes colaboradores convites)   # pastas do bucket "uploads" (raiz tratada à parte)
# Tabelas que sabemos que existem no projeto e NÃO migram (Watchtower antigo e o que já foi para o MySQL).
KNOWN_OTHER=(clientes projetos etapas artefatos pedidos pedido_respostas profiles cameras subscriptions
  pending_payments contact_messages camera_health_logs camera_health_config plans user_roles plan_highlight_audit)

fail() { echo "ERRO: $*" >&2; exit 1; }
ok()   { echo "OK:   $*"; }
warn() { echo "AVISO: $*" >&2; }

MODE="run"; OUT=""; WHAT="all"; ARG3="${3:-}"
if [ "${1:-}" = "--wait" ]; then MODE="wait"; else OUT="${1:-}"; WHAT="${2:-all}"; fi

if [ "$MODE" = "run" ]; then
  [ -n "$OUT" ] || fail "uso: bash scripts/export-supabase.sh --wait | <pasta> [all|tables|csv|schema|storage|urls|verify|pack]"
  case "$WHAT" in all|tables|csv|schema|storage|urls|verify|pack) ;; *) fail "segundo argumento inválido: $WHAT" ;; esac
  mkdir -p "$OUT"
  if git -C "$OUT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    fail "a pasta de saída está dentro de um repositório git; escolha uma pasta FORA dos repos (os dados são de terceiros)"
  fi
fi

# Lê KEY=valor do .env sem imprimir.
env_value() { { grep -E "^$1=" "$ENV_FILE" || true; } | head -1 | cut -d= -f2- | tr -d '"\r'; }
test -s "$ENV_FILE" || fail "$ENV_FILE não existe ou está vazio"
URL=$(env_value VITE_SUPABASE_URL); KEY=$(env_value VITE_SUPABASE_PUBLISHABLE_KEY)
[ -n "$URL" ] && [ -n "$KEY" ] || fail "VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY ausentes em $ENV_FILE"
URL="${URL%/}"

HDR=$(mktemp); trap 'rm -f "$HDR"' EXIT
api() { "$CURL" -sS --max-time 90 -H "apikey: $KEY" -H "Authorization: Bearer $KEY" "$@"; }

urlencode() {  # codifica um caminho preservando "/" (nomes de arquivo podem ter espaço e acento)
  local s="$1" i c out=""
  LC_ALL=C
  for ((i = 0; i < ${#s}; i++)); do
    c="${s:i:1}"
    case "$c" in [a-zA-Z0-9._~/-]) out+="$c" ;; *) out+=$(printf '%%%02X' "'$c") ;; esac
  done
  printf '%s' "$out"
}

# ─── --wait: espera a restauração terminar ───────────────────────────────────

wait_for_project() {
  local deadline=$((SECONDS + WAIT_MINUTES * 60)) code
  echo "Aguardando o projeto responder (até ${WAIT_MINUTES} min, checando a cada ${WAIT_INTERVAL}s)..."
  while :; do
    code=$("$CURL" -s -o /dev/null -w '%{http_code}' --max-time 8 -H "apikey: $KEY" "$URL/rest/v1/" 2>/dev/null) || code=000
    case "$code" in
      2*|401|403) ok "projeto respondendo (HTTP $code). Pode exportar."; return 0 ;;
    esac
    [ "$SECONDS" -ge "$deadline" ] && fail "o projeto não respondeu em ${WAIT_MINUTES} min (último HTTP $code). Confira o status no painel."
    echo "$(date +%H:%M:%S)  ainda restaurando... (HTTP $code)"
    sleep "$WAIT_INTERVAL"
  done
}

if [ "$MODE" = "wait" ]; then wait_for_project; exit 0; fi

MANIFEST="$OUT/MANIFESTO.txt"
[ -f "$MANIFEST" ] || { echo "Exportação do Supabase — projeto: ${URL#https://}"; echo; } > "$MANIFEST"
manifest() { echo "$*" >> "$MANIFEST"; }

# ─── tabelas (JSON) ──────────────────────────────────────────────────────────

export_tables() {
  mkdir -p "$OUT/tables"
  manifest "--- tabelas (JSON), $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  for t in "${TABLES[@]}"; do
    local offset=0 total="" body="" first=1 page inner got
    while :; do
      page=$(api -D "$HDR" -H "Prefer: count=exact" \
        "$URL/rest/v1/$t?select=*&order=id.asc&limit=$PAGE_SIZE&offset=$offset") \
        || fail "falha lendo a tabela $t (projeto pausado? policy de leitura?)"
      case "$page" in "["*) ;; *) fail "resposta inesperada para $t: ${page:0:120}" ;; esac
      # grep sem resultado retorna erro: com set -e/pipefail abortaria em tabela vazia, daí o "|| true"
      total=$({ grep -i '^content-range:' "$HDR" || true; } | tr -d '\r' | sed 's#.*/##' | head -1)
      [ "$page" = "[]" ] && break
      inner="${page:1:${#page}-2}"
      if [ "$first" = 1 ]; then body="$inner"; first=0; else body="$body,$inner"; fi
      offset=$((offset + PAGE_SIZE))
      [ -n "$total" ] && [ "$total" != "*" ] && [ "$offset" -ge "$total" ] && break
    done
    printf '[%s]\n' "$body" > "$OUT/tables/$t.json"
    got=$({ grep -o '{"id":' "$OUT/tables/$t.json" || true; } | wc -l | tr -d ' ')
    if [ -n "$total" ] && [ "$total" != "*" ] && [ "$got" != "$total" ]; then
      warn "$t: servidor diz $total linhas, mas o arquivo tem $got (confira; pode haver tabela sem coluna id)"
    fi
    ok "tabela $t: ${total:-?} linhas -> tables/$t.json"
    manifest "tabela $t: servidor=${total:-0} arquivo=$got"
  done
}

# ─── tabelas (CSV): dispensa exportar uma a uma pelo painel ──────────────────

export_csv() {
  mkdir -p "$OUT/csv"
  manifest "--- tabelas (CSV)"
  for t in "${TABLES[@]}"; do
    local offset=0 total="" page file="$OUT/csv/$t.csv"
    : > "$file"
    while :; do
      page=$(api -D "$HDR" -H "Accept: text/csv" -H "Prefer: count=exact" \
        "$URL/rest/v1/$t?select=*&order=id.asc&limit=$PAGE_SIZE&offset=$offset") \
        || fail "falha lendo o CSV de $t"
      total=$({ grep -i '^content-range:' "$HDR" || true; } | tr -d '\r' | sed 's#.*/##' | head -1)
      [ -z "$page" ] && break
      if [ "$offset" = 0 ]; then printf '%s\n' "$page" >> "$file"; else printf '%s\n' "$page" | tail -n +2 >> "$file"; fi
      offset=$((offset + PAGE_SIZE))
      [ -n "$total" ] && [ "$total" != "*" ] && [ "$offset" -ge "$total" ] && break
    done
    ok "csv $t -> csv/$t.csv ($(wc -c < "$file" | tr -d ' ') bytes)"
    manifest "csv $t: $(wc -c < "$file" | tr -d ' ') bytes"
  done
}

# ─── schema ──────────────────────────────────────────────────────────────────

export_schema() {
  mkdir -p "$OUT/schema"
  api "$URL/rest/v1/" > "$OUT/schema/openapi.json" || fail "falha lendo o schema (OpenAPI)"
  # O Supabase só entrega o OpenAPI para a chave service_role: com a chave pública vem um JSON de erro
  # (que também começa com "{"), então checa o conteúdo e não só o primeiro caractere.
  if ! grep -qE '"(swagger|openapi)"' "$OUT/schema/openapi.json"; then
    warn "schema INDISPONÍVEL com a chave pública: $(head -c 140 "$OUT/schema/openapi.json")"
    warn "use as consultas SQL do roteiro (Passo 3b) no SQL Editor do painel para obter colunas e tabelas"
    rm -f "$OUT/schema/openapi.json" "$OUT/schema/tabelas.txt"
    manifest "schema: INDISPONIVEL (a chave publica nao acessa o OpenAPI; usar SQL Editor)"
    return 0
  fi
  ok "schema (colunas e tipos reais) -> schema/openapi.json"
  manifest "schema: openapi.json $(wc -c < "$OUT/schema/openapi.json" | tr -d ' ') bytes"

  # Lista as tabelas expostas e sinaliza as que o plano não conhece (conferência #2 do roteiro).
  { grep -o '"/[a-zA-Z0-9_]*":{' "$OUT/schema/openapi.json" || true; } | sed -E 's#"/(.*)":\{#\1#' | { grep -v '^$' || true; } | sort -u > "$OUT/schema/tabelas.txt"
  local n; n=$(wc -l < "$OUT/schema/tabelas.txt" | tr -d ' ')
  ok "$n tabelas expostas -> schema/tabelas.txt"
  local t unknown=0 known
  while IFS= read -r t; do
    [ -n "$t" ] || continue
    known=0
    for k in "${TABLES[@]}" "${KNOWN_OTHER[@]}"; do [ "$t" = "$k" ] && known=1; done
    if [ "$known" = 0 ]; then warn "tabela NÃO MAPEADA no plano: $t (me avise: pode ser dado do CRM)"; unknown=$((unknown + 1)); fi
  done < "$OUT/schema/tabelas.txt"
  manifest "schema: $n tabelas expostas, $unknown não mapeadas"
}

# ─── imagens do bucket ───────────────────────────────────────────────────────

list_names() {  # nomes de arquivos de uma pasta do bucket (ignora subpastas, que vêm sem "id")
  local prefix="$1" offset=0 res n
  while :; do
    res=$(api -X POST -H 'Content-Type: application/json' \
      -d "{\"prefix\":\"$prefix\",\"limit\":$PAGE_SIZE,\"offset\":$offset,\"sortBy\":{\"column\":\"name\",\"order\":\"asc\"}}" \
      "$URL/storage/v1/object/list/uploads") || fail "falha listando uploads/$prefix"
    case "$res" in "["*) ;; *) fail "listagem inesperada de uploads/$prefix: ${res:0:120}" ;; esac
    [ "$res" = "[]" ] && break
    # Formato real: {"name":"x.png","version":"...","id":"...","metadata":{...aninhado...}}. Pastas vêm com "id":null.
    # Por isso o padrão não pode exigir um objeto sem chaves internas: casa só o começo name..id.
    printf '%s' "$res" | { grep -oE '"name":"[^"]*",("version":("[^"]*"|null),)?"id":"[^"]*"' || true; } \
      | sed -E 's/^"name":"([^"]*)".*/\1/'
    n=$(printf '%s' "$res" | { grep -o '"name":"' || true; } | wc -l | tr -d ' ')
    [ "$n" -lt "$PAGE_SIZE" ] && break
    offset=$((offset + PAGE_SIZE))
  done
}

export_storage() {
  mkdir -p "$OUT/uploads"
  local count=0 prefix name path
  for prefix in "" "${FOLDERS[@]}"; do
    while IFS= read -r name; do
      [ -n "$name" ] || continue
      path="${prefix:+$prefix/}$name"
      mkdir -p "$OUT/uploads/$(dirname "$path")"
      api -f -o "$OUT/uploads/$path" "$URL/storage/v1/object/public/uploads/$(urlencode "$path")" \
        || { warn "falhou o download de uploads/$path"; continue; }
      count=$((count + 1))
    done < <(list_names "$prefix")
  done
  ok "$count arquivos do bucket uploads -> uploads/"
  if [ "$count" = 0 ]; then
    warn "0 arquivos: o bucket pode estar mesmo vazio OU a listagem foi bloqueada para a chave pública. Confirme no SQL Editor (Passo 3b, consulta Q2); se houver arquivos, use o modo 'urls'."
    manifest "uploads: 0 arquivos (SEM CONFIRMACAO: bucket vazio ou listagem bloqueada)"
  else
    manifest "uploads: $count arquivos"
  fi
  if [ "$count" -gt 0 ]; then
    (cd "$OUT/uploads" && find . -type f -print0 | sort -z | xargs -0 sha256sum) > "$OUT/uploads.sha256"
    ok "checksums -> uploads.sha256"
  fi
}

# ─── urls: baixa imagens a partir de uma lista (quando a listagem do bucket é bloqueada) ──────────

# Cada linha do arquivo é uma URL pública do bucket, ex.: https://<ref>.supabase.co/storage/v1/object/public/uploads/clientes/abc.png
# (por exemplo, os logo_url de clientes que já estão no MySQL do portal).
export_urls() {
  local list="$ARG3" line rel count=0 prefix="$URL/storage/v1/object/public/uploads/"
  [ -n "$list" ] && [ -f "$list" ] || fail "uso: bash scripts/export-supabase.sh <pasta> urls <arquivo-com-uma-URL-por-linha>"
  mkdir -p "$OUT/uploads"
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'\r'}"; line="${line%%\?*}"
    [ -n "$line" ] || continue
    case "$line" in "$prefix"*) ;; *) warn "ignorada (não é do bucket uploads deste projeto): ${line:0:100}"; continue ;; esac
    rel="${line#"$prefix"}"
    rel=$(printf '%b' "${rel//%/\\x}")          # %20 -> espaço, %C3%A7 -> ç
    case "$rel" in *..*) warn "ignorada (caminho suspeito): $rel"; continue ;; esac
    mkdir -p "$OUT/uploads/$(dirname "$rel")"
    "$CURL" -sS -f --max-time 90 -o "$OUT/uploads/$rel" "$line" || { warn "falhou o download de $rel"; rm -f "$OUT/uploads/$rel"; continue; }
    count=$((count + 1))
  done < "$list"
  ok "$count arquivos baixados pela lista -> uploads/"
  manifest "uploads (por lista de URLs): $count arquivos"
  if [ "$count" -gt 0 ]; then
    (cd "$OUT/uploads" && find . -type f -print0 | sort -z | xargs -0 sha256sum) > "$OUT/uploads.sha256"
    ok "checksums -> uploads.sha256"
  fi
}

# ─── verify: conferência automática (substitui boa parte do passo 4 do roteiro) ─

verify_export() {
  local bad=0 t line server file
  echo; echo "=== Conferência automática de $OUT"
  [ -s "$MANIFEST" ] || { warn "MANIFESTO.txt ausente"; bad=1; }

  for t in "${TABLES[@]}"; do
    [ -f "$OUT/tables/$t.json" ] && [ "$(head -c 1 "$OUT/tables/$t.json")" = "[" ] \
      || { warn "tables/$t.json ausente ou inválido"; bad=1; continue; }
    [ -f "$OUT/csv/$t.csv" ] || { warn "csv/$t.csv ausente"; bad=1; }
    line=$(awk -v t="tabela $t:" 'index($0, t) == 1 { l = $0 } END { print l }' "$MANIFEST")
    server=$(printf '%s' "$line" | sed -E 's/.*servidor=([^ ]*).*/\1/'); file=$(printf '%s' "$line" | sed -E 's/.*arquivo=([^ ]*).*/\1/')
    if [ -z "$line" ]; then warn "$t: sem registro no manifesto"; bad=1
    elif [ "$server" != "$file" ]; then warn "$t: servidor=$server arquivo=$file"; bad=1
    else ok "$t: $file linhas (servidor = arquivo)"; fi
  done

  if [ -d "$OUT/uploads" ] && [ -f "$OUT/uploads.sha256" ]; then
    if (cd "$OUT/uploads" && sha256sum -c ../uploads.sha256 --quiet 2>/dev/null); then
      ok "imagens: $(wc -l < "$OUT/uploads.sha256" | tr -d ' ') arquivos, todos os checksums OK"
    else warn "imagens: algum checksum falhou"; bad=1; fi
  elif [ "${ALLOW_EMPTY_UPLOADS:-0}" = 1 ]; then
    ok "imagens: 0 arquivos, aceito por ALLOW_EMPTY_UPLOADS=1 (bucket confirmado vazio)"
  else
    warn "imagens: 0 arquivos NÃO confirmados. Rode a consulta Q2 do roteiro; se o bucket estiver mesmo vazio, rode 'ALLOW_EMPTY_UPLOADS=1 ... verify'"
    bad=1
  fi

  # Confere o CONTEÚDO: com a chave pública o openapi.json pode ser só um JSON de erro (101 bytes).
  if [ -s "$OUT/schema/openapi.json" ] && grep -qE '"(swagger|openapi)"' "$OUT/schema/openapi.json"; then
    ok "schema: openapi.json válido"
  elif [ -s "$OUT/schema/colunas.csv" ]; then
    # O SQL Editor corta o resultado em 100 linhas: confere que o CSV cobre as 6 tabelas, não só que existe.
    local missing=""
    for t in "${TABLES[@]}"; do
      { sed 's/^"//' "$OUT/schema/colunas.csv" | grep -q "^$t,"; } || missing="$missing $t"
    done
    if [ -n "$missing" ]; then
      warn "schema/colunas.csv NÃO cobre:$missing (o SQL Editor limita a 100 linhas; rode a Q1 restrita às 6 tabelas)"; bad=1
    else
      ok "schema: colunas.csv cobre as 6 tabelas ($(($(wc -l < "$OUT/schema/colunas.csv") - 1)) colunas)"
    fi
  else warn "schema ausente: salve o resultado da consulta Q1 do roteiro em schema/colunas.csv"; bad=1; fi
  [ -s "$OUT/schema/tabelas.txt" ] && ok "tabelas expostas: $(tr '\n' ' ' < "$OUT/schema/tabelas.txt")"

  echo
  if [ "$bad" = 0 ]; then
    ok "VEREDITO: exportação conferida. Falta: comparar as contagens com o painel, compactar (pack) e pausar o projeto."
  else
    warn "VEREDITO: há pendências acima. Não pause o projeto ainda."; return 1
  fi
}

# ─── pack: compacta com senha ────────────────────────────────────────────────

pack_export() {
  local base; base="$(cd "$OUT" && pwd)"
  local sevenzip=""
  for c in 7z 7za "/c/Program Files/7-Zip/7z.exe"; do
    if command -v "$c" >/dev/null 2>&1 || [ -x "$c" ]; then sevenzip="$c"; break; fi
  done
  if [ -n "$sevenzip" ]; then
    echo "Vou pedir uma SENHA para o arquivo (guarde-a no seu gerenciador de senhas)."
    "$sevenzip" a -p -mhe=on "$base.7z" "$base/" >/dev/null && ok "arquivo protegido -> $base.7z"
  elif command -v zip >/dev/null 2>&1; then
    (cd "$(dirname "$base")" && zip -er "$(basename "$base").zip" "$(basename "$base")") && ok "arquivo protegido -> $base.zip"
  else
    warn "nem 7-Zip nem zip encontrados: instale o 7-Zip (7-zip.org) e rode 'pack' de novo. Nada foi criado."
    return 1
  fi
}

case "$WHAT" in
  tables)  export_tables ;;
  csv)     export_csv ;;
  schema)  export_schema ;;
  storage) export_storage ;;
  urls)    export_urls ;;
  verify)  verify_export ;;
  pack)    pack_export ;;
  all)     export_tables; export_csv; export_schema; export_storage; verify_export ;;
esac

echo
ok "fim. Manifesto: $MANIFEST (guarde esta pasta fora dos repos e fora da VPS)"
