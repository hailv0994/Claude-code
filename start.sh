#!/bin/bash
echo "============================================"
echo "  WeldCalc FEM - Khoi dong Backend Server"
echo "============================================"
echo

# Cai thu vien
cd "$(dirname "$0")/backend"
pip install fastapi uvicorn httpx scipy numpy Pillow -q

# Nhac API key neu chua co
if [ -z "$GEMINI_API_KEY" ]; then
    echo "Can nhap GEMINI_API_KEY:"
    echo "(Lay mien phi tai aistudio.google.com)"
    read -p "API key: " GEMINI_API_KEY
    export GEMINI_API_KEY
fi

echo
echo "Backend dang chay tai http://localhost:8000"
echo "De dung: nhan Ctrl+C"
echo
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
