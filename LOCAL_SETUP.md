# Local Setup Guide — Digital Insurance & Claims Portal

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Java JDK | 17+ | https://adoptium.net |
| Apache Maven | 3.8+ | https://maven.apache.org |
| MySQL Server | 8.0+ | https://dev.mysql.com/downloads/mysql |
| Node.js | 18+ | https://nodejs.org |

---

## Step 1 — Import the Database

```bash
mysql -u root -p < database/local_mysql.sql
```

This creates the `insurance_portal` database and all tables.  
You only need to do this **once**. After that, Hibernate keeps the schema up to date automatically.

---

## Step 2 — Configure the Backend

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and set your values:

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_PASSWORD` | MySQL root password | *(empty — skip if no password)* |
| `JWT_SECRET` | JWT signing key | auto-set (safe for local dev) |
| `ADMIN_EMAIL` | Admin login email | `admin@dicp.com.mm` |
| `ADMIN_PASSWORD` | Admin login password | `Admin@123` |

> If your MySQL root account has **no password**, skip this step entirely.

---

## Step 3 — Start the Backend

```bash
cd backend
bash run-local.sh
```

This loads `backend/.env` and starts Spring Boot with the `local` profile.  
API will be available at **http://localhost:8080/api**

---

## Step 4 — Start the Frontend

Open a **new terminal**:

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

---

## Project Structure

```
frontend/          React 18 + Vite SPA (port 5000)
backend/           Spring Boot 3.2 REST API (port 8080)
  run-local.sh     Local startup script (loads .env, runs with local profile)
  .env.example     Template for environment variables
  src/main/resources/
    application.properties         Main config
    application-local.properties   Local overrides (CORS, debug logging)
database/
  local_mysql.sql  Initial schema — import once with mysql -u root -p < ...
```

---

## Troubleshooting

**`Access denied for user 'root'@'localhost'`**  
→ Your MySQL root account has a password. Create `backend/.env` from `.env.example` and set `DB_PASSWORD=your_password`.

**`Unknown database 'insurance_portal'`**  
→ Run Step 1 first: `mysql -u root -p < database/local_mysql.sql`

**`Communications link failure` / can't connect to MySQL**  
→ Make sure MySQL server is running: `sudo systemctl start mysql` (Linux) or start it from MySQL Workbench/System Preferences (Mac/Windows).

**Port 8080 already in use**  
→ Stop the other process, or add `server.port=9090` to `backend/src/main/resources/application-local.properties`.

**Frontend shows blank page or "Network Error"**  
→ Make sure the backend is running on port 8080 before starting the frontend.

**`NoSuchMethodError` for Lombok methods**  
→ Run `mvn clean` inside the `backend` folder, then re-run `bash run-local.sh`.

**Scheduler settings page shows error on first load**  
→ Normal on the very first run — the `scheduler_settings` row is created automatically when the backend starts.
