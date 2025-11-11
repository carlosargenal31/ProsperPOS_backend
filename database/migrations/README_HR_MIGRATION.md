# Migración de Recursos Humanos - ProsperPOS

## Descripción

Este módulo crea las tablas necesarias para la gestión de Recursos Humanos en ProsperPOS, incluyendo departamentos, cargos/puestos y empleados.

## Tablas Creadas

### 1. `hr_departments` - Departamentos de RH
Almacena los departamentos de la empresa.

**Campos principales:**
- `id` - Identificador único
- `nombre` - Nombre del departamento
- `descripcion` - Descripción del departamento
- `is_active` - Estado activo/inactivo
- Campos de auditoría: `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`

### 2. `hr_positions` - Cargos/Puestos
Almacena los cargos o puestos de trabajo disponibles.

**Campos principales:**
- `id` - Identificador único
- `nombre` - Nombre del cargo
- `descripcion` - Descripción del cargo
- `department_id` - Relación con departamento
- `is_active` - Estado activo/inactivo
- Campos de auditoría

### 3. `hr_employees` - Empleados
Almacena la información de los empleados de la empresa.

**Campos principales:**
- `id` - Identificador único
- `codigo` - Código único del empleado
- `nombre` - Nombre del empleado
- `apellido` - Apellido del empleado
- `email` - Correo electrónico (único)
- `telefono` - Número de teléfono
- `department_id` - Relación con departamento
- `position_id` - Relación con cargo
- `fecha_ingreso` - Fecha de ingreso a la empresa
- `salario` - Salario del empleado
- `is_active` - Estado activo/inactivo
- Campos de auditoría

## Características Adicionales

### Datos de Ejemplo
Se insertan automáticamente:
- 8 departamentos (RRHH, Ventas, Administración, Tecnología, etc.)
- 21 cargos/puestos relacionados con los departamentos
- Permisos para el módulo de RH

### Vistas Creadas
1. **`vw_employees_full`** - Empleados con información completa (departamento, cargo, antigüedad)
2. **`vw_department_summary`** - Resumen por departamento (cantidad de empleados, nómina, etc.)
3. **`vw_position_summary`** - Resumen por cargo (estadísticas salariales, empleados)

### Procedimientos Almacenados
1. **`sp_get_hr_statistics()`** - Obtiene estadísticas generales de recursos humanos

### Permisos Creados
Se crean automáticamente 12 permisos:
- **Departamentos:** read, create, update, delete
- **Cargos:** read, create, update, delete
- **Empleados:** read, create, update, delete

Los permisos se asignan automáticamente al rol de Administrador (role_id = 1).

## Instrucciones de Instalación

### Opción 1: Usando el Script Automático (Windows)

1. Abre una terminal en la carpeta de migraciones:
   ```bash
   cd C:\Users\carlo\OneDrive\Escritorio\ProsperPOS\backend\database\migrations
   ```

2. Ejecuta el script:
   ```bash
   run_hr_migration.bat
   ```

3. Ingresa la contraseña de MySQL cuando se solicite.

### Opción 2: Usando el Script Automático (Linux/Mac)

1. Dale permisos de ejecución al script:
   ```bash
   chmod +x run_hr_migration.sh
   ```

2. Ejecuta el script:
   ```bash
   ./run_hr_migration.sh
   ```

3. Ingresa la contraseña de MySQL cuando se solicite.

### Opción 3: Ejecución Manual

1. Abre MySQL Workbench o tu cliente MySQL preferido

2. Conéctate a la base de datos `prosperpos`

3. Abre y ejecuta el archivo `create_hr_tables.sql`

### Opción 4: Desde la Línea de Comandos

```bash
mysql -u root -p prosperpos < create_hr_tables.sql
```

## Verificación de la Instalación

Después de ejecutar la migración, puedes verificar que todo se instaló correctamente:

### Verificar Tablas
```sql
SHOW TABLES LIKE 'hr_%';
```

