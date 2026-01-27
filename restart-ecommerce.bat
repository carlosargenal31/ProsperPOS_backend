@echo off
cd /d "%~dp0"

echo Iniciando servicios...

start "Backend" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak > nul

start "Ecommerce" cmd /k "cd ecommerce && npm run dev"
timeout /t 2 /nobreak > nul

echo.
echo ===================================
echo Servicios iniciados:
echo - Backend: http://localhost:3000
echo - Ecommerce: http://localhost:3002
echo ===================================
echo.
pause
