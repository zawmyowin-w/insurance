# Digital Insurance Claim and Premiums Portal

A full-stack digital insurance portal for Myanmar with three user roles: Customer, Agent, and Admin.

## Tech Stack

- **Frontend**: React 18 + Vite + Bootstrap 5 + react-i18next
- **Backend**: Spring Boot 3.2 + Spring Security + JWT + Spring Data JPA
- **Database**: MySQL 8+ (H2 in-memory for dev/testing)
- **Port**: Frontend `5173`, Backend `8080`

## Running the Frontend (for preview)

```bash
cd frontend && npm install && npm run dev
```

## Running the Backend (requires Java 17 + MySQL)

```bash
# Configure database in backend/src/main/resources/application.properties
cd backend && ./mvnw spring-boot:run
# OR for dev mode with H2 in-memory:
cd backend && ./mvnw spring-boot:run -Dspring.profiles.active=dev
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
