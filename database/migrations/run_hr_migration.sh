#!/bin/bash
# ===================================================================
# PROSPERPOS - Script para ejecutar migración de Recursos Humanos
# ===================================================================

echo "==================================================================="
echo "PROSPERPOS - Migración de Recursos Humanos"
echo "==================================================================="
echo ""

# Configuración de la base de datos
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="prosperpos"
DB_USER="root"
DB_PASS=""

echo "Conectando a la base de datos..."
echo "Host: $DB_HOST"
echo "Puerto: $DB_PORT"
echo "Base de datos: $DB_NAME"
echo "Usuario: $DB_USER"
echo ""

# Preguntar por la contraseña si no está configurada
if [ -z "$DB_PASS" ]; then
    read -sp "Ingrese la contraseña de MySQL: " DB_PASS
    echo ""
fi

echo ""
echo "Ejecutando migración..."
echo ""

# Ejecutar el script SQL
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME < create_hr_tables.sql

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: La migración falló. Por favor revise los mensajes de error."
    echo ""
    exit 1
fi

echo ""
echo "==================================================================="
echo "Migración completada exitosamente!"
echo "==================================================================="
echo ""
echo "Se han creado las siguientes tablas:"
echo "- hr_departments (Departamentos)"
echo "- hr_positions (Cargos/Puestos)"
echo "- hr_employees (Empleados)"
echo ""
echo "También se han creado:"
echo "- Datos de ejemplo"
echo "- Permisos del módulo"
echo "- Vistas para reportes"
echo "- Procedimientos almacenados"
echo ""
