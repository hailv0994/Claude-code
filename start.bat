@echo off
title WeldCalc FEM Backend
color 0A

echo ============================================
echo   WeldCalc FEM - Khoi dong Backend Server
echo ============================================
echo.

REM Kiem tra Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [LOI] Chua cai Python!
    echo.
    echo Vui long tai Python tai: https://www.python.org/downloads/
    echo Nhan moi nut "Download Python 3.x.x" roi cai dat.
    echo Khi cai: TICK chon "Add Python to PATH"
    pause
    exit
)

echo [OK] Da tim thay Python
echo.

REM Chuyen vao thu muc backend
cd /d "%~dp0backend"

REM Cai thu vien neu chua co
echo Dang kiem tra thu vien...
pip install fastapi uvicorn httpx scipy numpy Pillow --quiet

echo.
echo [OK] Thu vien san sang
echo.

REM Nhac nhap API key neu chua co
if "%GEMINI_API_KEY%"=="" (
    echo ============================================
    echo  CAN NHAP GEMINI API KEY (mien phi)
    echo ============================================
    echo.
    echo Cach lay API key mien phi:
    echo  1. Mo trinh duyet, vao: https://aistudio.google.com
    echo  2. Dang nhap bang tai khoan Google
    echo  3. Click "Get API key" - "Create API key"
    echo  4. Copy key roi dan vao day:
    echo.
    set /p GEMINI_API_KEY=Nhap API key:
    echo.
)

echo ============================================
echo  BACKEND DANG CHAY!
echo  Truy cap web tai: http://localhost:5173/Claude-code/
echo  De dung: an Ctrl+C roi dong cua so nay
echo ============================================
echo.

python -m uvicorn main:app --host 0.0.0.0 --port 8000

pause
