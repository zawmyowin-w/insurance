# Digital Insurance Claim and Premiums Portal

A full-stack insurance management portal for Myanmar, supporting customer policy applications, claims, premium payments, and admin/agent workflows.

## Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18 + Vite, Bootstrap 5, i18next (EN/MM) |
| Backend  | Spring Boot 3.2 (Java 19), Spring Security + JWT |
| Database | MySQL 8.0 (self-managed, data in `.mysql/`) |

## How to Run on Replit

Both workflows start automatically:

- **Backend** — `cd backend && bash start-backend.sh`
  Starts a local mysqld instance (data persisted in `.mysql/`), creates the `insurance_portal` database, then launches the Spring Boot API on port 8080.
- **Start application** — `cd frontend && npm run dev`
  Starts the Vite dev server on port 5000. All `/api` requests are proxied to the backend at `localhost:8080`.

First boot seeds 4 insurance types, 6 packages, and an admin user via `DataInitializer`.

## Default Credentials

| Role  | Email               | Password  |
|-------|---------------------|-----------|
| Admin | admin@dicp.com.mm   | Admin@123 |

## Key Environment Variables

| Variable              | Purpose                                    | Default              |
|-----------------------|--------------------------------------------|----------------------|
| `JWT_SECRET`          | HMAC-SHA256 signing key                    | Built-in dev key     |
| `DB_PASSWORD`         | MySQL root password                        | *(empty)*            |
| `CORS_ALLOWED_ORIGINS`| Comma-separated allowed origins            | localhost variants   |
| `ADMIN_EMAIL`         | Bootstrap admin email                      | admin@dicp.com.mm    |
| `ADMIN_PASSWORD`      | Bootstrap admin password                   | Admin@123            |

## Project Structure

```
├── frontend/          React + Vite app
│   └── src/
│       ├── pages/     Customer, Agent, Admin page components
│       ├── components/
│       ├── context/   AuthContext, NotifCountContext
│       └── services/  axios API client
├── backend/           Spring Boot application
│   └── src/main/java/com/insurance/portal/
│       ├── config/    Security, CORS, DataInitializer
│       ├── controller/
│       ├── service/
│       ├── model/
│       └── repository/
├── database/          local_mysql.sql — full schema + seed snapshot
└── .mysql/            MySQL data directory (gitignored, auto-created)
```

## User Preferences

- Keep the existing monorepo structure (frontend/ + backend/ side by side).
- Do not migrate the database to Replit PostgreSQL — MySQL is intentional.
