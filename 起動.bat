@echo off
cd /d "C:\Users\fourl\Desktop\歯科技工アプリ"
timeout /t 3 /nobreak >nul
start "" "http://localhost:3000"
npm run dev
pause
