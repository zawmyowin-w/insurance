# Local Setup — Digital Insurance & Claims Portal

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Java JDK | 17 or 21 | https://adoptium.net |
| Maven | 3.8+ | https://maven.apache.org/download.cgi |
| MySQL | 8.0+ | https://dev.mysql.com/downloads/mysql |
| Node.js | 18+ | https://nodejs.org |

---

## Step 1 — Configure environment

### Backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and fill in your values (MySQL password, xAI key, etc.).  
`start-backend.sh` loads this file automatically — no manual `export` needed.

### Frontend

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env` and fill in your EmailJS credentials.  
**EmailJS is required** for OTP and password-reset emails to be delivered.  
Sign up at https://www.emailjs.com to get your keys.

---

## Step 2 — Start MySQL

| OS | Command |
|----|---------|
| Windows | Open *Services* → start **MySQL80** |
| Mac (Homebrew) | `brew services start mysql` |
| Linux | `sudo systemctl start mysql` |

The backend connects to `127.0.0.1:3306` by default.

---

## Step 3 — Start the Backend

```bash
cd backend
bash start-backend.sh
```

API → **http://localhost:8080/api**

> First run takes ~60 s while Maven downloads dependencies.

---

## Step 4 — Start the Frontend

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

Demo agents and customers are seeded automatically on first run.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Access denied for user 'root'` | Set `DB_PASSWORD` in `backend/.env` |
| `Unknown database 'insurance_portal'` | The startup script creates it; check the MySQL user has `CREATE` permission |
| `Communications link failure` | Start MySQL — see Step 2 |
| Port 8080 in use | Add `server.port=9090` to `backend/src/main/resources/application-local.properties` |
| Port 5000 in use | Change `--port 5000` in `frontend/package.json` dev script, and update `app.cors.allowed-origins` in `application.properties` |
| Frontend "Network Error" | Start the backend first, then the frontend |
| OTP email not received | Check your EmailJS credentials in `frontend/.env` |
