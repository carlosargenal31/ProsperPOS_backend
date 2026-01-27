@echo off
echo ========================================
echo REINICIANDO TODO LIMPIAMENTE
echo ========================================

echo.
echo [1/5] Matando procesos de Node.js...
tasklist | find /i "node.exe" && (
    taskkill /F /IM node.exe /T 2>nul
    echo Procesos Node.js terminados
) || (
    echo No hay procesos Node.js corriendo
)

timeout /t 2 /nobreak >nul

echo.
echo [2/5] Limpiando cache del template...
cd template
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"
if exist "dist" rmdir /s /q "dist"
cd ..

echo.
echo [3/5] Iniciando Backend en puerto 3000...
start "Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo [4/5] Iniciando Frontend en puerto 3001...
start "Frontend" cmd /k "cd template && npm run dev"

echo.
echo [5/5] Esperando que los servidores inicien...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo SERVIDORES REINICIADOS
echo ========================================
echo Backend: http://localhost:3000
echo Frontend: http://localhost:3001
echo.
echo IMPORTANTE: En el navegador haz Ctrl+Shift+R
echo ========================================

pause
