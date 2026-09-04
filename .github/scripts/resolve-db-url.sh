#!/usr/bin/env bash
# Resolve Railway PostgreSQL connection URL (PUBLIC) cho 1 environment.
#
# Usage:   resolve-db-url.sh <environment-name> [output-file]
# Env:     RAILWAY_API_TOKEN (required), RAILWAY_PROJECT_ID (required),
#          RAILWAY_BACKEND_SERVICE_ID (optional fallback)
# Output:  URL ghi ra file (mặc định $RUNNER_TEMP/db_url), đã ::add-mask::.
#          KHÔNG bao giờ in URL ra stdout/stderr.
#
# Thứ tự resolve:
#   1. Service tên chứa "postgres" → DATABASE_PUBLIC_URL
#   2. Service postgres → dựng URL public từ TCP proxy
#      (RAILWAY_TCP_PROXY_DOMAIN/PORT + PGUSER/PGPASSWORD/PGDATABASE)
#   3. Fallback: backend service → DATABASE_PUBLIC_URL / DATABASE_URL
set -euo pipefail

ENV_NAME="${1:?Thiếu environment name}"
OUT="${2:-${RUNNER_TEMP:-/tmp}/db_url}"
GQL="https://backboard.railway.com/graphql/v2"
AUTH="Authorization: Bearer ${RAILWAY_API_TOKEN:?Thiếu RAILWAY_API_TOKEN}"

gql() {
  curl -fsS "$GQL" -H "$AUTH" -H 'Content-Type: application/json' -d "$1"
}

# 1. Environment theo tên
ENV_ID=$(gql "$(jq -n --arg id "${RAILWAY_PROJECT_ID:?Thiếu RAILWAY_PROJECT_ID}" \
  '{query:"query($id:String!){project(id:$id){environments{edges{node{id name}}}}}",variables:{id:$id}}')" \
  | jq -r --arg n "$ENV_NAME" '.data.project.environments.edges[] | select(.node.name==$n) | .node.id' | head -1)
[ -n "$ENV_ID" ] || { echo "::error::Không tìm thấy environment '$ENV_NAME'"; exit 1; }

# 2. Service Postgres (ưu tiên) + backend (fallback)
REQ=$(jq -n --arg id "${RAILWAY_PROJECT_ID}" \
  '{query:"query($id:String!){project(id:$id){services{edges{node{id name}}}}}",variables:{id:$id}}')
SERVICES=$(gql "$REQ" | jq -c '[.data.project.services.edges[].node]')
PG_SERVICE_ID=$(echo "$SERVICES" | jq -r '[.[] | select(.name | ascii_downcase | contains("postgres"))][0].id // empty')
FALLBACK_SERVICE_ID="${RAILWAY_BACKEND_SERVICE_ID:-}"

fetch_vars() {
  local sid="$1"
  local req
  req=$(jq -n --arg pid "${RAILWAY_PROJECT_ID}" --arg eid "$ENV_ID" --arg sid "$sid" \
    '{query:"query($projectId:String!,$environmentId:String!,$serviceId:String!){variables(projectId:$projectId,environmentId:$environmentId,serviceId:$serviceId)}",variables:{projectId:$pid,environmentId:$eid,serviceId:$sid}}')
  gql "$req" | jq -c '.data.variables // empty'
}

build_url() {
  local vars="$1"
  # Ưu tiên DATABASE_PUBLIC_URL
  local url
  url=$(echo "$vars" | jq -r '.DATABASE_PUBLIC_URL // empty')
  if [ -n "$url" ] && ! echo "$url" | grep -q 'railway.internal'; then
    echo "$url"; return 0
  fi
  # Dựng từ TCP proxy
  local domain port
  domain=$(echo "$vars" | jq -r '.RAILWAY_TCP_PROXY_DOMAIN // empty')
  port=$(echo "$vars" | jq -r '.RAILWAY_TCP_PROXY_PORT // empty')
  if [ -n "$domain" ] && [ -n "$port" ]; then
    local u p d enc
    u=$(echo "$vars" | jq -r '.PGUSER // "postgres"')
    p=$(echo "$vars" | jq -r '.PGPASSWORD // empty')
    d=$(echo "$vars" | jq -r '.PGDATABASE // "railway"')
    enc=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$p")
    echo "postgresql://${u}:${enc}@${domain}:${port}/${d}?sslmode=require"; return 0
  fi
  # DATABASE_URL nếu không phải internal
  url=$(echo "$vars" | jq -r '.DATABASE_URL // empty')
  if [ -n "$url" ] && ! echo "$url" | grep -q 'railway.internal'; then
    echo "$url"; return 0
  fi
  echo ""
}

URL=""
if [ -n "$PG_SERVICE_ID" ]; then
  URL=$(build_url "$(fetch_vars "$PG_SERVICE_ID")")
fi
if [ -z "$URL" ] && [ -n "$FALLBACK_SERVICE_ID" ]; then
  URL=$(build_url "$(fetch_vars "$FALLBACK_SERVICE_ID")")
fi

if [ -z "$URL" ] || echo "$URL" | grep -q 'railway.internal'; then
  echo "::error::Không suy ra được URL PUBLIC cho DB environment '$ENV_NAME'."
  echo "::error::Fix: bật TCP Proxy cho service Postgres trên Railway, hoặc set secret DB URL trực tiếp."
  exit 1
fi

mkdir -p "$(dirname "$OUT")"
printf '%s' "$URL" > "$OUT"
echo "::add-mask::$URL"
echo "✅ Resolved DB URL cho environment '$ENV_NAME' (đã mask)"