@echo off
cd /d "%~dp0ecommerce"
if exist "node_modules\.vite" (
    echo Limpiando cache de Vite...
    rmdir /S /Q "node_modules\.vite"
)
echo Iniciando ecommerce...
npm run dev
