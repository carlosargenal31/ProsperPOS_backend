@echo off
echo ========================================
echo REINICIANDO FRONTEND CON FUERZA
echo ========================================
echo.

echo [1/5] Deteniendo procesos de Node.js en puerto 3001...
netstat -ano | findstr :3001 > nul
if %errorlevel% equ 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
        echo Matando proceso %%a
        taskkill /F /PID %%a 2>nul
    )
    echo Proceso detenido
) else (
    echo No hay procesos en puerto 3001
)

timeout /t 2 /nobreak >nul

echo.
echo [2/5] Limpiando cache de Vite...
cd template
if exist node_modules\.vite (
    rmdir /s /q node_modules\.vite
    echo Cache de Vite eliminado
) else (
    echo No hay cache de Vite
)

echo.
echo [3/5] Limpiando dist...
if exist dist (
    rmdir /s /q dist
    echo Dist eliminado
) else (
    echo No hay dist
)

echo.
echo [4/5] Esperando 3 segundos...
timeout /t 3 /nobreak

echo.
echo [5/5] Iniciando frontend en modo desarrollo...
echo.
echo ========================================
echo FRONTEND INICIANDO - NO CIERRES ESTA VENTANA
echo ========================================
echo.
start "Frontend ProsperPOS" cmd /k "cd /d %~dp0template && npm run dev"

timeout /t 3 /nobreak

echo.
echo ========================================
echo FRONTEND REINICIADO
echo ========================================
echo.
echo Abre tu navegador en: http://localhost:3001/vue/template/
echo.
echo IMPORTANTE: Abre VERIFICAR_ROL_Y_RECARGAR.html para verificar tu rol
echo.
pause
