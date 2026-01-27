@echo off
echo ========================================
echo   Iniciando ProsperPOS
echo ========================================
echo.

echo [1/3] Iniciando Backend (puerto 3000)...
cd /d "c:\Users\carlo\OneDrive\Escritorio\ProsperPOS\backend"
start "Backend - Puerto 3000" cmd /k "npm run dev"
timeout /t 3 /nobreak > nul

echo.
echo [2/3] Iniciando Template Admin (puerto 3001)...
cd /d "c:\Users\carlo\OneDrive\Escritorio\ProsperPOS\template"
start "Template - Puerto 3001" cmd /k "npm run serve"
timeout /t 3 /nobreak > nul

echo.
echo [3/3] Iniciando Ecommerce (puerto 3002)...
cd /d "c:\Users\carlo\OneDrive\Escritorio\ProsperPOS\ecommerce"
start "Ecommerce - Puerto 3002" cmd /k "npm run dev"

echo.
echo ========================================
echo   Todos los servidores iniciados!
echo ========================================
echo.
echo Backend:   http://localhost:3000
echo Template:  http://localhost:3001
echo Ecommerce: http://localhost:3002
echo.
echo Esperando 10 segundos para que inicien...
timeout /t 10 /nobreak

echo.
echo Abriendo navegadores...
start http://localhost:3001
start http://localhost:3002

echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause > nul
