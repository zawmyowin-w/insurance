# Digital Insurance Claim and Premiums Portal

A full-stack insurance management platform for Myanmar, featuring policy applications, claims, premium scheduling, and an admin dashboard.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite (port 5000) |
| Backend | Spring Boot 3.2 REST API (port 8080) |
| Database | MySQL 8 (self-managed, data in `.mysql/`) |

## How to Run

Two workflows must both be running:

1. **Backend** (`cd backend && bash start-backend.sh`)
   - Starts a local MySQL instance (data persisted in `.mysql/`)
   - Initializes the `insurance_portal` database automatically on first run
   - Launches Spring Boot on port 8080
   - Seeds default admin account, insurance types, and packages on first boot

2. **Start application** (`cd frontend && npm run dev`)
   - Vite dev server on port 5000

## Default Login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dicp.com.mm | Admin@123 |

## Project Structure

```
frontend/      React 18 + Vite SPA
backend/       Spring Boot 3.2 REST API
  start-backend.sh   Replit entrypoint (starts MySQL + Spring Boot)
  run-local.sh       Local dev entrypoint (loads .env)
  .env.example       Environment variable template
database/
  local_mysql.sql    Reference schema (Hibernate manages schema on Replit)
.mysql/        MySQL data directory (auto-created, gitignored)
```

## Environment Variables

The backend uses built-in defaults and needs no secrets to run on Replit. To override:

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_PASSWORD` | MySQL root password | *(empty)* |
| `JWT_SECRET` | JWT signing key | Built-in dev key |
| `ADMIN_EMAIL` | Bootstrap admin email | `admin@dicp.com.mm` |
| `ADMIN_PASSWORD` | Bootstrap admin password | `Admin@123` |

## User Preferences

- Keep existing project structure and stack — do not restructure or migrate.
