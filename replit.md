# Digital Insurance & Claims Portal

A full-stack insurance management portal with a React 18 frontend and Spring Boot 3.2 backend.

## Stack

| Layer | Technology | Port |
|-------|-----------|------|
| Frontend | React 18 + Vite | 5000 |
| Backend | Spring Boot 3.2 (Java) | 8080 |
| Database | MySQL 8 (self-managed, data in `.mysql/`) | 3306 |

## Running on Replit

Two workflows run in parallel:

- **Start application** — `cd frontend && npm run dev` (Vite dev server on port 5000)
- **Backend** — `cd backend && bash start-backend.sh` (boots MySQL + Spring Boot)

The frontend proxies `/api` requests to `http://localhost:8080` automatically (configured in `vite.config.js`).

## Default Login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dicp.com.mm | Admin@123 |

## Environment Variables

The backend uses sensible defaults for local dev — no `.env` file is required to run:

| Variable | Default | Purpose |
|----------|---------|---------|
| `DB_PASSWORD` | *(blank)* | MySQL root password |
| `JWT_SECRET` | built-in dev key | JWT signing key |
| `ADMIN_EMAIL` | admin@dicp.com.mm | Bootstrap admin email |
| `ADMIN_PASSWORD` | Admin@123 | Bootstrap admin password |

## Project Structure

```
frontend/          React 18 + Vite SPA
backend/           Spring Boot 3.2 REST API
  start-backend.sh  Starts MySQL then Spring Boot
  src/main/resources/
    application.properties        Main config
database/          Initial SQL schema (Hibernate manages updates automatically)
.mysql/            MySQL data directory (persisted across restarts)
```

## User Preferences

- Keep existing project structure and stack.
