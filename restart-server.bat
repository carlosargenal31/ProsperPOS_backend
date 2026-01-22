@echo off
echo Matando procesos de Node.js...
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM nodemon.exe /T 2>nul

echo Esperando 3 segundos...
timeout /t 3 /nobreak > nul

echo Verificando puerto 3000...
netstat -ano | findstr :3000 | findstr LISTENING

echo.
echo Iniciando servidor...
node server.js
