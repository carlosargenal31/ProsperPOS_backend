@echo off
echo Deteniendo backend...
taskkill /F /IM node.exe 2>nul

timeout /t 3 /nobreak >nul

echo Iniciando backend con DEBUG...
cd backend
start "PROSPERPOS BACKEND DEBUG" cmd /k "echo === BACKEND CON TODOS LOS LOGS === && node server.js"

echo.
echo Backend iniciando...
echo Revisa la ventana "PROSPERPOS BACKEND DEBUG"
echo.
pause
