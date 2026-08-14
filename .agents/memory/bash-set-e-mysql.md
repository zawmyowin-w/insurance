---
name: Bash set -e with mysql migrations
description: start-backend.sh uses set -e; mysql commands that fail (e.g. ALTER TABLE on already-correct schema) exit non-zero and kill the whole script
---

## Rule
Wrap any idempotent `mysql` migration commands in `set +e` / `set -e` so a "column already exists" or "duplicate ENUM" error doesn't abort the startup script.

**Why:** `start-backend.sh` has `set -e` at the top. A `mysql -e "ALTER TABLE ..."` that gets "Duplicate column name" returns exit code 1, which kills the script before Spring Boot even starts. The symptoms look like "MySQL stops immediately after 'Ensuring database exists'".

**How to apply:**
```bash
set +e
mysql ... -e "ALTER TABLE foo ADD COLUMN bar INT NOT NULL DEFAULT 0;" 2>/dev/null
set -e
```
Each statement goes on its own `mysql` call (not a heredoc) so failures are isolated and silently ignored.
Do NOT use `ADD COLUMN IF NOT EXISTS` — that requires MySQL 8.0.3+ and may not be available in the environment.
