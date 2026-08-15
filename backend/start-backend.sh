#!/usr/bin/env bash
# Starts the backend with MySQL. An existing local MySQL is reused; otherwise a
# project-local MySQL instance is started with data persisted under ./.mysql.
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Auto-load backend/.env if it exists and vars are not already set
ENV_FILE="$(dirname "${BASH_SOURCE[0]}")/.env"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-insurance_portal}"
DB_USER="${DB_USER:-root}"
FILE_STORAGE_DIR="${FILE_STORAGE_DIR:-$ROOT_DIR/backend/uploads}"
MYSQL_DATA_DIR="$ROOT_DIR/.mysql/data"
MYSQL_RUN_DIR="$ROOT_DIR/.mysql/run"
MYSQL_SOCK="$MYSQL_RUN_DIR/mysqld.sock"
MYSQL_LOG="$ROOT_DIR/.mysql/mysqld.log"
MYSQL_PID=""

mkdir -p "$MYSQL_RUN_DIR"

mysql_args=(-h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER")
if [ -n "${DB_PASSWORD:-}" ]; then
  export MYSQL_PWD="$DB_PASSWORD"
fi

if mysqladmin "${mysql_args[@]}" ping > /dev/null 2>&1; then
  echo "[start-backend] Using existing MySQL at ${DB_HOST}:${DB_PORT}."
else
  if [ "$DB_HOST" != "127.0.0.1" ] && [ "$DB_HOST" != "localhost" ]; then
    echo "[start-backend] Cannot connect to MySQL at ${DB_HOST}:${DB_PORT}." >&2
    exit 1
  fi

  if [ ! -d "$MYSQL_DATA_DIR/mysql" ]; then
    echo "[start-backend] Initializing project-local MySQL data directory..."
    mkdir -p "$MYSQL_DATA_DIR"
    mysqld --initialize-insecure --datadir="$MYSQL_DATA_DIR"
  fi

  echo "[start-backend] Starting project-local MySQL..."
  mysqld \
    --datadir="$MYSQL_DATA_DIR" \
    --socket="$MYSQL_SOCK" \
    --pid-file="$MYSQL_RUN_DIR/mysqld.pid" \
    --port="$DB_PORT" \
    --bind-address=127.0.0.1 \
    --skip-mysqlx \
    > "$MYSQL_LOG" 2>&1 &
  MYSQL_PID=$!
  mysql_args=(-S"$MYSQL_SOCK" -u"$DB_USER")
fi

cleanup() {
  if [ -n "$MYSQL_PID" ]; then
    echo "[start-backend] Stopping project-local MySQL..."
    kill "$MYSQL_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "[start-backend] Waiting for MySQL to accept connections..."
for i in $(seq 1 30); do
  if mysqladmin "${mysql_args[@]}" ping > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! mysqladmin "${mysql_args[@]}" ping > /dev/null 2>&1; then
  echo "[start-backend] MySQL did not become ready." >&2
  exit 1
fi

echo "[start-backend] Ensuring database '${DB_NAME}' exists..."
mysql "${mysql_args[@]}" -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# ── Idempotent schema migrations (Hibernate ddl-auto=update cannot alter ENUM columns) ──────────
# Run each statement separately, ignoring errors (column/type may already be correct).
set +e
mysql "${mysql_args[@]}" "${DB_NAME}" -e "ALTER TABLE form_templates MODIFY COLUMN form_type ENUM('APPLICATION','CLAIM','EMERGENCY') NOT NULL;" 2>/dev/null
mysql "${mysql_args[@]}" "${DB_NAME}" -e "ALTER TABLE payments MODIFY COLUMN status ENUM('PENDING','VERIFIED','REJECTED','WAIVED') NULL;" 2>/dev/null
# Add customer_edited_since_revision if missing (safe on re-runs: column already exists → error silently ignored)
mysql "${mysql_args[@]}" "${DB_NAME}" -e "ALTER TABLE policy_applications ADD COLUMN customer_edited_since_revision TINYINT(1) NOT NULL DEFAULT 0;" 2>/dev/null
mysql "${mysql_args[@]}" "${DB_NAME}" -e "ALTER TABLE claims ADD COLUMN customer_edited_since_revision TINYINT(1) NOT NULL DEFAULT 0;" 2>/dev/null
# Migrate premium_rate column from decimal (0.02) to percentage (2.00) — idempotent: only runs when < 1
mysql "${mysql_args[@]}" "${DB_NAME}" -e "UPDATE insurance_packages SET premium_rate = ROUND(premium_rate * 100, 4) WHERE premium_rate > 0 AND premium_rate < 1;" 2>/dev/null
set -e

# ── Migrate premiumRate in JSON tier/band columns from decimal to percentage ──
# Uses the same mysql_args already configured (socket or TCP). Idempotent.
_migrate_json() {
  local j="$1"
  [ -z "$j" ] && return
  python3 -c "
import json, sys
try:
    data = json.loads(sys.argv[1])
    if not isinstance(data, list): sys.exit(0)
    changed = False
    for item in data:
        r = item.get('premiumRate')
        if r is not None and 0 < float(r) < 1:
            item['premiumRate'] = round(float(r) * 100, 4)
            changed = True
    if changed: print(json.dumps(data))
except: pass
" "$j" 2>/dev/null
}
while IFS=$'\t' read -r _pkg_id _tiers _bands; do
  [ -z "$_pkg_id" ] && continue
  _nt=$(_migrate_json "$_tiers")
  _nb=$(_migrate_json "$_bands")
  if [ -n "$_nt" ] || [ -n "$_nb" ]; then
    _sets=""
    if [ -n "$_nt" ]; then
      _esc=$(printf '%s' "$_nt" | sed "s/'/''/g")
      _sets="duration_tiers='${_esc}'"
    fi
    if [ -n "$_nb" ]; then
      _esc=$(printf '%s' "$_nb" | sed "s/'/''/g")
      [ -n "$_sets" ] && _sets="${_sets},"
      _sets="${_sets}age_bands='${_esc}'"
    fi
    mysql "${mysql_args[@]}" "${DB_NAME}" -e \
      "UPDATE insurance_packages SET ${_sets} WHERE id=${_pkg_id};" 2>/dev/null || true
  fi
done < <(mysql "${mysql_args[@]}" "${DB_NAME}" -N -B -e \
  "SELECT id, IFNULL(duration_tiers,''), IFNULL(age_bands,'') FROM insurance_packages;" 2>/dev/null) || true

# ── Add batch_ref column to payments if missing ─────────────────────────────
set +e
mysql "${mysql_args[@]}" "${DB_NAME}" -e \
  "ALTER TABLE payments ADD COLUMN batch_ref VARCHAR(36) NULL;" 2>/dev/null
set -e

# Schema and seed data are managed by Hibernate (ddl-auto=update) and DataInitializer on startup.

echo "[start-backend] Starting Spring Boot application..."
cd "$ROOT_DIR/backend"
# Use SESSION_SECRET as the JWT signing key when available (Replit secret)
JWT_SECRET_VAL="${JWT_SECRET:-${SESSION_SECRET:-}}"
exec env DB_HOST="$DB_HOST" DB_PORT="$DB_PORT" DB_NAME="$DB_NAME" DB_USER="$DB_USER" \
  FILE_STORAGE_DIR="$FILE_STORAGE_DIR" \
  JWT_SECRET="$JWT_SECRET_VAL" \
  XAI_API_KEY="${XAI_API_KEY:-}" \
  mvn -q spring-boot:run
