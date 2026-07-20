@echo off
REM ─────────────────────────────────────────────────────────────────────────────
REM Start the backend locally on Windows.
REM Loads backend\.env automatically if it exists.
REM
REM Usage:
REM   cd backend
REM   run-local.bat
REM ─────────────────────────────────────────────────────────────────────────────

cd /d "%~dp0"

IF EXIST ".env" (
    echo [run-local] Loading .env ...
    FOR /F "usebackq tokens=1,* delims==" %%A IN (".env") DO (
        IF NOT "%%A"=="" IF NOT "%%A:~0,1%"=="#" SET "%%A=%%B"
    )
) ELSE (
    echo [run-local] No .env found -- using built-in defaults.
    echo [run-local] Copy backend\.env.example to backend\.env if needed.
)

mvn spring-boot:run -Dspring-boot.run.profiles=local
