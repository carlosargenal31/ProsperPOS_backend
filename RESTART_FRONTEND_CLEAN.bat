@echo off
echo ========================================
echo LIMPIANDO CACHE Y REINICIANDO FRONTEND
echo ========================================

cd template

echo.
echo [1/4] Eliminando node_modules/.cache...
if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
    echo Cache eliminado
) else (
    echo No hay cache para eliminar
)

echo.
echo [2/4] Eliminando dist...
if exist "dist" (
    rmdir /s /q "dist"
    echo Dist eliminado
) else (
    echo No hay dist para eliminar
)

echo.
echo [3/4] Esperando 2 segundos...
timeout /t 2 /nobreak >nul

echo.
echo [4/4] Iniciando servidor de desarrollo...
echo IMPORTANTE: Cuando cargue, haz Ctrl+Shift+R en el navegador!
echo.
npm run dev

pause
