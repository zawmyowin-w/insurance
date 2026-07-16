#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Run the backend locally.
# Automatically loads backend/.env so you don't have to export env vars by hand.
# Usage:  cd backend && bash run-local.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
    echo "[run-local] Loading $ENV_FILE ..."
    set -a
    # shellcheck source=/dev/null
    source "$ENV_FILE"
    set +a
else
    echo "[run-local] No .env found — using built-in defaults (DB_PASSWORD empty, default JWT secret)."
    echo "[run-local] Copy backend/.env.example to backend/.env if you need to override anything."
fi

cd "$SCRIPT_DIR"
exec mvn spring-boot:run -Dspring-boot.run.profiles=local
