# Local Setup Guide — Digital Insurance & Claims Portal

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Java JDK | 17 or 21 | https://adoptium.net |
| Apache Maven | 3.8+ | https://maven.apache.org/download.cgi |
| MySQL Server | 8.0+ | https://dev.mysql.com/downloads/mysql |
| Node.js | 18+ | https://nodejs.org |

---

## Step 1 — Import the Database Schema + Seed Data

Run this **once** on a fresh machine to create the database, all tables, and seed data:

```bash
mysql -u root < database/local_mysql.sql
```

> **Has a password?** Use `mysql -u root -p < database/local_mysql.sql` instead.

This imports:
- All table definitions
- 4 insurance types (LIFE, HEALTH, VEHICLE, PROPERTY)
- 6 default insurance packages
- Admin account (`admin@dicp.com.mm` / `Admin@123`)
- Default scheduler settings

After this, Hibernate keeps the schema up to date automatically on every backend restart — you never need to import again.

---

## Step 2 — Configure the Backend

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and set your values:

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_PASSWORD` | MySQL root password | *(empty — no password)* |
| `JWT_SECRET` | JWT signing key | built-in dev key |
| `ADMIN_EMAIL` | Admin login email | `admin@dicp.com.mm` |
| `ADMIN_PASSWORD` | Admin login password | `Admin@123` |
| `XAI_API_KEY` | xAI Grok key for AI chat | *(optional — falls back to rule-based)* |

> If your MySQL root account has **no password**, leave `DB_PASSWORD=` blank and skip the rest.

---

## Step 3 — Start the Backend

**Mac / Linux:**
```bash
cd backend
bash run-local.sh
```

**Windows:**
```bat
cd backend
run-local.bat
```

API will be available at **http://localhost:8080/api**

> First startup takes ~30 seconds while Maven downloads dependencies and Hibernate creates the tables.

---

## Step 4 — Start the Frontend

Open a **new terminal** (keep the backend running in the first one):

```bash
cd frontend
npm install        # first time only
npm run dev
```

App will be available at **http://localhost:5000**

---

## Default Login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dicp.com.mm | Admin@123 |

The admin account is created automatically on first backend startup.

---

## Project Structure

```
frontend/          React 18 + Vite (port 5000)
backend/           Spring Boot 3.2 REST API (port 8080)
  run-local.sh     Mac/Linux startup script
  run-local.bat    Windows startup script
  .env.example     Template for environment variables
  src/main/resources/
    application.properties          Main config (all defaults)
    application-local.properties    Local dev overrides (debug logging)
database/
  local_mysql.sql  Full schema — import once with mysql -u root -p < ...
```

---

## Troubleshooting

**`Access denied for user 'root'@'localhost'`**
→ Set `DB_PASSWORD=your_password` in `backend/.env`.

**`Unknown database 'insurance_portal'`**
→ Run Step 1 first: `mysql -u root -p < database/local_mysql.sql`

**`Communications link failure` / can't connect to MySQL**
→ Make sure MySQL is running:
- Linux: `sudo systemctl start mysql`
- Mac (Homebrew): `brew services start mysql`
- Windows: Start MySQL from Services or MySQL Workbench

**Port 8080 already in use**
→ Stop the other process, or add `server.port=9090` to `backend/src/main/resources/application-local.properties`.

**Port 5000 already in use**
→ Change `"dev": "vite --port 5001 --host"` in `frontend/package.json`.

**Frontend shows "Network Error" or blank data**
→ Make sure the backend is running on port 8080 before starting the frontend.

**`NoSuchMethodError` for Lombok methods**
→ Run `mvn clean` inside the `backend` folder, then re-run the startup script.

**Scheduler settings page shows error on first load**
→ Normal on the very first run — the `scheduler_settings` row is created automatically on backend startup.

**AI chat replies with generic answers (not using Grok)**
→ Set `XAI_API_KEY=your_key` in `backend/.env` and restart the backend. Get a key at https://console.x.ai
