#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Start the backend locally (assumes MySQL is already running as a service).
# Loads backend/.env automatically — no need to export variables by hand.
#
# Usage:
#   cd backend
#   bash run-local.sh
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
    echo "[run-local] No .env found — using built-in defaults."
    echo "[run-local] Copy backend/.env.example to backend/.env if you need to override anything."
fi

cd "$SCRIPT_DIR"
MVNW="$SCRIPT_DIR/mvnw"
if [ -f "$MVNW" ]; then
    chmod +x "$MVNW"
    exec "$MVNW" spring-boot:run -Dspring-boot.run.profiles=local
else
    exec mvn spring-boot:run -Dspring-boot.run.profiles=local
fi
