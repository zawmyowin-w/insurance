#!/usr/bin/env bash
# Starts a local MySQL instance (data persisted under ./.mysql) and then the Spring Boot backend.
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MYSQL_DATA_DIR="$ROOT_DIR/.mysql/data"
MYSQL_RUN_DIR="$ROOT_DIR/.mysql/run"
MYSQL_SOCK="$MYSQL_RUN_DIR/mysqld.sock"
MYSQL_LOG="$ROOT_DIR/.mysql/mysqld.log"

mkdir -p "$MYSQL_RUN_DIR"

if [ ! -d "$MYSQL_DATA_DIR/mysql" ]; then
  echo "[start-backend] Initializing MySQL data directory..."
  mkdir -p "$MYSQL_DATA_DIR"
  mysqld --initialize-insecure --datadir="$MYSQL_DATA_DIR"
fi

echo "[start-backend] Starting mysqld..."
mysqld \
  --datadir="$MYSQL_DATA_DIR" \
  --socket="$MYSQL_SOCK" \
  --pid-file="$MYSQL_RUN_DIR/mysqld.pid" \
  --port=3306 \
  --bind-address=127.0.0.1 \
  --skip-mysqlx \
  > "$MYSQL_LOG" 2>&1 &
MYSQL_PID=$!

cleanup() {
  echo "[start-backend] Stopping mysqld..."
  kill "$MYSQL_PID" 2>/dev/null || true
}
trap cleanup EXIT

echo "[start-backend] Waiting for MySQL to accept connections..."
for i in $(seq 1 30); do
  if mysqladmin --socket="$MYSQL_SOCK" -uroot ping > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "[start-backend] Ensuring database + schema exist..."
mysql --socket="$MYSQL_SOCK" -uroot -e "CREATE DATABASE IF NOT EXISTS insurance_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql --socket="$MYSQL_SOCK" -uroot insurance_portal < "$ROOT_DIR/database/schema.sql"

echo "[start-backend] Starting Spring Boot application..."
cd "$ROOT_DIR/backend"
exec mvn -q spring-boot:run
