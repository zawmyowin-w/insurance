# Digital Insurance Claim and Premiums Portal

A full-stack digital insurance portal for Myanmar, supporting policy applications, premium payments, claims management, and an AI chat assistant.

## Stack

- **Frontend**: React 18 + Vite (port 5000)
- **Backend**: Spring Boot 3.2 REST API (port 8080), context path `/api`
- **Database**: MySQL 8.0 (self-managed, data in `.mysql/`)

## How to Run

Two workflows run in parallel (both start automatically):

| Workflow | Command | What it does |
|----------|---------|--------------|
| `Backend` | `cd backend && bash start-backend.sh` | Starts MySQL, creates DB, then runs Spring Boot via Maven |
| `Start application` | `cd frontend && npm run dev` | Starts Vite dev server |

On first backend start, Hibernate creates all tables and seeds default insurance types and an admin account.

## Default Login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dicp.com.mm | Admin@123 |

## Environment Variables

Set in Replit's environment (shared):

| Variable | Purpose |
|----------|---------|
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed origins for the backend CORS policy |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID for social login |

Backend also reads from `backend/.env` (created from `backend/.env.example`):

| Variable | Purpose | Default |
|----------|---------|---------|
| `DB_PASSWORD` | MySQL root password | *(empty)* |
| `JWT_SECRET` | JWT signing key | built-in dev key |
| `ADMIN_EMAIL` | Bootstrap admin email | `admin@dicp.com.mm` |
| `ADMIN_PASSWORD` | Bootstrap admin password | `Admin@123` |
| `XAI_API_KEY` | xAI Grok key for AI chat | *(optional)* |

## Notes

- `CORS_ALLOWED_ORIGINS` must include the current Replit dev domain (update if the domain changes after a repl restart with a new domain).
- The backend's MySQL data is stored in `.mysql/` at the repo root — this directory is gitignored.
- See `LOCAL_SETUP.md` for the original local development setup guide.

## User Preferences

*(none recorded yet)*
