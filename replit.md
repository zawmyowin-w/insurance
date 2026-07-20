# Digital Insurance & Claims Portal

A full-stack digital insurance portal for Myanmar — customers can browse plans, apply for policies, submit claims, and track premium payments. Admins manage applications, claims, payments, and reports.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite (port 5000) |
| Backend | Spring Boot 3.2 REST API (port 8080) |
| Database | MySQL 8 (self-managed, data in `.mysql/`) |
| Auth | JWT (stateless) |

## How to run

Two workflows run in parallel via the **Project** run button:

- **Start application** — `cd frontend && npm run dev` (port 5000)
- **Backend** — `cd backend && bash start-backend.sh` (starts MySQL + Spring Boot on port 8080)

The frontend proxies `/api/*` requests to `localhost:8080` via Vite's dev proxy.

## Default credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dicp.com.mm | Admin@123 |

## Project structure

```
frontend/          React 18 + Vite SPA
backend/           Spring Boot 3.2 REST API
  start-backend.sh Replit startup (self-managed MySQL + Spring Boot)
  run-local.sh     Local dev startup (loads .env)
  .env.example     Template for local environment variables
  src/main/resources/application.properties  Main config (all values have defaults)
database/
  local_mysql.sql  Initial schema (used for fresh local installs)
.mysql/            MySQL data directory (created on first run, gitignored)
```

## Environment variables

All backend config has safe defaults in `application.properties` — no `.env` file is required on Replit. The following env vars are set in the Replit environment:

- `CORS_ALLOWED_ORIGINS` — comma-separated list of allowed CORS origins (includes the Replit dev domain)
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth client ID for social login

## Notes

- On first backend start, MySQL is initialized and the `insurance_portal` database is created automatically
- Default admin account and seed data (insurance types, packages) are seeded by `DataInitializer` on startup
- Uploaded files are stored under `backend/uploads/`

## User preferences
