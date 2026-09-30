@echo off
echo ========================================================
echo Starting RESQAI Backend (FastAPI + SQLAlchemy + Uvicorn)
echo ========================================================
cd /d "%~dp0"
call .\backend\venv\Scripts\activate
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
pause
