# Digital Insurance Claim and Premiums Portal

A full-stack insurance portal for Myanmar, supporting policy applications, premium payments, claims, and admin management.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite, Bootstrap 5, React Router v6 |
| Backend | Spring Boot 3.2 (Java 19), Spring Security + JWT |
| Database | MySQL 8 (self-managed, data in `.mysql/`) |

## How to Run

Both workflows start automatically. No manual steps needed.

- **Frontend** (`Start application`) — `cd frontend && npm install && npm run dev` → port 5000
- **Backend** (`Backend`) — `cd backend && bash start-backend.sh` → port 8080
  - `start-backend.sh` initialises and starts a local MySQL instance, creates the `insurance_portal` database, then launches Spring Boot via Maven.
  - First run takes ~60 s while Maven downloads dependencies and MySQL initialises.

Frontend proxies `/api/*` to `http://localhost:8080` via Vite, so no CORS issues in dev.

## Default Login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dicp.com.mm | Admin@123 |

Seed data: 4 insurance types · 6 insurance packages — loaded automatically on first backend start by `DataInitializer`.

## Environment Variables

| Key | Purpose |
|-----|---------|
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins for the Spring CORS config |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID for social login |
| `JWT_SECRET` | Override the default JWT signing secret (optional in dev) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Override default admin credentials (optional in dev) |
| `XAI_API_KEY` | Required for the AI chat feature (`/ai/chat` endpoint) |

## Key Directories

```
frontend/src/
  pages/         — route-level React pages (customer/, admin/, public/)
  services/api.js — Axios instance with JWT interceptor
backend/src/main/java/com/insurance/portal/
  controller/    — REST controllers
  service/       — business logic
  config/        — security, CORS, data initializer
database/        — local_mysql.sql seed/schema snapshot
.mysql/          — MySQL data directory (gitignored, created at runtime)
```

## User Preferences

- Keep existing project structure and stack — do not restructure or migrate.
