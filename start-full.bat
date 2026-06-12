@echo off
title WeldCalc FEM
color 0A

echo ============================================
echo   WeldCalc FEM - Khoi dong toan bo app
echo ============================================
echo.

REM Kiem tra Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [LOI] Chua cai Python!
    echo Tai tai: https://www.python.org/downloads/
    echo Khi cai: TICK chon "Add Python to PATH"
    pause & exit
)

REM Kiem tra Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [LOI] Chua cai Node.js!
    echo Tai tai: https://nodejs.org (chon "LTS")
    pause & exit
)

echo [OK] Python va Node.js san sang
echo.

REM Cai thu vien Python
echo Dang cai thu vien Python...
cd /d "%~dp0backend"
pip install fastapi uvicorn httpx scipy numpy --quiet

REM Cai thu vien Node
echo Dang cai thu vien Node...
cd /d "%~dp0"
call npm install --silent

REM Nhap API key
if "%GEMINI_API_KEY%"=="" (
    echo.
    echo ============================================
    echo  Lay API key mien phi:
    echo  1. Vao https://aistudio.google.com
    echo  2. Dang nhap Google - Click "Get API key"
    echo  3. Click "Create API key" - Copy key
    echo ============================================
    echo.
    set /p GEMINI_API_KEY=Dan API key vao day roi Enter:
    echo.
)

echo ============================================
echo  Dang khoi dong...
echo ============================================

REM Chay backend trong cua so rieng
start "WeldCalc Backend" cmd /k "cd /d "%~dp0backend" && set GEMINI_API_KEY=%GEMINI_API_KEY% && python -m uvicorn main:app --host 0.0.0.0 --port 8000"

REM Cho backend khoi dong
timeout /t 3 /nobreak >nul

REM Chay frontend
echo Mo trinh duyet...
start "" "http://localhost:5173"
cd /d "%~dp0"
call npm run dev -- --port 5173

pause
