# Digital Insurance Claim and Premiums Portal

A full-stack digital insurance management system designed for the Myanmar market.

## Tech Stack

- **Frontend**: React 18, Vite, Bootstrap 5, React Router 6, i18next (EN/Myanmar)
- **Backend**: Java 17, Spring Boot 3.2, Spring Security (JWT), Spring Data JPA
- **Database**: MySQL 8.0 (self-managed, data persisted in `.mysql/`)
- **PDF**: iText7 | **AI Chat**: xAI Grok (optional)

## How to Run

Two workflows must both be running:

| Workflow | Command | Port |
|---|---|---|
| **Backend** | `cd backend && bash start-backend.sh` | 8080 |
| **Start application** | `cd frontend && npm run dev` | 5000 |

The frontend proxies all `/api/*` requests to the backend, so open the app on **port 5000**.

The backend workflow starts MySQL automatically (data stored in `.mysql/`), creates the `insurance_portal` database, and runs the Spring Boot app. Hibernate manages schema migrations on startup.

## Default Credentials

On first run, a seeded admin account is created:
- **Email**: `admin@dicp.com.mm`
- **Password**: `Admin@123`

## Environment Variables / Secrets

| Variable | Required | Purpose |
|---|---|---|
| `DB_PASSWORD` | No (defaults to empty) | MySQL root password |
| `JWT_SECRET` | No (has a dev default) | JWT signing key — change for production |
| `ADMIN_EMAIL` | No | Override bootstrap admin email |
| `ADMIN_PASSWORD` | No | Override bootstrap admin password |
| `XAI_API_KEY` | No | Enables AI chat assistant (xAI Grok) |
| `CORS_ALLOWED_ORIGINS` | No | Comma-separated allowed origins (defaults to localhost) |

## User Preferences

<!-- Add user preferences here when requested -->
