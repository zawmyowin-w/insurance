# Digital Insurance Claim and Premiums Portal

A full-stack insurance portal for Myanmar, featuring policy applications, claims management, premium scheduling, and an AI chat assistant.

## Stack

| Layer    | Technology                        | Port |
|----------|-----------------------------------|------|
| Frontend | React 18 + Vite                   | 5000 |
| Backend  | Spring Boot 3.2 (Java 19)         | 8080 |
| Database | MySQL 8 (self-managed in workflow) | 3306 |

## Running on Replit

Two workflows must both be running:

1. **Backend** — starts MySQL, waits for it, creates the `insurance_portal` database, then runs the Spring Boot API on port 8080. First startup takes ~60 s while Maven downloads dependencies.
2. **Start application** — runs `cd frontend && npm run dev` on port 5000. Frontend proxies `/api` requests to the backend, so CORS is not an issue.

Both workflows start automatically. If you restart them, start **Backend** first and wait for "Started InsurancePortalApplication" in the logs before the frontend matters.

## Default Login

| Role  | Email              | Password  |
|-------|--------------------|-----------|
| Admin | admin@dicp.com.mm  | Admin@123 |

The admin account is seeded automatically on first backend startup.

## Environment Variables

All backend defaults are built into `application.properties`. Optional overrides:

| Variable         | Purpose                                  |
|------------------|------------------------------------------|
| `DB_PASSWORD`    | MySQL root password (empty = no password)|
| `JWT_SECRET`     | JWT signing key (has a built-in default) |
| `ADMIN_EMAIL`    | Bootstrap admin email                    |
| `ADMIN_PASSWORD` | Bootstrap admin password                 |
| `XAI_API_KEY`    | xAI Grok key for AI chat (optional)      |

## Project Structure

```
frontend/          React 18 + Vite (port 5000)
backend/           Spring Boot 3.2 REST API (port 8080)
  start-backend.sh Replit workflow entry point (starts MySQL + Spring Boot)
  run-local.sh     Local Mac/Linux startup (loads .env, assumes MySQL running)
  src/main/resources/
    application.properties       Main config with all defaults
database/
  local_mysql.sql  Full schema for local import (Replit uses Hibernate ddl-auto)
```

## User Preferences

- Keep existing project structure and stack — do not restructure or migrate.
