@echo off
echo ============================================
echo Iniciando Backend en Puerto 3001
echo ============================================

echo.
echo [1/3] Matando procesos de Node.js...
taskkill /F /IM node.exe /T 2>nul
if %errorlevel% equ 0 (
    echo    √ Procesos terminados
) else (
    echo    ! No se encontraron procesos
)

echo.
echo [2/3] Esperando 5 segundos...
timeout /t 5 /nobreak > nul
echo    √ Espera completada

echo.
echo [3/3] Iniciando servidor en puerto 3001...
echo ============================================
set PORT=3001
node server.js
