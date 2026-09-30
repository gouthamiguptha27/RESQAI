@echo off
echo =========================================================================
echo Launching RESQAI — Intelligent Emergency Response & Resource Optimization
echo =========================================================================
echo.
echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "RESQAI-Backend" cmd /k "cd /d %~dp0 && call .\backend\venv\Scripts\activate && python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000"

echo [2/2] Starting Vite Frontend on http://localhost:5173 ...
start "RESQAI-Frontend" cmd /k "cd /d %~dp0\frontend && npm run dev -- --host"

echo.
echo =========================================================================
echo RESQAI is now launching!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://localhost:8000/docs
echo =========================================================================
