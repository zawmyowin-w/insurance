# Local Setup — Digital Insurance & Claims Portal

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Java JDK | 17 or 21 | https://adoptium.net |
| Maven | 3.8+ | https://maven.apache.org/download.cgi |
| MySQL | 8.0+ | https://dev.mysql.com/downloads/mysql |
| Node.js | 18+ | https://nodejs.org |

---

## Step 1 — Import the Database

```bash
mysql -u root < database/local_mysql.sql
```

> Root has a password? → `mysql -u root -p < database/local_mysql.sql`

This creates the `insurance_portal` database with all tables and seed data:
- 4 insurance types (LIFE, HEALTH, VEHICLE, PROPERTY)
- 6 default insurance packages
- Admin account: `admin@dicp.com.mm` / `Admin@123`

---

## Step 2 — Configure the Backend

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` — set `DB_PASSWORD` if your MySQL root has a password. Leave blank otherwise.

---

## Step 3 — Start the Backend

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

API → **http://localhost:8080/api**

---

## Step 4 — Start the Frontend

Open a new terminal:

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
| `Access denied for user 'root'` | Set `DB_PASSWORD=yourpassword` in `backend/.env` |
| `Unknown database 'insurance_portal'` | Run Step 1 first |
| `Communications link failure` | Start MySQL service first |
| Port 8080 in use | Add `server.port=9090` to `backend/src/main/resources/application-local.properties` |
| Port 5000 in use | Change port in `frontend/package.json` dev script |
| Frontend shows "Network Error" | Make sure backend is running before starting frontend |
