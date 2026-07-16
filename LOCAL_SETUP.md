# Local Setup Guide — Digital Insurance & Claims Portal

## Prerequisites

| Tool | Version |
|------|---------|
| Java JDK | 17+ → https://adoptium.net |
| Apache Maven | 3.8+ → https://maven.apache.org |
| MySQL Server | 8.0+ → https://dev.mysql.com/downloads/mysql |
| Node.js | 18+ → https://nodejs.org |

---

## Step 1 — Import the Database

```bash
mysql -u root -p < database/local_mysql.sql
```

This creates the `insurance_portal` database, all tables, and the default admin account.  
You only need to do this once. After that, Hibernate keeps the schema up to date automatically.

---

## Step 2 — Configure the Backend (only if MySQL has a password)

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and set `DB_PASSWORD=your_mysql_root_password`.  
Everything else already has safe defaults — you don't need to change anything else.

> **Note:** If your MySQL root account has no password, skip this step entirely.

---

## Step 3 — Start the Backend

```bash
cd backend
bash run-local.sh
```

`run-local.sh` automatically loads `backend/.env` and starts Spring Boot with the local profile.  
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

## Troubleshooting

**`Access denied for user 'root'@'localhost'`**
→ Your MySQL root account has a password. Create `backend/.env` from `.env.example` and set `DB_PASSWORD=your_password`.

**`Unknown database 'insurance_portal'`**
→ Run Step 1 first: `mysql -u root -p < database/local_mysql.sql`

**Port 8080 already in use**
→ Stop the other process, or add `server.port=9090` to `backend/src/main/resources/application-local.properties`.

**Frontend shows blank page or "Network Error"**
→ Make sure the backend is running on port 8080 before starting the frontend.

**`NoSuchMethodError` for Lombok methods (isActive, builder, etc.)**
→ Run `mvn clean` inside the `backend` folder, then re-run `bash run-local.sh`.
