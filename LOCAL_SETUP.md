# Local Development Setup Guide

This guide explains how to run the **Digital Insurance & Claims Portal** on your own machine using **localhost** and a **local MySQL database**.

---

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Java JDK | 17 or higher | https://adoptium.net |
| Apache Maven | 3.8+ | https://maven.apache.org |
| MySQL Server | 8.0+ | https://dev.mysql.com/downloads/mysql |
| Node.js | 18 or higher | https://nodejs.org |
| npm | 9+ | (bundled with Node.js) |

---

## Step 1 — Set Up MySQL Database

Open **MySQL Workbench** or a terminal and run the schema file:

```sql
-- In MySQL CLI:
mysql -u root -p < database/schema.sql
```

Or open `database/schema.sql` in MySQL Workbench and execute it.

This will:
- Create the `insurance_portal` database
- Create all tables
- Insert 5 sample insurance packages

---

## Step 2 — Configure the Backend

Copy the example environment file:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and fill in your values:

```env
# MySQL root password (leave blank if your MySQL has no root password)
DB_PASSWORD=your_mysql_root_password

# JWT secret key (any long random string — keep it secret)
JWT_SECRET=MyLocalSecretKey2024ChangeThisToSomethingLong

# Default admin account (created automatically on first run)
ADMIN_EMAIL=admin@dicp.com.mm
ADMIN_PASSWORD=Admin@123
```

> **Default:** If `DB_PASSWORD` is not set, the app connects with an empty password.
> The JWT secret and admin credentials also have built-in defaults shown in the file.

---

## Step 3 — Configure the Frontend

Copy the example environment file:

```bash
cp frontend/.env.example frontend/.env
```

The frontend `.env` is optional. Leave it blank to use the app without email OTP features.

---

## Step 4 — Start the Backend

```bash
cd backend
mvn spring-boot:run
```

The API will be available at: **http://localhost:8080/api**

On first start it will:
- Connect to your local MySQL
- Apply schema migrations via Hibernate
- Create the default admin account

---

## Step 5 — Start the Frontend

Open a **new terminal** and run:

```bash
cd frontend
npm install        # first time only
npm run dev
```

The app will be available at: **http://localhost:5173**

---

## Default Login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dicp.com.mm | Admin@123 |

> Change the password after your first login.

---

## Project Structure

```
insurance-portal/
├── backend/               ← Spring Boot (Java 17) — port 8080
│   ├── .env.example       ← copy to .env and fill in values
│   └── src/
├── frontend/              ← React + Vite — port 5173
│   ├── .env.example       ← copy to .env (optional, for email OTP)
│   └── src/
├── database/
│   └── schema.sql         ← run this in your local MySQL
└── LOCAL_SETUP.md         ← this file
```

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PASSWORD` | *(empty)* | MySQL root password |
| `JWT_SECRET` | built-in dev key | HMAC-SHA256 signing key |
| `ADMIN_EMAIL` | admin@dicp.com.mm | Auto-created admin email |
| `ADMIN_PASSWORD` | Admin@123 | Auto-created admin password |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_EMAILJS_SERVICE_ID` | EmailJS service ID (optional) |
| `VITE_EMAILJS_PUBLIC_KEY` | EmailJS public key (optional) |
| `VITE_EMAILJS_VERIFY_TEMPLATE` | Email verification template ID |
| `VITE_EMAILJS_RESET_TEMPLATE` | Password reset template ID |

---

## Troubleshooting

**`Access denied for user 'root'@'localhost'`**
→ Set the correct password in `backend/.env` as `DB_PASSWORD=yourpassword`

**`Unknown database 'insurance_portal'`**
→ Run `database/schema.sql` in MySQL first (Step 1)

**Port 8080 already in use**
→ Stop any other service using port 8080, or change `server.port` in `backend/src/main/resources/application.properties`

**Frontend can't reach the API**
→ Make sure the backend is running on port 8080. Check `frontend/src/services/api.js` for the base URL.
