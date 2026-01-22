@echo off
cd /d "c:\Users\carlo\OneDrive\Escritorio\ProsperPOS\backend"
set NODE_ENV=development
set DEBUG=*
npm run dev 2>&1 | tee debug-output.txt
