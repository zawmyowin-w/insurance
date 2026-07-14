# Digital Insurance Claim and Premiums Portal

A full-stack digital insurance portal for Myanmar, with role-based access for Admins, Agents, and Customers.

## Stack

- **Frontend**: React 18, Vite, Bootstrap 5.3, React Router 6, Axios, i18next (EN/Myanmar)
- **Backend**: Java 17, Spring Boot 3.2.3, Spring Security (JWT), Spring Data JPA, Hibernate
- **Database**: MySQL 8 (self-managed, data persisted in `.mysql/`)

## How to Run

Two workflows run in parallel:

| Workflow | Command | Port |
|---|---|---|
| **Start application** (frontend) | `cd frontend && npm run dev` | 5000 |
| **Backend** | `cd backend && bash start-backend.sh` | 8080 |

The backend script starts a local MySQL instance, initializes the `insurance_portal` database, and then launches Spring Boot. The frontend proxies `/api` requests to the backend on port 8080.

## Default Admin Credentials

- **Email**: `admin@dicp.com.mm`
- **Password**: `Admin@123`

## Environment Variables

| Key | Where | Purpose |
|---|---|---|
| `CORS_ALLOWED_ORIGINS` | shared env | Comma-separated allowed origins for Spring CORS |
| `VITE_EMAILJS_SERVICE_ID` | frontend `.env` | EmailJS service ID |
| `VITE_EMAILJS_TEMPLATE_ID` | frontend `.env` | EmailJS template ID |
| `VITE_EMAILJS_PUBLIC_KEY` | frontend `.env` | EmailJS public key |
| `JWT_SECRET` | secret | JWT signing key (has a secure default) |
| `DB_PASSWORD` | secret | MySQL root password (default: empty) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | secret | Override default admin credentials |

## File Uploads

Uploaded documents are stored in `./uploads` relative to the backend working directory.

## User Preferences

- Keep the existing frontend/backend monorepo structure.
