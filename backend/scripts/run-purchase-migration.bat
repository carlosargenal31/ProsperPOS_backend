@echo off
echo Ejecutando migracion de compras...
mysql -u root -p310104 prosperpos < "%~dp0..\database\add-invoice-fields-to-purchases.sql"
echo Migracion completada!
pause
