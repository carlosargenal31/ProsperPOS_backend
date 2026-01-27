@echo off
echo =========================================
echo   REINICIANDO PROSPERPOS
echo =========================================
echo.

REM Detener todos los procesos Node.js
echo [1/4] Deteniendo procesos anteriores...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Iniciar Backend
echo [2/4] Iniciando Backend (puerto 3000)...
cd /d "%~dp0backend"
start "ProsperPOS Backend" cmd /k "echo BACKEND INICIANDO... && node server.js"
timeout /t 3 /nobreak >nul

REM Iniciar Frontend
echo [3/4] Iniciando Frontend (puerto 8080)...
cd /d "%~dp0template"
start "ProsperPOS Frontend" cmd /k "echo FRONTEND INICIANDO... && npm run serve"

echo [4/4] Esperando que los servidores inicien...
timeout /t 10 /nobreak >nul

echo.
echo =========================================
echo   SERVIDORES INICIADOS
echo =========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:8080
echo.
echo Presiona cualquier tecla para abrir el navegador...
pause >nul

start http://localhost:8080/#/pos-facturacion
start LIMPIAR_CACHE_Y_PROBAR.html

echo.
echo =========================================
echo   IMPORTANTE: LIMPIA EL CACHE
echo =========================================
echo.
echo Presiona: Ctrl + Shift + R
echo O usa el archivo HTML que se acaba de abrir
echo.
pause
