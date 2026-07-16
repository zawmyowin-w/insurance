# Digital Insurance Claim and Premiums Portal

A full-stack insurance portal for Myanmar, supporting policy plans, premium calculations, claims filing, and an admin dashboard.

## Stack
- **Frontend**: React 19 + Vite (port 5000), Bootstrap 5.3, React Router 7, i18next (EN / Myanmar)
- **Backend**: Java 17 + Spring Boot 3.2.3, Spring Security (JWT), Hibernate/JPA (port 8080)
- **Database**: MySQL 8.0 — self-managed inside the container, data persisted in `.mysql/`

## How to run

Two workflows start in parallel via the **Project** run button:

| Workflow | Command | Port |
|---|---|---|
| Start application | `cd frontend && npm run dev` | 5000 |
| Backend | `cd backend && bash start-backend.sh` | 8080 |

The `start-backend.sh` script initialises and starts MySQL, applies the schema from `database/schema.sql`, then launches Spring Boot via Maven.

The frontend proxies all `/api/*` requests to the backend (`vite.config.js`), so no hardcoded backend URLs are needed in frontend code.

## Default admin credentials
- Email: `admin@dicp.com.mm`
- Password: `Admin@123`

## Environment variables (Replit shared env / `.replit` `[userenv.shared]`)
| Variable | Purpose |
|---|---|
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins — must include the current Replit dev domain |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID for social login |

## Secrets (set via Replit Secrets)
| Secret | Purpose |
|---|---|
| `JWT_SECRET` | Signs JWT tokens — override the insecure default for production |
| `DB_PASSWORD` | MySQL root password — currently empty (initialized with `--initialize-insecure`) |

## Notes
- `CORS_ALLOWED_ORIGINS` must be updated if the Replit dev domain changes (visible in `$REPLIT_DEV_DOMAIN`)
- EmailJS keys (`VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY`) are optional — needed only if the contact/email features are used
- The database schema is re-applied on every backend start (idempotent `CREATE TABLE IF NOT EXISTS`)

## User preferences
