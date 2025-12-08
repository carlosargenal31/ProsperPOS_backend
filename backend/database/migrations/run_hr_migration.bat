@echo off
REM ===================================================================
REM PROSPERPOS - Script para ejecutar migración de Recursos Humanos
REM ===================================================================

echo ===================================================================
echo PROSPERPOS - Migracion de Recursos Humanos
echo ===================================================================
echo.

REM Configuración de la base de datos
set DB_HOST=localhost
set DB_PORT=3306
set DB_NAME=prosperpos
set DB_USER=root
set DB_PASS=

echo Conectando a la base de datos...
echo Host: %DB_HOST%
echo Puerto: %DB_PORT%
echo Base de datos: %DB_NAME%
echo Usuario: %DB_USER%
echo.

REM Preguntar por la contraseña si no está configurada
if "%DB_PASS%"=="" (
    set /p DB_PASS=Ingrese la contrasena de MySQL:
)

echo.
echo Ejecutando migracion...
echo.

REM Ejecutar el script SQL
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% %DB_NAME% < create_hr_tables.sql

if %errorlevel% neq 0 (
    echo.
    echo ERROR: La migracion fallo. Por favor revise los mensajes de error.
    echo.
    pause
    exit /b 1
)

echo.
echo ===================================================================
echo Migracion completada exitosamente!
echo ===================================================================
echo.
echo Se han creado las siguientes tablas:
echo - hr_departments (Departamentos)
echo - hr_positions (Cargos/Puestos)
echo - hr_employees (Empleados)
echo.
echo Tambien se han creado:
echo - Datos de ejemplo
echo - Permisos del modulo
echo - Vistas para reportes
echo - Procedimientos almacenados
echo.
pause
