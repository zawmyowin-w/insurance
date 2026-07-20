# Digital Insurance Claim and Premiums Portal

A full-stack digital insurance portal for Myanmar, with role-based portals (Admin, Agent, Customer), AI chat, a dynamic form builder, multi-language support (English + Myanmar), and PDF generation for reports and claims.

## Stack

- **Frontend**: React 18 + Vite (port 5000), React Router v6, Bootstrap 5, Axios, i18next
- **Backend**: Spring Boot 3.2 (Java 17), Spring Security, Hibernate/JPA, Maven (port 8080)
- **Database**: MySQL 8.0 (self-managed, data persisted under `.mysql/`)
- **Other**: JWT auth, iText7 (PDF), Swagger/OpenAPI at `/api/swagger-ui.html`

## How to run

Two workflows are configured and should both be started:

1. **Backend** — `cd backend && bash start-backend.sh`
   - Initializes and starts a local MySQL instance (first run takes ~30s)
   - Starts Spring Boot on port 8080
   - Auto-creates the admin account and seeds default insurance types/packages on first run

2. **Start application** (Frontend) — `cd frontend && npm run dev`
   - Serves the React app on port 5000
   - Proxies `/api` requests to the backend at `localhost:8080`

## Environment variables

All backend variables have safe defaults for local development. No `.env` file is required to run. Optional overrides:

| Variable | Default | Purpose |
|---|---|---|
| `DB_PASSWORD` | _(empty)_ | MySQL root password |
| `JWT_SECRET` | built-in dev key | JWT signing key |
| `ADMIN_EMAIL` | `admin@dicp.com.mm` | Bootstrap admin email |
| `ADMIN_PASSWORD` | `Admin@123` | Bootstrap admin password |
| `XAI_API_KEY` | _(empty)_ | Enables AI chat via xAI Grok |

Set via Replit Secrets or by creating `backend/.env`.

## Default login

- **Admin**: `admin@dicp.com.mm` / `Admin@123`

## Project structure

```
/frontend    — React application
/backend     — Spring Boot application
/database    — SQL schema reference (local_mysql.sql)
```

## User preferences

_None recorded yet._
