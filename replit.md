# Digital Insurance & Claims Portal

A full-stack digital insurance platform for Myanmar, supporting policy applications, claims, premium payments, agent management, and an AI-powered insurance assistant.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, Bootstrap 5, React Router v6 |
| Backend | Java 17 / Spring Boot 3, Maven |
| Database | MySQL 8 (self-managed, project-local) |
| Auth | JWT (signed with `SESSION_SECRET` Replit secret) |
| AI | xAI API (`XAI_API_KEY`) |
| Email | EmailJS (OTP / password reset) |

## Running on Replit

Two workflows run in parallel (both start automatically):

- **Backend** — `cd backend && bash start-backend.sh`
  - Initializes and starts a project-local MySQL instance under `.mysql/`
  - Creates the `insurance_portal` database automatically
  - Seeds default insurance types, packages, agents, and customers on first run
  - API available at `http://localhost:8080/api`

- **Start application** — `cd frontend && npm install && npm run dev`
  - Vite dev server on port 5000
  - Proxies `/api` calls to the backend automatically

## Default Login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dicp.com.mm | Admin@123 |

Demo agents and customers are seeded automatically on first run.

## Environment & Secrets

| Variable | Where | Notes |
|----------|-------|-------|
| `SESSION_SECRET` | Replit Secret | Used as JWT signing key |
| `XAI_API_KEY` | Replit Secret | Enables AI Assistant + Auto Check; app works without it |
| `VITE_EMAILJS_SERVICE_ID` | Replit Secret | Required for OTP/password-reset emails |
| `VITE_EMAILJS_PUBLIC_KEY` | Replit Secret | Required for OTP/password-reset emails |
| `VITE_EMAILJS_VERIFY_TEMPLATE` | Replit Secret | EmailJS template ID for OTP |
| `VITE_EMAILJS_RESET_TEMPLATE` | Replit Secret | EmailJS template ID for password reset |
| `CORS_ALLOWED_ORIGINS` | `.replit` userenv | Pre-configured for this Repl's dev domain |
| `VITE_GOOGLE_CLIENT_ID` | `.replit` userenv | Pre-configured Google OAuth client ID |

## User Preferences

_(Add any preferences here for the agent to follow.)_
