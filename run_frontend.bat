@echo off
echo ========================================================
echo Starting RESQAI Frontend (React + Vite + Leaflet)
echo ========================================================
cd /d "%~dp0\frontend"
npm run dev -- --host
pause
