@echo off
echo ============================================
echo Cerrando TODOS los procesos de Node.js
echo ============================================

echo.
echo [1/5] Matando node.exe...
taskkill /F /IM node.exe /T 2>nul
if %errorlevel% equ 0 (
    echo    ✓ Procesos node.exe terminados
) else (
    echo    ! No se encontraron procesos node.exe
)

echo.
echo [2/5] Matando nodemon.exe...
taskkill /F /IM nodemon.exe /T 2>nul
if %errorlevel% equ 0 (
    echo    ✓ Procesos nodemon.exe terminados
) else (
    echo    ! No se encontraron procesos nodemon.exe
)

echo.
echo [3/5] Esperando 5 segundos para que se liberen los puertos...
timeout /t 5 /nobreak > nul
echo    ✓ Espera completada

echo.
echo [4/5] Verificando puerto 3000...
netstat -ano | findstr :3000 | findstr LISTENING
if %errorlevel% equ 0 (
    echo    ! ADVERTENCIA: El puerto 3000 aun esta en uso
    echo    Intentando matar el proceso...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
        echo    Matando PID: %%a
        taskkill /F /PID %%a 2>nul
    )
    timeout /t 2 /nobreak > nul
) else (
    echo    ✓ Puerto 3000 libre
)

echo.
echo [5/5] Iniciando servidor backend...
echo ============================================
cd backend
node server.js
