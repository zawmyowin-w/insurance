# Digital Insurance & Claims Portal

A full-stack insurance management web application for Myanmar, supporting policy applications, claims, premium scheduling, and an AI chat assistant.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5, Bootstrap 5, React Router v6, i18next (EN/MY) |
| Backend | Java 19, Spring Boot 3.2, Spring Security + JWT |
| Database | MySQL 8 (self-managed, data stored in `.mysql/`) |
| Build | Maven 3.8 |

## Running on Replit

Two workflows run in parallel:

- **Backend** — starts a local MySQL instance (`.mysql/data/`), creates the `insurance_portal` database, then launches Spring Boot on port 8080.
- **Start application** — installs npm dependencies and starts Vite on port 5000. The Vite dev server proxies `/api` requests to the backend.

Start both with the **Project** run button, or restart each individually.

## Default Login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dicp.com.mm | Admin@123 |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `CORS_ALLOWED_ORIGINS` | Comma-separated origins allowed by the backend (must include Replit dev domain) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID for social login |
| `JWT_SECRET` | Override default JWT signing key in production |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Override seeded admin credentials |
| `XAI_API_KEY` | Required for the AI chat assistant feature |

## Key URLs

- App: `http://localhost:5000`
- API: `http://localhost:8080/api`
- Swagger UI: `http://localhost:8080/api/swagger-ui.html`

## User preferences

- Keep existing project structure and stack.
