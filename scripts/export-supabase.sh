#!/usr/bin/env bash
# Exporta do Supabase (projeto restaurado) tudo que o portal precisa levar para o MySQL: as 6 tabelas do CRM,
# o schema real e as imagens do bucket "uploads". Fase 0 de docs/migracao-supabase/PLANO.md.
#
#   bash scripts/export-supabase.sh <pasta-de-saida> [tables|schema|storage|all]
#
# - Usa a chave PÚBLICA (anon/publishable) de .env (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY): as tabelas
#   e o bucket têm policy pública de leitura, então não precisa de service role nem senha do banco. A chave nunca é
#   impressa.
# - A pasta de saída tem e-mail e telefone de terceiros: o script RECUSA gravar dentro de um repositório git.
# - Só lê (GET e list). Não altera nada no Supabase.

set -euo pipefail

OUT="${1:-}"
WHAT="${2:-all}"
CURL="${CURL:-curl}"            # sobrescrevível nos testes
PAGE_SIZE="${PAGE_SIZE:-1000}"
ENV_FILE="${ENV_FILE:-$(dirname "$0")/../.env}"
TABLES=(colaboradores contatos_clientes leads_ia agendamentos enrich_company playground_analise)
FOLDERS=(clientes colaboradores convites)   # pastas do bucket "uploads" (raiz tratada à parte)

fail() { echo "ERRO: $*" >&2; exit 1; }
ok()   { echo "OK:   $*"; }
warn() { echo "AVISO: $*" >&2; }

[ -n "$OUT" ] || fail "uso: bash scripts/export-supabase.sh <pasta-de-saida> [tables|schema|storage|all]"
case "$WHAT" in tables|schema|storage|all) ;; *) fail "segundo argumento inválido: $WHAT" ;; esac

mkdir -p "$OUT"
if git -C "$OUT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  fail "a pasta de saída está dentro de um repositório git; escolha uma pasta FORA dos repos (os dados são de terceiros)"
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

MANIFEST="$OUT/MANIFESTO.txt"
{ echo "Exportação do Supabase em $(date -u +%Y-%m-%dT%H:%M:%SZ) — projeto: ${URL#https://}"; echo; } > "$MANIFEST"

export_tables() {
  mkdir -p "$OUT/tables"
  for t in "${TABLES[@]}"; do
    local offset=0 total="" body="" first=1 page inner
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
    local got
    got=$({ grep -o '{"id":' "$OUT/tables/$t.json" || true; } | wc -l | tr -d ' ')
    if [ -n "$total" ] && [ "$total" != "*" ] && [ "$got" != "$total" ]; then
      warn "$t: servidor diz $total linhas, mas o arquivo tem $got (confira; pode haver tabela sem coluna id)"
    fi
    ok "tabela $t: ${total:-?} linhas -> tables/$t.json"
    echo "tabela $t: servidor=$total arquivo=$got" >> "$MANIFEST"
  done
}

export_schema() {
  mkdir -p "$OUT/schema"
  api "$URL/rest/v1/" > "$OUT/schema/openapi.json" || fail "falha lendo o schema (OpenAPI)"
  case "$(head -c 1 "$OUT/schema/openapi.json")" in "{") ;; *) fail "schema inesperado: $(head -c 120 "$OUT/schema/openapi.json")" ;; esac
  ok "schema (OpenAPI com colunas e tipos de todas as tabelas expostas) -> schema/openapi.json"
  echo "schema: openapi.json $(wc -c < "$OUT/schema/openapi.json") bytes" >> "$MANIFEST"
}

list_names() {  # nomes de arquivos de uma pasta do bucket (ignora subpastas, que vêm sem "id")
  local prefix="$1" offset=0 res
  while :; do
    res=$(api -X POST -H 'Content-Type: application/json' \
      -d "{\"prefix\":\"$prefix\",\"limit\":$PAGE_SIZE,\"offset\":$offset,\"sortBy\":{\"column\":\"name\",\"order\":\"asc\"}}" \
      "$URL/storage/v1/object/list/uploads") || fail "falha listando uploads/$prefix"
    case "$res" in "["*) ;; *) fail "listagem inesperada de uploads/$prefix: ${res:0:120}" ;; esac
    [ "$res" = "[]" ] && break
    # cada objeto: {"name":"...","id":"..." ...}; pastas têm "id":null
    printf '%s' "$res" | grep -o '{[^{}]*"name":"[^"]*"[^{}]*"id":"[^"]*"[^{}]*}' \
      | sed -E 's/.*"name":"([^"]*)".*/\1/'
    local n; n=$(printf '%s' "$res" | grep -o '"name":"' | wc -l | tr -d ' ')
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
  echo "uploads: $count arquivos" >> "$MANIFEST"
  if [ "$count" -gt 0 ]; then
    (cd "$OUT/uploads" && find . -type f -print0 | sort -z | xargs -0 sha256sum) > "$OUT/uploads.sha256"
    ok "checksums -> uploads.sha256"
  fi
}

case "$WHAT" in
  tables)  export_tables ;;
  schema)  export_schema ;;
  storage) export_storage ;;
  all)     export_tables; export_schema; export_storage ;;
esac

echo
ok "pronto. Conferência: $MANIFEST (guarde esta pasta fora do repo e fora da VPS)"
