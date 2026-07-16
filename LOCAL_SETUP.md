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

This creates the `insurance_portal` database, all tables, the default admin account, and 6 sample insurance packages.

---

## Step 2 — Configure the Backend (optional)

Only needed if your MySQL root account has a password:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set `DB_PASSWORD=your_password`.  
Everything else (JWT secret, admin credentials) already has safe defaults.

---

## Step 3 — Start the Backend

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

API will be available at **http://localhost:8080/api**

---

## Step 4 — Start the Frontend

Open a new terminal:

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
→ Set `DB_PASSWORD=your_password` in `backend/.env`

**`Unknown database 'insurance_portal'`**
→ Run Step 1 first

**Port 8080 already in use**
→ Stop the other service or change `server.port` in `backend/src/main/resources/application.properties`

**Frontend shows blank or can't reach API**
→ Make sure the backend is running on port 8080
