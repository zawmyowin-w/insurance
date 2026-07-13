# Digital Insurance Claim and Premiums Portal

A full-stack digital insurance portal for Myanmar with three user roles: Customer, Agent, and Admin.

## Tech Stack

- **Frontend**: React 18 + Vite + Bootstrap 5 + react-i18next
- **Backend**: Spring Boot 3.2 + Spring Security + JWT + Spring Data JPA
- **Database**: MySQL 8 (self-managed local instance, data under `.mysql/`)
- **Port**: Frontend `5000` (webview workflow), Backend `8080` (console workflow)

## Running on Replit

Both services run as Replit workflows and start automatically:

- **Start application** — `cd frontend && npm run dev` (Vite on port 5000, shown in the preview pane)
- **Backend** — `cd backend && bash start-backend.sh` (initializes/starts a local MySQL 8 server under `.mysql/data`, creates the `insurance_portal` database, loads `database/schema.sql`, then runs the Spring Boot app on port 8080 with context path `/api`)

Note: Replit's managed database is PostgreSQL, not MySQL, so MySQL 8 was installed as a system dependency (`mysql80`) and is run as a self-managed local server whose data lives in the project's `.mysql/` directory (gitignored). If you'd rather use Replit's managed Postgres, the backend's JPA/Hibernate layer would need a Postgres driver + dialect swap and `database/schema.sql` would need Postgres-flavored DDL.

The **frontend is wired to the real backend** for authentication (login, register, session restore via `/auth/me`). The Vite dev server proxies all `/api` requests to the Spring Boot backend on port 8080. `frontend/src/services/mockAuth.js` is no longer imported anywhere and can be deleted once password-reset and email-verification backend endpoints are added (see follow-up tasks).

### Manual backend run (outside the workflow)

```bash
cd backend && bash start-backend.sh
```

## Default Admin Account

- **Email**: admin@dicp.com.mm
- **Password**: Admin@123

## Key Files

- `frontend/src/App.jsx` — React Router routes
- `frontend/src/pages/` — All page components
- `frontend/src/locales/en.json` + `my.json` — Myanmar/English i18n
- `backend/src/main/java/com/insurance/portal/` — Spring Boot application
- `database/schema.sql` — Complete MySQL schema with seed data

## Features

- 🌐 Bilingual: Myanmar + English
- 🌙 Dark / Light mode
- 📱 Fully responsive (mobile, tablet, desktop)
- 3 Roles: Customer, Agent, Admin
- Policy applications with multi-step approval workflow
- Claims management
- Payment tracking with screenshot upload
- In-app notifications
- Premium calculator

## Color Theme

- Primary: `#1a3a5c` (Dark Blue)
- Secondary: `#16a34a` (Green)
- Accent: `#f59e0b` (Orange)

## User Preferences

- Use MySQL for production database
- Frontend runs on localhost:5173, backend on localhost:8080
- Support both Myanmar and English languages
- Keep existing project structure
