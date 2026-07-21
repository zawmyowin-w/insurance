# Local Setup Guide — Digital Insurance & Claims Portal

Run the full project on your own machine using **localhost** and your own **MySQL 8.0**.

---

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Java JDK | 17 or 21 | https://adoptium.net |
| MySQL Server | 8.0+ | https://dev.mysql.com/downloads/mysql |
| Node.js | 18+ | https://nodejs.org |

> **Maven is not required.** The project includes Maven Wrapper (`mvnw` / `mvnw.cmd`) that downloads the right Maven version automatically.

---

## Step 1 — Start MySQL

Make sure your local MySQL service is running on **port 3306**:

| OS | Command |
|----|---------|
| Windows | Open *Services* → start **MySQL80**, or use MySQL Workbench |
| Mac (Homebrew) | `brew services start mysql` |
| Linux | `sudo systemctl start mysql` |

---

## Step 2 — Import the Database

Run this **once** to create the database, tables, and seed data:

```bash
mysql -u root < database/local_mysql.sql
```

> **Root has a password?** Use `mysql -u root -p < database/local_mysql.sql`

This creates:
- Database `insurance_portal`
- All tables
- 4 insurance types (LIFE, HEALTH, VEHICLE, PROPERTY)
- 6 default insurance packages
- Admin account → `admin@dicp.com.mm` / `Admin@123`
- Default scheduler settings

---

## Step 3 — Configure the Backend

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and set:

```env
# MySQL root password — leave blank if your MySQL has no password
DB_PASSWORD=

# Leave the rest as-is for local dev
```

> Only `DB_PASSWORD` usually needs changing. Everything else works out of the box.

---

## Step 4 — Start the Backend

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

Backend runs at → **http://localhost:8080/api**

> First run takes ~60 seconds while Maven downloads dependencies.

---

## Step 5 — Start the Frontend

Open a **new terminal** (keep backend running):

```bash
cd frontend
npm install        # first time only
npm run dev
```

App runs at → **http://localhost:5000**

---

## Default Login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dicp.com.mm | Admin@123 |

---

## Troubleshooting

**`Access denied for user 'root'@'localhost'`**
→ Set `DB_PASSWORD=yourpassword` in `backend/.env`

**`Unknown database 'insurance_portal'`**
→ Run Step 2 first: `mysql -u root < database/local_mysql.sql`

**`Communications link failure` / cannot connect to MySQL**
→ MySQL is not running — follow Step 1 for your OS

**Port 8080 already in use**
→ Add `server.port=9090` to `backend/src/main/resources/application-local.properties`

**Port 5000 already in use**
→ Change `"dev": "vite --port 5001 --host"` in `frontend/package.json`

**Frontend shows "Network Error" / blank data**
→ Make sure the backend is running on port 8080 before starting the frontend

**AI chat replies with generic answers**
→ Set `XAI_API_KEY=your_key` in `backend/.env` (get one at https://console.x.ai)

**`NoSuchMethodError` for Lombok methods (Windows)**
→ Run `mvnw.cmd clean` inside the `backend` folder, then restart

---

## Project Structure

```
frontend/          React 18 + Vite       → http://localhost:5000
backend/           Spring Boot 3.2 API   → http://localhost:8080/api
  mvnw             Maven Wrapper (Mac/Linux)
  mvnw.cmd         Maven Wrapper (Windows)
  run-local.sh     Start script — Mac/Linux
  run-local.bat    Start script — Windows
  .env.example     Environment variable template
  src/main/resources/
    application.properties           Base config
    application-local.properties     Local overrides (MySQL localhost, CORS localhost)
database/
  local_mysql.sql  Schema + seed data — import once
```
