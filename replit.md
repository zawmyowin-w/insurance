# Digital Insurance Claim and Premiums Portal

A full-stack digital insurance platform for Myanmar, supporting policy applications, claims processing, premium scheduling, AI-assisted chat, and multi-role dashboards (customer, agent, admin).

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, Bootstrap 5, i18next (EN/MM) |
| Backend | Java 17, Spring Boot 3, Maven |
| Database | MySQL 8 (self-managed, data in `.mysql/`) |
| Auth | JWT (signed with `SESSION_SECRET`) |
| AI | xAI API (`XAI_API_KEY`) |
| Email | EmailJS (OTP + password reset) |

## How to run

Two workflows run in parallel (use the **Project** run button):

- **Start application** — `cd frontend && npm install && npm run dev` → port 5000
- **Backend** — `cd backend && bash start-backend.sh` → port 8080/api

`start-backend.sh` automatically initialises and starts a project-local MySQL instance (data persisted under `.mysql/`) if no external MySQL is available.

## Default login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dicp.com.mm | Admin@123 |

Demo agents and customers are seeded automatically on first run.

## Environment variables

Managed in Replit's environment (`.replit` `[userenv.shared]` + Secrets):

| Key | Where | Purpose |
|-----|-------|---------|
| `SESSION_SECRET` | Replit Secret | JWT signing key |
| `CORS_ALLOWED_ORIGINS` | Shared env | Comma-separated allowed origins for CORS |
| `VITE_GOOGLE_CLIENT_ID` | Shared env | Google OAuth client ID |
| `XAI_API_KEY` | Replit Secret (optional) | AI assistant / auto-check features |
| `VITE_EMAILJS_*` | Replit Secret (optional) | OTP and password-reset emails |

## Key directories

```
backend/src/main/java/com/insurance/portal/
  config/        — CORS, security, data seeder
  controller/    — REST endpoints
  service/       — business logic
  model/         — JPA entities
  util/          — PDF, file storage, premium schedule helpers

frontend/src/
  pages/         — route-level page components
  components/    — shared UI components
  services/      — Axios API calls
  locales/       — EN + MM translation files
```

## User preferences

_None recorded yet._
