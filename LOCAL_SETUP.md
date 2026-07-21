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

---

## Step 2 — Import the Database

```bash
mysql -u root < database/local_mysql.sql
```

> Root has a password? → `mysql -u root -p < database/local_mysql.sql`

This creates the `insurance_portal` database with all tables and seed data:
- 4 insurance types · 6 insurance packages
- Admin: `admin@dicp.com.mm` / `Admin@123`

---

## Step 3 — Set MySQL Password (if needed)

If your MySQL root has a password, open this file and set it:

```
backend/src/main/resources/application-local.properties
```

```properties
spring.datasource.password=your_password_here
```

Leave blank if your MySQL root has no password.

---

## Step 4 — Start the Backend

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
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
| `Access denied for user 'root'` | Set password in `application-local.properties` |
| `Unknown database 'insurance_portal'` | Run Step 2 first |
| `Communications link failure` | Start MySQL — see Step 1 |
| Port 8080 in use | Add `server.port=9090` to `application-local.properties` |
| Port 5000 in use | Change port in `frontend/package.json` dev script |
| Frontend "Network Error" | Start the backend first, then the frontend |
