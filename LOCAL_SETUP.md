# VSCode/Local Machine မှာ Run နည်း (Digital Insurance Portal)

ဒီ project ကို Replit ပေါ်ကနေ local Windows/Mac/Linux PC ပေါ်ကို ဆွဲထုတ်ပြီး VSCode မှာ run ချင်ရင် အောက်ပါ steps အတိုင်း လုပ်ပါ။

## 1. လိုအပ်သော software များ

| Software | Version | Download |
|---|---|---|
| Node.js | 18+ | https://nodejs.org |
| Java JDK | 17+ | https://adoptium.net |
| Maven | 3.8+ (သို့) VSCode Java extension ကပါလာတဲ့ Maven ကိုသုံးနိုင်) | https://maven.apache.org |
| MySQL Server | 8.x | https://dev.mysql.com/downloads/installer/ |
| VSCode Extensions | Extension Pack for Java, Spring Boot Extension Pack | VSCode Marketplace |

## 2. npm registry error ဖြေရှင်းနည်း (`ENOTFOUND package-firewall.replit.local`)

Replit ပေါ်မှာ npm က internal proxy ကိုသုံးထားပါတယ်။ local PC မှာ အဲ့ဒါ access မရနိုင်ပါ။ ဒါကြောင့် Command Prompt/PowerShell မှာ:

```
npm config set registry https://registry.npmjs.org/
```

(`frontend/.npmrc` ဖိုင်ကို ဒီ project ထဲမှာ ထည့်ပေးထားပါပြီ — ဒါကြောင့် နောက်ထပ် `npm install` တွေမှာ ဒီ error ပြန်တွေ့စရာ မလိုတော့ပါ။)

## 3. MySQL Database Setup

Replit ပေါ်မှာ MySQL ကို script (`backend/start-backend.sh`) နဲ့ auto-start လုပ်ပေးထားပါတယ်၊ ဒါက Linux/bash-only script ဖြစ်ပြီး Windows မှာ တိုက်ရိုက် run မရပါ။ Local PC မှာ MySQL ကို installer နဲ့ တင်ပြီး run ထားရပါမယ်:

1. MySQL Installer ကနေ **MySQL Server 8.x** ကို install လုပ်ပါ (root password ကို မှတ်ထားပါ၊ (သို့) blank ချန်ထားလို့လည်းရပါတယ်)။
2. MySQL service က default ports 3306 မှာ auto-run နေရပါမယ် (installer က default configure လုပ်ပေးပါတယ်)။
3. Database ကို manual create မလိုပါ — backend က `createDatabaseIfNotExist=true` ဖြစ်နေတဲ့အတွက် app စတင်တဲ့အခါ `insurance_portal` database ကို auto-create လုပ်ပါလိမ့်မယ်။
4. Root password ရှိထားရင် — `backend/.env.example` ကို `backend/.env` အနေနဲ့ copy ပြီး `DB_PASSWORD=` နောက်မှာ password ထည့်ပါ (သို့) VSCode run configuration ထဲမှာ `DB_PASSWORD` environment variable အနေနဲ့ set ပါ။

## 4. Backend ကို VSCode မှာ Run ခြင်း

```
cd backend
mvn clean install
mvn spring-boot:run
```

(သို့) VSCode ရဲ့ Spring Boot Dashboard extension ကနေ `InsurancePortalApplication.java` ကို right-click → **Run**။

Backend က `http://localhost:8080/api` မှာ run ပါလိမ့်မယ်။ Startup log မှာ:
- `insurance_portal` database auto-create ဖြစ်တာ
- Default admin account auto-create ဖြစ်တာ (`admin@dicp.com.mm` / `Admin@123`)

ကို confirm လုပ်ပါ။

## 5. Frontend ကို VSCode မှာ Run ခြင်း

```
cd frontend
npm install
npm run dev
```

Frontend က `http://localhost:5000` မှာ run ပြီး `/api` requests အားလုံးကို backend (`localhost:8080`) ကို proxy လုပ်ပေးပါလိမ့်မယ် (`vite.config.js` ထဲမှာ configure ထားပါတယ်)။

Browser ဖွင့်ပြီး **http://localhost:5000** ကို သွားပါ။

## 6. Optional Features (Google Login, Email OTP/Password-reset)

`frontend/.env.example` ကို `frontend/.env` အနေနဲ့ copy ပြီး Google OAuth Client ID / EmailJS credentials ထည့်ရင် ဒီ features တွေ အလုပ်လုပ်ပါလိမ့်မယ်။ မထည့်ရင်လည်း app ရဲ့ core features (application, claim, payment, admin) အားလုံး အလုပ်လုပ်ပါတယ်။

## 7. Test Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@dicp.com.mm | Admin@123 |

(Customer/Agent test accounts တွေက Replit environment ရဲ့ MySQL data ထဲမှာသာ ရှိပါတယ် — local MySQL မှာ အသစ် register/create ပြန်ပြုလုပ်ရပါမယ်။)
