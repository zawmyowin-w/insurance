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

The backend connects to `127.0.0.1:3306` by default.

---

## Step 2 — Start the Backend

```bash
cd backend
bash start-backend.sh
```

API → **http://localhost:8080/api**

> First run takes ~60 s while Maven downloads dependencies.

If your MySQL root user has a password, set it first:

```bash
export DB_PASSWORD='your_password_here'
cd backend && bash start-backend.sh
```

**Windows (PowerShell):**
```powershell
$env:DB_PASSWORD = 'your_password_here'
cd backend
bash start-backend.sh        # requires Git Bash / WSL
```

For a different MySQL user, host, port, or database name:

```bash
export DB_HOST=127.0.0.1
export DB_PORT=3306
export DB_USER=root
export DB_NAME=insurance_portal
export DB_PASSWORD='your_password_here'
```

---

## Step 3 — Start the Frontend

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

## Email OTP — Demo Mode

EmailJS keys are **not required** locally. Without them the app runs in
*demo mode*:

- OTP codes and email-verification links are printed to the **browser
  console** (press **F12** → **Console** tab) instead of being emailed.
- Copy the code from the console and paste it into the form to continue.

To enable real email sending, copy `frontend/.env.example` to
`frontend/.env` and fill in your EmailJS credentials:

```bash
cp frontend/.env.example frontend/.env
# then edit frontend/.env with your EmailJS values
```

---

## Configure MySQL Connection (if needed)

You can also set variables permanently by creating a `.env` file in the
`backend/` directory (it is git-ignored):

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_NAME=insurance_portal
DB_PASSWORD=your_password_here
```

Then source it before starting:

```bash
export $(cat backend/.env | xargs)
cd backend && bash start-backend.sh
```

Uploaded documents are stored under `backend/uploads/`. Do not delete
this directory — it contains claim documents, payment screenshots, and
policy files referenced by the database.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Access denied for user 'root'` | Set `DB_PASSWORD` before starting the backend |
| `Unknown database 'insurance_portal'` | The startup script creates it; check the MySQL user has `CREATE` permission |
| `Communications link failure` | Start MySQL — see Step 1 |
| Port 8080 in use | Add `server.port=9090` to `backend/src/main/resources/application-local.properties` |
| Port 5000 in use | Change `--port 5000` to another port in `frontend/package.json` dev script, and update `app.cors.allowed-origins` in `application.properties` |
| Frontend "Network Error" | Start the backend first, then the frontend |
| OTP code not received | Check browser console (F12) — code is printed there in demo mode |
