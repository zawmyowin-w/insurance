# Local Setup — Digital Insurance & Claims Portal

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Java JDK | 17 or 21 | https://adoptium.net |
| Maven | 3.8+ | https://maven.apache.org/download.cgi |
| MySQL | 8.0+ | https://dev.mysql.com/downloads/mysql |
| Node.js | 18+ | https://nodejs.org |

---

## Step 1 — Start MySQL

| OS | Command |
|----|---------|
| Windows | Open *Services* → start **MySQL80** |
| Mac (Homebrew) | `brew services start mysql` |
| Linux | `sudo systemctl start mysql` |

The backend connects to `127.0.0.1:3306` by default. It uses your existing
local MySQL when available. If MySQL is not already running, the Replit
workflow starts a project-local MySQL server and persists its data in
`.mysql/data/`.

---

## Step 2 — Import the Database (optional)

```bash
mysql -u root < database/local_mysql.sql
```

> Root has a password? → `mysql -u root -p < database/local_mysql.sql`

This creates the `insurance_portal` database with all tables and seed data.
Do this only for a fresh database. The SQL file resets the portal tables
before recreating them.
- 4 insurance types · 6 insurance packages
- Admin: `admin@dicp.com.mm` / `Admin@123`

---

## Step 3 — Configure the MySQL Connection (if needed)

If your local MySQL root has a password, set it in the terminal before
starting the backend:

```bash
export DB_PASSWORD='your_password_here'
```

For a different local MySQL user, host, port, or database:

```bash
export DB_HOST=127.0.0.1
export DB_PORT=3306
export DB_USER=root
export DB_NAME=insurance_portal
export DB_PASSWORD='your_password_here'
```

Leave `DB_PASSWORD` unset if the user has no password.

---

## Step 4 — Start the Backend

```bash
cd backend
bash start-backend.sh
```

API → **http://localhost:8080/api**

> First run takes ~60 s while Maven downloads dependencies.

---

## Step 5 — Start the Frontend

Open a **new terminal**:

```bash
cd frontend
npm install     # first time only
npm run dev
```

App → **http://localhost:5000**

---

## Default Login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dicp.com.mm | Admin@123 |

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Access denied for user 'root'` | Set `DB_PASSWORD` before starting the backend |
| `Unknown database 'insurance_portal'` | The startup script creates it; check the MySQL user has `CREATE` permission |
| `Communications link failure` | Start MySQL — see Step 1 |
| Port 8080 in use | Add `server.port=9090` to `application-local.properties` |
| Port 5000 in use | Change port in `frontend/package.json` dev script |
| Frontend "Network Error" | Start the backend first, then the frontend |
