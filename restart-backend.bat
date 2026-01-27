@echo off
echo Deteniendo procesos Node.js en puerto 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Matando proceso %%a
    taskkill /F /PID %%a
)

echo.
echo Esperando 2 segundos...
timeout /t 2 /nobreak > nul

echo.
echo Iniciando servidor backend...
cd /d "c:\Users\carlo\OneDrive\Escritorio\ProsperPOS\backend"
start cmd /k "npm run dev"

echo.
echo Servidor backend iniciado en nueva ventana
pause
