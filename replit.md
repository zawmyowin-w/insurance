# Digital Insurance Claim and Premiums Portal

A full-stack insurance management web application for Myanmar, enabling customers to browse plans, apply for policies, submit claims, and track premium payments. Admins can manage plans, users, applications, and claims.

## Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18 + Vite, Bootstrap 5, React Router v6 |
| Backend  | Spring Boot 3.2 (Java 19), REST API at `/api` |
| Database | MySQL 8.0 (embedded, data in `.mysql/`) |

## How to Run on Replit

Both workflows start automatically:

- **Backend** — starts MySQL (data in `.mysql/`), then Spring Boot on port 8080
- **Start application** — starts Vite dev server on port 5000

The frontend proxies API calls to `http://localhost:8080/api`.

## Default Login

| Role  | Email              | Password  |
|-------|--------------------|-----------|
| Admin | admin@dicp.com.mm  | Admin@123 |

## Project Structure

```
frontend/   React + Vite SPA
backend/    Spring Boot application
  start-backend.sh   Replit workflow entry point (starts MySQL + Spring Boot)
database/   SQL seed file (used for local dev reference; Hibernate manages schema on Replit)
```

## User Preferences

(None recorded yet)
