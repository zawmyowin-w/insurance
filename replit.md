# Digital Insurance Claim and Premiums Portal

A full-stack insurance management platform for Myanmar, supporting policy applications, claims, payments, and agent/admin workflows.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite (port 5000) |
| Backend | Java 17 / Spring Boot 3.2, Maven (port 8080) |
| Database | MySQL 8 (project-local, data in `.mysql/data/`) |
| Auth | JWT (access + refresh tokens) |

## Running the project

Two workflows run in parallel (both start automatically):

- **Start application** — `cd frontend && npm install && npm run dev`
- **Backend** — `cd backend && bash start-backend.sh` (starts MySQL if needed, then Spring Boot)

First backend start takes ~60 s while Maven downloads dependencies.

## Default login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dicp.com.mm | Admin@123 |

Demo agents and customers are seeded automatically on first run.

## Key environment variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `DB_HOST` | MySQL host | `127.0.0.1` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL user | `root` |
| `DB_NAME` | Database name | `insurance_portal` |
| `DB_PASSWORD` | MySQL password | _(empty)_ |
| `FILE_STORAGE_DIR` | Uploaded file storage | `backend/uploads/` |
| `SESSION_SECRET` | JWT signing secret | set in Replit Secrets |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | set in `.replit` userenv |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend origins | set in `.replit` userenv |

## Project structure

```
frontend/   React app (Vite)
backend/    Spring Boot API
  src/      Java source
  start-backend.sh  Starts MySQL + Spring Boot
database/   SQL seed file (local_mysql.sql)
```

## User preferences

_(none recorded yet)_