Deberías ver:
- hr_departments
- hr_positions
- hr_employees

### Verificar Datos de Ejemplo
```sql
SELECT COUNT(*) FROM hr_departments;  -- Debería mostrar 8
SELECT COUNT(*) FROM hr_positions;     -- Debería mostrar 21
```

### Verificar Permisos
```sql
SELECT * FROM permissions WHERE module LIKE 'hr_%';
```

### Verificar Vistas
```sql
SHOW FULL TABLES WHERE Table_type = 'VIEW' AND Tables_in_prosperpos LIKE 'vw_%';
```

### Obtener Estadísticas
```sql
CALL sp_get_hr_statistics();
```

## Relaciones entre Tablas

```
hr_departments
    └── hr_positions (1:N)
            └── hr_employees (1:N)
```

- Un departamento puede tener múltiples cargos
- Un cargo puede tener múltiples empleados
- Un empleado pertenece a un departamento y tiene un cargo

## Endpoints de la API

Una vez instaladas las tablas, los siguientes endpoints estarán disponibles:

### Departamentos
- `GET    /api/v1/departments` - Listar departamentos
- `GET    /api/v1/departments/active` - Listar departamentos activos
- `GET    /api/v1/departments/:id` - Obtener un departamento
- `POST   /api/v1/departments` - Crear departamento
- `PUT    /api/v1/departments/:id` - Actualizar departamento
- `DELETE /api/v1/departments/:id` - Eliminar departamento

### Cargos/Puestos
- `GET    /api/v1/positions` - Listar cargos
- `GET    /api/v1/positions/active` - Listar cargos activos
- `GET    /api/v1/positions/department/:id` - Listar cargos por departamento
- `GET    /api/v1/positions/:id` - Obtener un cargo
- `POST   /api/v1/positions` - Crear cargo
- `PUT    /api/v1/positions/:id` - Actualizar cargo
- `DELETE /api/v1/positions/:id` - Eliminar cargo

### Empleados
- `GET    /api/v1/employees` - Listar empleados
- `GET    /api/v1/employees/active` - Listar empleados activos
- `GET    /api/v1/employees/:id` - Obtener un empleado
- `POST   /api/v1/employees` - Crear empleado
- `PUT    /api/v1/employees/:id` - Actualizar empleado
- `DELETE /api/v1/employees/:id` - Eliminar empleado

## Notas Importantes

1. **Soft Delete:** Las tablas usan eliminación lógica (soft delete) mediante el campo `deleted_at`
2. **Auditoría:** Todos los cambios son rastreables mediante los campos de auditoría
3. **Validaciones:** El backend valida que códigos y emails sean únicos
4. **Relaciones:** Las relaciones entre tablas permiten NULL para mayor flexibilidad

## Rollback (Deshacer la Migración)

Si necesitas deshacer la migración:

```sql
-- Eliminar triggers
DROP TRIGGER IF EXISTS trg_hr_departments_audit_update;

-- Eliminar procedimientos
DROP PROCEDURE IF EXISTS sp_get_hr_statistics;

-- Eliminar vistas
DROP VIEW IF EXISTS vw_employees_full;
DROP VIEW IF EXISTS vw_department_summary;
DROP VIEW IF EXISTS vw_position_summary;

-- Eliminar permisos
DELETE FROM role_permissions WHERE permission_id IN (
    SELECT id FROM permissions WHERE module LIKE 'hr_%'
);
DELETE FROM permissions WHERE module LIKE 'hr_%';

-- Eliminar tablas (en orden correcto)
DROP TABLE IF EXISTS hr_employees;
DROP TABLE IF EXISTS hr_positions;
DROP TABLE IF EXISTS hr_departments;
```

## Soporte

Para reportar problemas o sugerencias:
- Desarrollador: Carlos Argeñal
- Proyecto: ProsperPOS
- Año: 2025
