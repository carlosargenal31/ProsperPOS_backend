@echo off
echo ========================================
echo Prueba de Configuracion de E-commerce
echo ========================================
echo.

echo 1. Obteniendo token...
curl -X POST http://localhost:3000/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin\"}" ^
  -o token.json
echo.

echo 2. Extrayendo token...
echo.

echo 3. Probando GET config (sin autenticacion - deberia fallar)...
curl -X GET http://localhost:3000/api/v1/companies/ecommerce/config
echo.
echo.

echo ========================================
echo Por favor, prueba manualmente desde el frontend
echo Navega a: Gestion de Tienda en Linea ^> Configuracion
echo ========================================
pause
