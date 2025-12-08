# Diccionario de Datos - Sistema ProsperPOS

---

## Información General

**Base de Datos:** prosperpos
**Sistema Gestor:** MySQL
**Fecha de Generación:** 22 de noviembre de 2025
**Total de Tablas:** 60
**Total de Vistas:** 5

---

## Índice de Contenidos

- [Seguridad y Autenticación](#seguridad-y-autenticacion)
- [Recursos Humanos](#recursos-humanos)
- [Productos e Inventario](#productos-e-inventario)
- [Clientes y Proveedores](#clientes-y-proveedores)
- [Ventas](#ventas)
- [Compras](#compras)
- [Facturación](#facturacion)
- [Envíos](#envios)
- [Promociones y Ofertas](#promociones-y-ofertas)
- [Pagos y Finanzas](#pagos-y-finanzas)
- [Configuración General](#configuracion-general)

---

## Seguridad y Autenticación

### login_attempts 

**Tipo:** Tabla  
**Descripción:** Registro de intentos de inicio de sesión (exitosos y fallidos)  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| email | VARCHAR | 100 | No | FK | - | - | Campo de datos |
| ip_address | VARCHAR | 45 | No | FK | - | - | Campo de datos |
| user_agent | TEXT | 65535 | Sí | - | - | - | Campo de datos |
| success | TINYINT | 3 | Sí | - | 0 | - | Campo de datos |
| failure_reason | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| attempted_at | TIMESTAMP | - | Sí | FK | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Campo de datos |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_attempted_at | No | BTREE | attempted_at |
| idx_email | No | BTREE | email |
| idx_ip_address | No | BTREE | ip_address |
| PRIMARY | Sí | BTREE | id |

---

### password_reset_tokens 

**Tipo:** Tabla  
**Descripción:** Tokens de verificación para reseteo de contraseña  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| user_id | INT | 10 | No | FK | - | - | Referencia al usuario |
| token | TEXT | 65535 | No | - | - | - | Campo de datos |
| expires_at | TIMESTAMP | - | No | - | - | - | Campo de datos |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| used_at | TIMESTAMP | - | Sí | - | - | - | Campo de datos |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| password_reset_tokens_ibfk_1 | user_id | users | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| PRIMARY | Sí | BTREE | id |
| user_id | No | BTREE | user_id |

---

### password_resets 

**Tipo:** Tabla  
**Descripción:** Solicitudes de restablecimiento de contraseña  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| user_id | INT | 10 | No | FK | - | - | Referencia al usuario |
| token | VARCHAR | 255 | No | FK | - | - | Campo de datos |
| expires_at | TIMESTAMP | - | No | FK | - | - | Campo de datos |
| used | TINYINT | 3 | Sí | - | 0 | - | Campo de datos |
| used_at | TIMESTAMP | - | Sí | - | - | - | Campo de datos |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| password_resets_ibfk_1 | user_id | users | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_expires_at | No | BTREE | expires_at |
| idx_token | No | BTREE | token |
| idx_user_id | No | BTREE | user_id |
| PRIMARY | Sí | BTREE | id |

---

### permissions 

**Tipo:** Tabla  
**Descripción:** Lista de permisos específicos que pueden asignarse a roles  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| name | VARCHAR | 100 | No | UNIQUE | - | - | Nombre descriptivo |
| slug | VARCHAR | 100 | No | UNIQUE | - | - | Campo de datos |
| module | VARCHAR | 50 | No | FK | - | - | Campo de datos |
| description | TEXT | 65535 | Sí | - | - | - | Descripción detallada |
| is_active | TINYINT | 3 | No | FK | 1 | - | Estado activo/inactivo del registro |
| created_at | TIMESTAMP | - | No | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | - | on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | FK | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_deleted_at | No | BTREE | deleted_at |
| idx_is_active | No | BTREE | is_active |
| idx_module | No | BTREE | module |
| idx_slug | No | BTREE | slug |
| name | Sí | BTREE | name |
| PRIMARY | Sí | BTREE | id |
| slug | Sí | BTREE | slug |

---

### refresh_tokens 

**Tipo:** Tabla  
**Descripción:** Tokens de actualización para autenticación JWT  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| user_id | INT | 10 | No | FK | - | - | Referencia al usuario |
| token | TEXT | 65535 | No | - | - | - | Campo de datos |
| expires_at | TIMESTAMP | - | No | - | - | - | Campo de datos |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| revoked_at | TIMESTAMP | - | Sí | - | - | - | Campo de datos |
| last_used_at | TIMESTAMP | - | Sí | - | - | - | Campo de datos |
| last_used_ip | VARCHAR | 45 | Sí | - | - | - | Campo de datos |
| created_ip | VARCHAR | 45 | Sí | - | - | - | Campo de datos |
| created_user_agent | TEXT | 65535 | Sí | - | - | - | Campo de datos |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| refresh_tokens_ibfk_1 | user_id | users | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| PRIMARY | Sí | BTREE | id |
| user_id | No | BTREE | user_id |

---

### role_permissions 

**Tipo:** Tabla  
**Descripción:** Relación muchos a muchos entre roles y permisos  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| role_id | INT | 10 | No | FK | - | - | Referencia a la tabla role |
| permission_id | INT | 10 | No | FK | - | - | Referencia a la tabla permission |
| created_by | INT | 10 | Sí | - | - | - | Usuario que creó el registro |
| created_at | TIMESTAMP | - | No | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | - | on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| role_permissions_ibfk_1 | role_id | roles | id |
| role_permissions_ibfk_2 | permission_id | permissions | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_permission_id | No | BTREE | permission_id |
| idx_role_id | No | BTREE | role_id |
| PRIMARY | Sí | BTREE | id |
| unique_role_permission | Sí | BTREE | role_id, permission_id |

---

### roles 

**Tipo:** Tabla  
**Descripción:** Define los roles disponibles en el sistema  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| name | VARCHAR | 100 | No | - | - | - | Nombre descriptivo |
| slug | VARCHAR | 100 | No | UNIQUE | - | - | Campo de datos |
| description | TEXT | 65535 | Sí | - | - | - | Descripción detallada |
| is_active | TINYINT | 3 | No | FK | 1 | - | Estado activo/inactivo del registro |
| created_by | INT | 10 | Sí | - | - | - | Usuario que creó el registro |
| updated_by | INT | 10 | Sí | - | - | - | Usuario que actualizó el registro |
| deleted_by | INT | 10 | Sí | - | - | - | Campo de datos |
| created_at | TIMESTAMP | - | No | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | - | on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | FK | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_deleted_at | No | BTREE | deleted_at |
| idx_is_active | No | BTREE | is_active |
| idx_slug | No | BTREE | slug |
| PRIMARY | Sí | BTREE | id |
| slug | Sí | BTREE | slug |

---

### user_roles 

**Tipo:** Tabla  
**Descripción:** Relación muchos a muchos entre usuarios y roles  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| user_id | INT | 10 | No | FK | - | - | Referencia al usuario |
| role_id | INT | 10 | No | FK | - | - | Referencia a la tabla role |
| created_by | INT | 10 | Sí | - | - | - | Usuario que creó el registro |
| created_at | TIMESTAMP | - | No | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | - | on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| user_roles_ibfk_1 | user_id | users | id |
| user_roles_ibfk_2 | role_id | roles | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_role_id | No | BTREE | role_id |
| idx_user_id | No | BTREE | user_id |
| PRIMARY | Sí | BTREE | id |
| unique_user_role | Sí | BTREE | user_id, role_id |

---

### user_sessions 

**Tipo:** Tabla  
**Descripción:** Registro de sesiones activas de usuarios  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| user_id | INT | 10 | No | FK | - | - | Referencia al usuario |
| token | VARCHAR | 500 | No | FK | - | - | Campo de datos |
| refresh_token | VARCHAR | 500 | Sí | - | - | - | Campo de datos |
| ip_address | VARCHAR | 45 | Sí | - | - | - | Campo de datos |
| user_agent | TEXT | 65535 | Sí | - | - | - | Campo de datos |
| device_info | TEXT | 65535 | Sí | - | - | - | Campo de datos |
| is_active | TINYINT | 3 | Sí | FK | 1 | - | Estado activo/inactivo del registro |
| expires_at | TIMESTAMP | - | No | FK | - | - | Campo de datos |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| last_activity | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Campo de datos |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| user_sessions_ibfk_1 | user_id | users | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_expires_at | No | BTREE | expires_at |
| idx_is_active | No | BTREE | is_active |
| idx_token | No | BTREE | token |
| idx_user_id | No | BTREE | user_id |
| PRIMARY | Sí | BTREE | id |

---

### users 

**Tipo:** Tabla  
**Descripción:** Almacena la información de los usuarios del sistema  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| username | VARCHAR | 100 | Sí | UNIQUE | - | - | Campo de datos |
| email | VARCHAR | 255 | No | UNIQUE | - | - | Campo de datos |
| password | VARCHAR | 255 | No | - | - | - | Campo de datos |
| first_name | VARCHAR | 100 | No | - | - | - | Campo de datos |
| last_name | VARCHAR | 100 | No | - | - | - | Campo de datos |
| phone | VARCHAR | 20 | Sí | - | - | - | Campo de datos |
| avatar | VARCHAR | 255 | Sí | - | avatar-default.jpg | - | Campo de datos |
| role_id | INT | 10 | Sí | FK | 2 | - | Referencia a la tabla role |
| store_id | INT | 10 | Sí | FK | 1 | - | Referencia a la tabla store |
| status | ENUM | 9 | No | FK | active | - | Estado actual del registro |
| is_active | TINYINT | 3 | No | FK | 1 | - | Estado activo/inactivo del registro |
| last_login | TIMESTAMP | - | Sí | - | - | - | Campo de datos |
| email_verified_at | TIMESTAMP | - | Sí | - | - | - | Campo de datos |
| created_by | INT | 10 | Sí | - | - | - | Usuario que creó el registro |
| updated_by | INT | 10 | Sí | - | - | - | Usuario que actualizó el registro |
| deleted_by | INT | 10 | Sí | - | - | - | Campo de datos |
| created_at | TIMESTAMP | - | No | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | - | on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | FK | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| email | Sí | BTREE | email |
| idx_deleted_at | No | BTREE | deleted_at |
| idx_email | No | BTREE | email |
| idx_is_active | No | BTREE | is_active |
| idx_role_id | No | BTREE | role_id |
| idx_status | No | BTREE | status |
| idx_store_id | No | BTREE | store_id |
| idx_username | No | BTREE | username |
| PRIMARY | Sí | BTREE | id |
| username | Sí | BTREE | username |

---

### v_active_sessions (Vista)

**Tipo:** Vista  
**Descripción:** Vista de sesiones activas con información de usuario  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| session_id | INT | 10 | No | - | 0 | - | Referencia a la tabla session |
| user_id | INT | 10 | No | - | - | - | Referencia al usuario |
| username | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| email | VARCHAR | 255 | No | - | - | - | Campo de datos |
| ip_address | VARCHAR | 45 | Sí | - | - | - | Campo de datos |
| device_info | TEXT | 65535 | Sí | - | - | - | Campo de datos |
| logged_in_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Campo de datos |
| last_activity | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Campo de datos |
| expires_at | TIMESTAMP | - | No | - | - | - | Campo de datos |
| minutes_idle | BIGINT | 19 | Sí | - | - | - | Campo de datos |

---

## Recursos Humanos

### hr_departments 

**Tipo:** Tabla  
**Descripción:** Departamentos organizacionales de la empresa  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| nombre | VARCHAR | 100 | No | FK | - | - | Campo de datos |
| descripcion | TEXT | 65535 | Sí | - | - | - | Campo de datos |
| is_active | TINYINT | 3 | Sí | FK | 1 | - | Estado activo/inactivo del registro |
| created_by | INT | 10 | Sí | FK | - | - | Usuario que creó el registro |
| updated_by | INT | 10 | Sí | FK | - | - | Usuario que actualizó el registro |
| created_at | TIMESTAMP | - | Sí | FK | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | - | on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | FK | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| hr_departments_ibfk_1 | created_by | users | id |
| hr_departments_ibfk_2 | updated_by | users | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| created_by | No | BTREE | created_by |
| idx_created_at | No | BTREE | created_at |
| idx_deleted_at | No | BTREE | deleted_at |
| idx_is_active | No | BTREE | is_active |
| idx_nombre | No | BTREE | nombre |
| PRIMARY | Sí | BTREE | id |
| updated_by | No | BTREE | updated_by |

---

### hr_employees 

**Tipo:** Tabla  
**Descripción:** Información de empleados de la empresa  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| codigo | VARCHAR | 50 | Sí | UNIQUE | - | - | Campo de datos |
| nombre | VARCHAR | 100 | No | FK | - | - | Campo de datos |
| apellido | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| dni | VARCHAR | 20 | Sí | UNIQUE | - | - | Campo de datos |
| email | VARCHAR | 150 | Sí | UNIQUE | - | - | Campo de datos |
| telefono | VARCHAR | 20 | Sí | - | - | - | Campo de datos |
| licencia | VARCHAR | 50 | Sí | - | - | - | Campo de datos |
| department_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla department |
| position_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla position |
| fecha_ingreso | DATE | - | Sí | FK | - | - | Campo de datos |
| salario | DECIMAL | 15,2 | Sí | - | - | - | Campo de datos |
| is_active | TINYINT | 3 | Sí | FK | 1 | - | Estado activo/inactivo del registro |
| created_by | INT | 10 | Sí | FK | - | - | Usuario que creó el registro |
| updated_by | INT | 10 | Sí | FK | - | - | Usuario que actualizó el registro |
| created_at | TIMESTAMP | - | Sí | FK | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | - | on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | FK | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| hr_employees_ibfk_1 | department_id | hr_departments | id |
| hr_employees_ibfk_2 | position_id | hr_positions | id |
| hr_employees_ibfk_3 | created_by | users | id |
| hr_employees_ibfk_4 | updated_by | users | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| codigo | Sí | BTREE | codigo |
| created_by | No | BTREE | created_by |
| email | Sí | BTREE | email |
| idx_codigo | No | BTREE | codigo |
| idx_created_at | No | BTREE | created_at |
| idx_deleted_at | No | BTREE | deleted_at |
| idx_department_id | No | BTREE | department_id |
| idx_dni | Sí | BTREE | dni |
| idx_email | No | BTREE | email |
| idx_fecha_ingreso | No | BTREE | fecha_ingreso |
| idx_is_active | No | BTREE | is_active |
| idx_nombre | No | BTREE | nombre, apellido |
| idx_position_id | No | BTREE | position_id |
| PRIMARY | Sí | BTREE | id |
| updated_by | No | BTREE | updated_by |

---

### hr_positions 

**Tipo:** Tabla  
**Descripción:** Puestos o cargos laborales disponibles  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| nombre | VARCHAR | 100 | No | FK | - | - | Campo de datos |
| descripcion | TEXT | 65535 | Sí | - | - | - | Campo de datos |
| department_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla department |
| is_active | TINYINT | 3 | Sí | FK | 1 | - | Estado activo/inactivo del registro |
| created_by | INT | 10 | Sí | FK | - | - | Usuario que creó el registro |
| updated_by | INT | 10 | Sí | FK | - | - | Usuario que actualizó el registro |
| created_at | TIMESTAMP | - | Sí | FK | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | - | on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | FK | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| hr_positions_ibfk_1 | department_id | hr_departments | id |
| hr_positions_ibfk_2 | created_by | users | id |
| hr_positions_ibfk_3 | updated_by | users | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| created_by | No | BTREE | created_by |
| idx_created_at | No | BTREE | created_at |
| idx_deleted_at | No | BTREE | deleted_at |
| idx_department_id | No | BTREE | department_id |
| idx_is_active | No | BTREE | is_active |
| idx_nombre | No | BTREE | nombre |
| PRIMARY | Sí | BTREE | id |
| updated_by | No | BTREE | updated_by |

---

### vw_department_summary (Vista)

**Tipo:** Vista  
**Descripción:** Vista resumen de departamentos con cantidad de empleados  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | - | 0 | - | Identificador único autoincremental |
| nombre | VARCHAR | 100 | No | - | - | - | Campo de datos |
| descripcion | TEXT | 65535 | Sí | - | - | - | Campo de datos |
| is_active | TINYINT | 3 | Sí | - | 1 | - | Estado activo/inactivo del registro |
| total_positions | BIGINT | 19 | No | - | 0 | - | Monto en unidades monetarias |
| total_employees | BIGINT | 19 | No | - | 0 | - | Monto en unidades monetarias |
| active_employees | BIGINT | 19 | No | - | 0 | - | Campo de datos |
| avg_salary | DECIMAL | 19,6 | Sí | - | - | - | Campo de datos |
| total_payroll | DECIMAL | 37,2 | Sí | - | - | - | Monto en unidades monetarias |

---

### vw_employees_full (Vista)

**Tipo:** Vista  
**Descripción:** Vista completa de empleados con departamento y puesto  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | - | 0 | - | Identificador único autoincremental |
| codigo | VARCHAR | 50 | Sí | - | - | - | Campo de datos |
| nombre_completo | VARCHAR | 201 | No | - |  | - | Campo de datos |
| nombre | VARCHAR | 100 | No | - | - | - | Campo de datos |
| apellido | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| email | VARCHAR | 150 | Sí | - | - | - | Campo de datos |
| telefono | VARCHAR | 20 | Sí | - | - | - | Campo de datos |
| fecha_ingreso | DATE | - | Sí | - | - | - | Campo de datos |
| salario | DECIMAL | 15,2 | Sí | - | - | - | Campo de datos |
| is_active | TINYINT | 3 | Sí | - | 1 | - | Estado activo/inactivo del registro |
| department_id | INT | 10 | Sí | - | 0 | - | Referencia a la tabla department |
| department_name | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| position_id | INT | 10 | Sí | - | 0 | - | Referencia a la tabla position |
| position_name | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| years_worked | BIGINT | 19 | Sí | - | - | - | Campo de datos |
| months_worked | BIGINT | 19 | Sí | - | - | - | Campo de datos |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | - | on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |

---

### vw_position_summary (Vista)

**Tipo:** Vista  
**Descripción:** Vista resumen de puestos con cantidad de empleados  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | - | 0 | - | Identificador único autoincremental |
| nombre | VARCHAR | 100 | No | - | - | - | Campo de datos |
| descripcion | TEXT | 65535 | Sí | - | - | - | Campo de datos |
| is_active | TINYINT | 3 | Sí | - | 1 | - | Estado activo/inactivo del registro |
| department_id | INT | 10 | Sí | - | 0 | - | Referencia a la tabla department |
| department_name | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| total_employees | BIGINT | 19 | No | - | 0 | - | Monto en unidades monetarias |
| active_employees | BIGINT | 19 | No | - | 0 | - | Campo de datos |
| avg_salary | DECIMAL | 19,6 | Sí | - | - | - | Campo de datos |
| min_salary | DECIMAL | 15,2 | Sí | - | - | - | Campo de datos |
| max_salary | DECIMAL | 15,2 | Sí | - | - | - | Campo de datos |

---

## Productos e Inventario

### brands 

**Tipo:** Tabla  
**Descripción:** Marcas de productos  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| name | VARCHAR | 100 | No | - | - | - | Nombre descriptivo |
| logo_url | VARCHAR | 500 | Sí | - | - | - | Campo de datos |
| is_active | TINYINT | 3 | Sí | FK | 1 | - | Estado activo/inactivo del registro |
| created_by | INT | 10 | Sí | FK | - | - | Usuario que creó el registro |
| updated_by | INT | 10 | Sí | FK | - | - | Usuario que actualizó el registro |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | - | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| brands_ibfk_1 | created_by | users | id |
| brands_ibfk_2 | updated_by | users | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| created_by | No | BTREE | created_by |
| idx_brands_is_active | No | BTREE | is_active |
| PRIMARY | Sí | BTREE | id |
| updated_by | No | BTREE | updated_by |

---

### categories 

**Tipo:** Tabla  
**Descripción:** Categorías principales de productos  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| name | VARCHAR | 100 | No | - | - | - | Nombre descriptivo |
| image_url | VARCHAR | 500 | Sí | - | - | - | Campo de datos |
| is_active | TINYINT | 3 | Sí | FK | 1 | - | Estado activo/inactivo del registro |
| created_by | INT | 10 | Sí | - | - | - | Usuario que creó el registro |
| updated_by | INT | 10 | Sí | - | - | - | Usuario que actualizó el registro |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | - | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_categories_is_active | No | BTREE | is_active |
| PRIMARY | Sí | BTREE | id |

---

### product_prices 

**Tipo:** Tabla  
**Descripción:** Historial de precios de productos  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| product_id | INT | 10 | No | FK | - | - | Referencia a la tabla product |
| store_id | INT | 10 | No | FK | - | - | Referencia a la tabla store |
| price_type | ENUM | 9 | No | - | - | - | Monto en unidades monetarias |
| price | DECIMAL | 15,2 | No | - | - | - | Monto en unidades monetarias |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| product_prices_ibfk_1 | product_id | products | id |
| product_prices_ibfk_2 | store_id | stores | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_prices_product | No | BTREE | product_id |
| idx_prices_store | No | BTREE | store_id |
| PRIMARY | Sí | BTREE | id |
| unique_product_store_type | Sí | BTREE | product_id, store_id, price_type |

---

### products 

**Tipo:** Tabla  
**Descripción:** Catálogo de productos disponibles para venta  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| name | VARCHAR | 200 | No | FK | - | - | Nombre descriptivo |
| short_name | VARCHAR | 200 | Sí | - | - | - | Campo de datos |
| code | VARCHAR | 50 | No | UNIQUE | - | - | Código único |
| barcode | VARCHAR | 100 | Sí | FK | - | - | Campo de datos |
| category_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla category |
| subcategory_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla subcategory |
| brand_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla brand |
| cost | DECIMAL | 10,2 | Sí | - | 0.00 | - | Campo de datos |
| price_1 | DECIMAL | 10,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| price_2 | DECIMAL | 10,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| price_3 | DECIMAL | 10,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| price_4 | DECIMAL | 10,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| price_5 | DECIMAL | 10,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| price_6 | DECIMAL | 10,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| stock | DECIMAL | 10,2 | Sí | - | 0.00 | - | Campo de datos |
| fractional | TINYINT | 3 | Sí | - | 0 | - | Campo de datos |
| tax_rate | DECIMAL | 5,2 | Sí | - | 0.00 | - | Campo de datos |
| tax_rate_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla tax_rate |
| is_active | TINYINT | 3 | Sí | - | 1 | - | Estado activo/inactivo del registro |
| supplier_id | VARCHAR | 36 | Sí | FK | - | - | Referencia a la tabla supplier |
| description | TEXT | 65535 | Sí | - | - | - | Descripción detallada |
| unit | VARCHAR | 20 | Sí | - | Unidad | - | Campo de datos |
| min_stock | INT | 10 | Sí | - | 0 | - | Campo de datos |
| max_stock | INT | 10 | Sí | - | 1000 | - | Campo de datos |
| status | ENUM | 12 | Sí | FK | active | - | Estado actual del registro |
| image | VARCHAR | 500 | Sí | - | - | - | Campo de datos |
| weight | DECIMAL | 10,3 | Sí | - | - | - | Campo de datos |
| dimensions | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| created_by | INT | 10 | Sí | FK | - | - | Usuario que creó el registro |
| updated_by | INT | 10 | Sí | FK | - | - | Usuario que actualizó el registro |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | - | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| fk_products_subcategory | subcategory_id | subcategories | id |
| products_ibfk_3 | created_by | users | id |
| products_ibfk_4 | updated_by | users | id |
| products_ibfk_5 | tax_rate_id | tax_rates | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| code | Sí | BTREE | code |
| created_by | No | BTREE | created_by |
| idx_products_barcode | No | BTREE | barcode |
| idx_products_brand_id | No | BTREE | brand_id |
| idx_products_category | No | BTREE | category_id |
| idx_products_code | No | BTREE | code |
| idx_products_name | No | BTREE | name |
| idx_products_status | No | BTREE | status |
| idx_products_subcategory_id | No | BTREE | subcategory_id |
| idx_products_supplier | No | BTREE | supplier_id |
| idx_tax_rate_id | No | BTREE | tax_rate_id |
| PRIMARY | Sí | BTREE | id |
| updated_by | No | BTREE | updated_by |

---

### stock 

**Tipo:** Tabla  
**Descripción:** Inventario actual de productos por ubicación  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| product_id | INT | 10 | No | FK | - | - | Referencia a la tabla product |
| store_id | INT | 10 | No | FK | - | - | Referencia a la tabla store |
| warehouse_id | INT | 10 | Sí | - | 1 | - | Referencia a la tabla warehouse |
| quantity | DECIMAL | 15,3 | No | - | 0.000 | - | Campo de datos |
| reserved_quantity | DECIMAL | 15,3 | Sí | - | 0.000 | - | Campo de datos |
| last_updated | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha de last updated |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| stock_ibfk_1 | product_id | products | id |
| stock_ibfk_2 | store_id | stores | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_stock_product | No | BTREE | product_id |
| idx_stock_store | No | BTREE | store_id |
| PRIMARY | Sí | BTREE | id |
| unique_product_store_warehouse | Sí | BTREE | product_id, store_id, warehouse_id |

---

### stock_movements 

**Tipo:** Tabla  
**Descripción:** Registro de movimientos de inventario  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| product_id | INT | 10 | No | FK | - | - | Referencia a la tabla product |
| store_id | INT | 10 | No | FK | - | - | Referencia a la tabla store |
| warehouse_id | INT | 10 | No | FK | - | - | Referencia a la tabla warehouse |
| movement_type | ENUM | 14 | No | FK | - | - | Campo de datos |
| quantity | DECIMAL | 15,3 | No | - | - | - | Campo de datos |
| previous_quantity | DECIMAL | 15,3 | Sí | - | - | - | Campo de datos |
| new_quantity | DECIMAL | 15,3 | Sí | - | - | - | Campo de datos |
| reference_id | INT | 10 | Sí | - | - | - | Referencia a la tabla reference |
| reference_type | VARCHAR | 50 | Sí | FK | - | - | sale, purchase, transfer, etc. |
| reason | VARCHAR | 255 | Sí | - | - | - | Campo de datos |
| notes | TEXT | 65535 | Sí | - | - | - | Notas o comentarios adicionales |
| created_by | INT | 10 | Sí | FK | - | - | Usuario que creó el registro |
| created_at | TIMESTAMP | - | Sí | FK | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| stock_movements_ibfk_1 | product_id | products | id |
| stock_movements_ibfk_2 | store_id | stores | id |
| stock_movements_ibfk_3 | warehouse_id | warehouses | id |
| stock_movements_ibfk_4 | created_by | users | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| created_by | No | BTREE | created_by |
| idx_movements_date | No | BTREE | created_at |
| idx_movements_product | No | BTREE | product_id |
| idx_movements_product_date | No | BTREE | product_id, created_at |
| idx_movements_reference | No | BTREE | reference_type, reference_id |
| idx_movements_reporting | No | BTREE | store_id, created_at, movement_type |
| idx_movements_store | No | BTREE | store_id |
| idx_movements_type | No | BTREE | movement_type |
| idx_movements_warehouse | No | BTREE | warehouse_id |
| PRIMARY | Sí | BTREE | id |

---

### stores 

**Tipo:** Tabla  
**Descripción:** Tiendas o puntos de venta  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| name | VARCHAR | 100 | No | - | - | - | Nombre descriptivo |
| code | VARCHAR | 20 | No | UNIQUE | - | - | Código único |
| address | TEXT | 65535 | Sí | - | - | - | Campo de datos |
| city | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| state | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| country | VARCHAR | 100 | Sí | - | Honduras | - | Campo de datos |
| phone | VARCHAR | 20 | Sí | - | - | - | Campo de datos |
| email | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| manager_id | INT | 10 | Sí | - | - | - | Referencia a la tabla manager |
| is_active | TINYINT | 3 | Sí | FK | 1 | - | Estado activo/inactivo del registro |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | - | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| code | Sí | BTREE | code |
| idx_stores_code | No | BTREE | code |
| idx_stores_is_active | No | BTREE | is_active |
| PRIMARY | Sí | BTREE | id |

---

### subcategories 

**Tipo:** Tabla  
**Descripción:** Subcategorías de productos  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| name | VARCHAR | 255 | No | - | - | - | Nombre descriptivo |
| category_id | INT | 10 | No | FK | - | - | FK a categories |
| image_url | VARCHAR | 500 | Sí | - | - | - | Campo de datos |
| is_active | TINYINT | 3 | No | - | 1 | - | Estado activo/inactivo del registro |
| created_by | INT | 10 | Sí | - | - | - | Usuario que creó el registro |
| updated_by | INT | 10 | Sí | - | - | - | Usuario que actualizó el registro |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | - | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| fk_subcategories_category | category_id | categories | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_subcategories_category_id | No | BTREE | category_id |
| PRIMARY | Sí | BTREE | id |

---

### units 

**Tipo:** Tabla  
**Descripción:** Unidades de medida (piezas, kg, litros, etc.)  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| name | VARCHAR | 100 | No | - | - | - | Nombre de la unidad (ej: UNIDAD, CAJA, METRO CUADRADO) |
| description | TEXT | 65535 | Sí | - | - | - | Descripción de la unidad |
| is_active | TINYINT | 3 | No | FK | 1 | - | Estado activo/inactivo |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | - | on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | FK | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| PRIMARY | Sí | BTREE | id |
| units_deleted_at_idx | No | BTREE | deleted_at |
| units_is_active_idx | No | BTREE | is_active |

---

### v_stock_movements_summary (Vista)

**Tipo:** Vista  
**Descripción:** Vista resumen de movimientos de stock  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| product_id | INT | 10 | No | - | 0 | - | Referencia a la tabla product |
| product_name | VARCHAR | 200 | No | - | - | - | Campo de datos |
| product_code | VARCHAR | 50 | No | - | - | - | Campo de datos |
| movement_type | ENUM | 14 | No | - | - | - | Campo de datos |
| movement_count | BIGINT | 19 | No | - | 0 | - | Campo de datos |
| total_quantity | DECIMAL | 37,3 | Sí | - | - | - | Monto en unidades monetarias |
| first_movement | TIMESTAMP | - | Sí | - | - | - | Campo de datos |
| last_movement | TIMESTAMP | - | Sí | - | - | - | Campo de datos |

---

### warehouses 

**Tipo:** Tabla  
**Descripción:** Almacenes o bodegas de la empresa  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| nombre | VARCHAR | 100 | No | - | - | - | Campo de datos |
| encargado | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| ubicacion | VARCHAR | 255 | Sí | - | - | - | Campo de datos |
| is_active | TINYINT | 3 | Sí | - | 1 | - | Estado activo/inactivo del registro |
| created_by | INT | 10 | Sí | FK | - | - | Usuario que creó el registro |
| updated_by | INT | 10 | Sí | FK | - | - | Usuario que actualizó el registro |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | - | on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | - | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| fk_warehouses_created_by | created_by | users | id |
| fk_warehouses_updated_by | updated_by | users | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| fk_warehouses_created_by | No | BTREE | created_by |
| fk_warehouses_updated_by | No | BTREE | updated_by |
| PRIMARY | Sí | BTREE | id |

---

## Clientes y Proveedores

### beneficiary_types 

**Tipo:** Tabla  
**Descripción:** Tipos de beneficiarios (clientes, proveedores, empleados)  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| nombre | VARCHAR | 100 | No | - | - | - | Campo de datos |
| is_active | TINYINT | 3 | Sí | FK | 1 | - | Estado activo/inactivo del registro |
| created_by | INT | 10 | Sí | FK | - | - | Usuario que creó el registro |
| updated_by | INT | 10 | Sí | FK | - | - | Usuario que actualizó el registro |
| deleted_by | INT | 10 | Sí | FK | - | - | Campo de datos |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | - | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| fk_beneficiary_types_created_by | created_by | users | id |
| fk_beneficiary_types_deleted_by | deleted_by | users | id |
| fk_beneficiary_types_updated_by | updated_by | users | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_created_by | No | BTREE | created_by |
| idx_deleted_by | No | BTREE | deleted_by |
| idx_is_active | No | BTREE | is_active |
| idx_updated_by | No | BTREE | updated_by |
| PRIMARY | Sí | BTREE | id |

---

### customers 

**Tipo:** Tabla  
**Descripción:** Base de datos de clientes  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| codigo | VARCHAR | 20 | No | UNIQUE | - | - | Campo de datos |
| nombre | VARCHAR | 200 | No | FK | - | - | Nombre del cliente |
| email | VARCHAR | 100 | Sí | FK | - | - | Campo de datos |
| nombre_comercial | VARCHAR | 200 | Sí | - | - | - | Nombre comercial |
| codigo_tipo_precio | VARCHAR | 10 | Sí | - | - | - | C├│digo tipo de precio |
| fecha_inicio | DATE | - | Sí | - | - | - | Fecha de inicio |
| doc_identificacion | VARCHAR | 20 | Sí | FK | - | - | RTN/DNI |
| telefono | VARCHAR | 20 | Sí | - | - | - | Tel├®fono |
| direccion | TEXT | 65535 | Sí | - | - | - | Direcci├│n |
| descuento_prc | DECIMAL | 5,2 | Sí | - | 0.00 | - | Porcentaje de descuento |
| persona_contacto | VARCHAR | 100 | Sí | - | - | - | Persona de contacto |
| tipo_beneficiario | INT | 10 | Sí | FK | - | - | Campo de datos |
| is_active | TINYINT | 3 | Sí | - | 1 | - | Activo |
| created_by | INT | 10 | Sí | FK | - | - | Usuario que creó el registro |
| updated_by | INT | 10 | Sí | FK | - | - | Usuario que actualizó el registro |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | - | - | - | Fecha y hora de eliminación lógica (soft delete) |
| deleted_by | INT | 10 | Sí | - | - | - | Campo de datos |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| customers_ibfk_1 | created_by | users | id |
| customers_ibfk_2 | updated_by | users | id |
| fk_customers_beneficiary_type | tipo_beneficiario | beneficiary_types | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| codigo | Sí | BTREE | codigo |
| created_by | No | BTREE | created_by |
| fk_customers_beneficiary_type | No | BTREE | tipo_beneficiario |
| idx_codigo | No | BTREE | codigo |
| idx_customers_email | No | BTREE | email |
| idx_doc_identificacion | No | BTREE | doc_identificacion |
| idx_nombre | No | BTREE | nombre |
| PRIMARY | Sí | BTREE | id |
| updated_by | No | BTREE | updated_by |

---

### suppliers 

**Tipo:** Tabla  
**Descripción:** Proveedores de productos  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| nombre | VARCHAR | 200 | No | FK | - | - | Nombre del proveedor |
| tipo_proveedor | VARCHAR | 50 | Sí | - | - | - | Tipo de proveedor |
| doc_identificacion | VARCHAR | 20 | Sí | FK | - | - | RTN/DNI |
| usa_credito | TINYINT | 3 | Sí | - | 0 | - | Usa cr├®dito |
| tipo_beneficiario | INT | 10 | Sí | FK | - | - | Campo de datos |
| is_active | TINYINT | 3 | Sí | FK | 1 | - | Activo |
| created_by | INT | 10 | Sí | FK | - | - | Usuario que creó el registro |
| updated_by | INT | 10 | Sí | FK | - | - | Usuario que actualizó el registro |
| deleted_by | INT | 10 | Sí | FK | - | - | Campo de datos |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | - | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| fk_suppliers_beneficiary_type | tipo_beneficiario | beneficiary_types | id |
| fk_suppliers_deleted_by | deleted_by | users | id |
| suppliers_ibfk_1 | created_by | users | id |
| suppliers_ibfk_2 | updated_by | users | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| created_by | No | BTREE | created_by |
| fk_suppliers_beneficiary_type | No | BTREE | tipo_beneficiario |
| fk_suppliers_deleted_by | No | BTREE | deleted_by |
| idx_doc_identificacion | No | BTREE | doc_identificacion |
| idx_nombre | No | BTREE | nombre |
| idx_suppliers_is_active | No | BTREE | is_active |
| PRIMARY | Sí | BTREE | id |
| updated_by | No | BTREE | updated_by |

---

## Ventas

### quote_items 

**Tipo:** Tabla  
**Descripción:** Detalles de productos en cotizaciones  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| quote_id | INT | 10 | No | FK | - | - | Referencia a la tabla quote |
| product_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla product |
| product_code | VARCHAR | 50 | Sí | - | - | - | Campo de datos |
| product_name | VARCHAR | 255 | No | - | - | - | Campo de datos |
| quantity | DECIMAL | 10,2 | No | - | - | - | Campo de datos |
| unit_price | DECIMAL | 15,2 | No | - | - | - | Monto en unidades monetarias |
| discount_value | DECIMAL | 15,2 | Sí | - | 0.00 | - | Campo de datos |
| tax_rate | DECIMAL | 5,2 | Sí | - | 0.00 | - | Campo de datos |
| warehouse_id | INT | 10 | Sí | - | - | - | Referencia a la tabla warehouse |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| quote_items_ibfk_1 | quote_id | quotes | id |
| quote_items_ibfk_2 | product_id | products | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_quote | No | BTREE | quote_id |
| PRIMARY | Sí | BTREE | id |
| product_id | No | BTREE | product_id |

---

### quotes 

**Tipo:** Tabla  
**Descripción:** Cotizaciones generadas para clientes  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| quote_number | VARCHAR | 50 | No | FK | - | - | N├║mero de cotizaci├│n COTIZACION 0000000001 |
| customer_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla customer |
| customer_name | VARCHAR | 255 | No | - | - | - | Campo de datos |
| customer_rtn | VARCHAR | 50 | Sí | - | - | - | Campo de datos |
| customer_phone | VARCHAR | 50 | Sí | - | - | - | Campo de datos |
| customer_email | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| branch_id | INT | 10 | Sí | - | - | - | Referencia a la tabla branch |
| warehouse_id | INT | 10 | Sí | - | - | - | Referencia a la tabla warehouse |
| seller_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla seller |
| seller_name | VARCHAR | 255 | Sí | - | - | - | Campo de datos |
| subtotal | DECIMAL | 15,2 | No | - | 0.00 | - | Monto en unidades monetarias |
| discount | DECIMAL | 15,2 | Sí | - | 0.00 | - | Campo de datos |
| tax | DECIMAL | 15,2 | No | - | 0.00 | - | Campo de datos |
| total | DECIMAL | 15,2 | No | - | - | - | Monto en unidades monetarias |
| surcharge | DECIMAL | 15,2 | No | - | 0.00 | - | Campo de datos |
| quote_date | DATE | - | No | FK | - | - | Fecha de quote |
| valid_until | DATE | - | Sí | - | - | - | V├ílida hasta |
| notes | TEXT | 65535 | Sí | - | - | - | Notas o comentarios adicionales |
| terms_conditions | TEXT | 65535 | Sí | - | - | - | T├®rminos y condiciones |
| status | ENUM | 9 | Sí | FK | pending | - | Estado actual del registro |
| converted_to_invoice_id | INT | 10 | Sí | - | - | - | ID de factura si fue convertida |
| created_by | INT | 10 | Sí | FK | - | - | Usuario que creó el registro |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | - | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| quotes_ibfk_1 | customer_id | customers | id |
| quotes_ibfk_2 | created_by | users | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| created_by | No | BTREE | created_by |
| idx_customer | No | BTREE | customer_id |
| idx_quote_date | No | BTREE | quote_date |
| idx_quote_number | No | BTREE | quote_number |
| idx_seller | No | BTREE | seller_id |
| idx_status | No | BTREE | status |
| PRIMARY | Sí | BTREE | id |

---

### sale_items 

**Tipo:** Tabla  
**Descripción:** Detalles de productos vendidos en cada venta  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| sale_id | INT | 10 | No | FK | - | - | Referencia a la tabla sale |
| product_id | INT | 10 | No | FK | - | - | Referencia a la tabla product |
| quantity | DECIMAL | 15,3 | No | - | - | - | Campo de datos |
| unit_price | DECIMAL | 15,2 | No | - | - | - | Monto en unidades monetarias |
| discount | DECIMAL | 15,2 | Sí | - | 0.00 | - | Campo de datos |
| tax | DECIMAL | 15,2 | Sí | - | 0.00 | - | Campo de datos |
| subtotal | DECIMAL | 15,2 | No | - | - | - | Monto en unidades monetarias |
| total | DECIMAL | 15,2 | No | - | - | - | Monto en unidades monetarias |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| sale_items_ibfk_1 | sale_id | sales | id |
| sale_items_ibfk_2 | product_id | products | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_sale_items_product | No | BTREE | product_id |
| idx_sale_items_sale | No | BTREE | sale_id |
| PRIMARY | Sí | BTREE | id |

---

### sales 

**Tipo:** Tabla  
**Descripción:** Registro de ventas realizadas  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| sale_number | VARCHAR | 50 | No | UNIQUE | - | - | Campo de datos |
| customer_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla customer |
| user_id | INT | 10 | No | FK | - | - | Referencia al usuario |
| store_id | INT | 10 | No | FK | - | - | Referencia a la tabla store |
| sale_date | TIMESTAMP | - | Sí | FK | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha de sale |
| subtotal | DECIMAL | 15,2 | No | - | - | - | Monto en unidades monetarias |
| tax | DECIMAL | 15,2 | Sí | - | 0.00 | - | Campo de datos |
| discount | DECIMAL | 15,2 | Sí | - | 0.00 | - | Campo de datos |
| total | DECIMAL | 15,2 | No | - | - | - | Monto en unidades monetarias |
| status | ENUM | 9 | Sí | FK | completed | - | Estado actual del registro |
| payment_status | ENUM | 8 | Sí | - | paid | - | Campo de datos |
| notes | TEXT | 65535 | Sí | - | - | - | Notas o comentarios adicionales |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| sales_ibfk_1 | customer_id | customers | id |
| sales_ibfk_2 | user_id | users | id |
| sales_ibfk_3 | store_id | stores | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_sales_customer | No | BTREE | customer_id |
| idx_sales_date | No | BTREE | sale_date |
| idx_sales_number | No | BTREE | sale_number |
| idx_sales_status | No | BTREE | status |
| idx_sales_store | No | BTREE | store_id |
| idx_sales_user | No | BTREE | user_id |
| PRIMARY | Sí | BTREE | id |
| sale_number | Sí | BTREE | sale_number |

---

### sales_return_items 

**Tipo:** Tabla  
**Descripción:** Detalles de productos devueltos  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| sales_return_id | INT | 10 | No | FK | - | - | Referencia a la tabla sales_return |
| product_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla product |
| product_name | VARCHAR | 255 | No | - | - | - | Campo de datos |
| quantity | DECIMAL | 10,2 | No | - | - | - | Campo de datos |
| unit_price | DECIMAL | 15,2 | No | - | - | - | Monto en unidades monetarias |
| discount_value | DECIMAL | 10,2 | Sí | - | 0.00 | - | Campo de datos |
| tax_rate | DECIMAL | 5,2 | Sí | - | 0.00 | - | Campo de datos |
| warehouse_id | INT | 10 | Sí | - | - | - | Referencia a la tabla warehouse |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| sales_return_items_ibfk_1 | sales_return_id | sales_returns | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_product_id | No | BTREE | product_id |
| idx_sales_return_id | No | BTREE | sales_return_id |
| PRIMARY | Sí | BTREE | id |

---

### sales_returns 

**Tipo:** Tabla  
**Descripción:** Devoluciones de ventas  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| invoice_id | INT | 10 | No | FK | - | - | Referencia a la tabla invoice |
| invoice_number | VARCHAR | 50 | No | - | - | - | Campo de datos |
| customer_id | INT | 10 | Sí | - | - | - | Referencia a la tabla customer |
| customer_name | VARCHAR | 255 | Sí | - | - | - | Campo de datos |
| return_type | ENUM | 7 | No | - | total | - | Campo de datos |
| correlative | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| emission_date | DATE | - | No | FK | - | - | Fecha de emission |
| notes | TEXT | 65535 | Sí | - | - | - | Notas o comentarios adicionales |
| credit_note_resolution_id | INT | 10 | Sí | - | - | - | Referencia a la tabla credit_note_resolution |
| credit_note_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla credit_note |
| return_money | TINYINT | 3 | Sí | - | 1 | - | Campo de datos |
| affect_sales_book | TINYINT | 3 | Sí | - | 1 | - | Campo de datos |
| subtotal | DECIMAL | 15,2 | No | - | 0.00 | - | Monto en unidades monetarias |
| discount | DECIMAL | 15,2 | Sí | - | 0.00 | - | Campo de datos |
| tax | DECIMAL | 15,2 | No | - | 0.00 | - | Campo de datos |
| total | DECIMAL | 15,2 | No | - | - | - | Monto en unidades monetarias |
| created_by | INT | 10 | Sí | - | - | - | Usuario que creó el registro |
| created_at | TIMESTAMP | - | Sí | FK | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_created_at | No | BTREE | created_at |
| idx_credit_note_id | No | BTREE | credit_note_id |
| idx_emission_date | No | BTREE | emission_date |
| idx_invoice_id | No | BTREE | invoice_id |
| PRIMARY | Sí | BTREE | id |

---

## Compras

### purchase_items 

**Tipo:** Tabla  
**Descripción:** Detalles de productos comprados  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| purchase_id | INT | 10 | No | FK | - | - | Referencia a la tabla purchase |
| product_id | INT | 10 | No | FK | - | - | Referencia a la tabla product |
| quantity | DECIMAL | 15,3 | No | - | - | - | Campo de datos |
| unit_price | DECIMAL | 15,2 | No | - | - | - | Monto en unidades monetarias |
| discount | DECIMAL | 15,2 | Sí | - | 0.00 | - | Campo de datos |
| tax | DECIMAL | 15,2 | Sí | - | 0.00 | - | Campo de datos |
| subtotal | DECIMAL | 15,2 | No | - | - | - | Monto en unidades monetarias |
| total | DECIMAL | 15,2 | No | - | - | - | Monto en unidades monetarias |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| purchase_items_ibfk_1 | purchase_id | purchases | id |
| purchase_items_ibfk_2 | product_id | products | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_purchase_items_product | No | BTREE | product_id |
| idx_purchase_items_purchase | No | BTREE | purchase_id |
| PRIMARY | Sí | BTREE | id |

---

### purchases 

**Tipo:** Tabla  
**Descripción:** Registro de compras a proveedores  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| purchase_number | VARCHAR | 50 | No | UNIQUE | - | - | Campo de datos |
| supplier_id | INT | 10 | No | FK | - | - | Referencia a la tabla supplier |
| user_id | INT | 10 | No | FK | - | - | Referencia al usuario |
| store_id | INT | 10 | No | FK | - | - | Referencia a la tabla store |
| purchase_date | TIMESTAMP | - | Sí | FK | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha de purchase |
| subtotal | DECIMAL | 15,2 | No | - | - | - | Monto en unidades monetarias |
| tax | DECIMAL | 15,2 | Sí | - | 0.00 | - | Campo de datos |
| discount | DECIMAL | 15,2 | Sí | - | 0.00 | - | Campo de datos |
| total | DECIMAL | 15,2 | No | - | - | - | Monto en unidades monetarias |
| status | ENUM | 9 | Sí | FK | pending | - | Estado actual del registro |
| payment_status | ENUM | 7 | Sí | - | pending | - | Campo de datos |
| notes | TEXT | 65535 | Sí | - | - | - | Notas o comentarios adicionales |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| purchases_ibfk_1 | supplier_id | suppliers | id |
| purchases_ibfk_2 | user_id | users | id |
| purchases_ibfk_3 | store_id | stores | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_purchases_date | No | BTREE | purchase_date |
| idx_purchases_number | No | BTREE | purchase_number |
| idx_purchases_status | No | BTREE | status |
| idx_purchases_store | No | BTREE | store_id |
| idx_purchases_supplier | No | BTREE | supplier_id |
| idx_purchases_user | No | BTREE | user_id |
| PRIMARY | Sí | BTREE | id |
| purchase_number | Sí | BTREE | purchase_number |

---

### purchases_documents 

**Tipo:** Tabla  
**Descripción:** Documentos relacionados con compras  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| purchase_number | VARCHAR | 50 | No | UNIQUE | - | - | Campo de datos |
| document_type | ENUM | 12 | Sí | - | FACTURA | - | Campo de datos |
| purchase_date | DATE | - | No | FK | - | - | Fecha de purchase |
| agency | VARCHAR | 100 | Sí | - | AGENCIA PRINCIPAL | - | Campo de datos |
| resolution | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| affected_document | VARCHAR | 50 | Sí | - | - | - | Campo de datos |
| supplier_name | VARCHAR | 200 | No | FK | - | - | Campo de datos |
| supplier_id_number | VARCHAR | 50 | Sí | - | - | - | Campo de datos |
| buyer_name | VARCHAR | 100 | No | - | - | - | Campo de datos |
| status | ENUM | 9 | Sí | FK | Completed | - | Estado actual del registro |
| payment_status | ENUM | 7 | Sí | FK | Unpaid | - | Campo de datos |
| net_amount | DECIMAL | 12,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| tax_amount | DECIMAL | 12,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| retention_amount | DECIMAL | 12,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| discount_amount | DECIMAL | 12,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| surcharge_amount | DECIMAL | 12,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| total_amount | DECIMAL | 12,2 | No | - | - | - | Monto en unidades monetarias |
| returned_amount | DECIMAL | 12,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| paid_amount | DECIMAL | 12,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| balance_amount | DECIMAL | 12,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| warehouse_id | INT | 10 | Sí | - | - | - | Referencia a la tabla warehouse |
| notes | TEXT | 65535 | Sí | - | - | - | Notas o comentarios adicionales |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_payment_status | No | BTREE | payment_status |
| idx_purchase_date | No | BTREE | purchase_date |
| idx_purchase_number | No | BTREE | purchase_number |
| idx_status | No | BTREE | status |
| idx_supplier_name | No | BTREE | supplier_name |
| PRIMARY | Sí | BTREE | id |
| purchase_number | Sí | BTREE | purchase_number |

---

### purchases_documents_items 

**Tipo:** Tabla  
**Descripción:** Ítems de documentos de compras  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| purchase_id | INT | 10 | No | FK | - | - | Referencia a la tabla purchase |
| product_id | INT | 10 | Sí | - | - | - | Referencia a la tabla product |
| product_code | VARCHAR | 50 | Sí | FK | - | - | Campo de datos |
| product_name | VARCHAR | 200 | No | - | - | - | Campo de datos |
| quantity | DECIMAL | 10,2 | No | - | - | - | Campo de datos |
| unit_price | DECIMAL | 12,2 | No | - | - | - | Monto en unidades monetarias |
| discount_percentage | DECIMAL | 5,2 | Sí | - | 0.00 | - | Campo de datos |
| discount_amount | DECIMAL | 12,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| tax_percentage | DECIMAL | 5,2 | Sí | - | 0.00 | - | Campo de datos |
| tax_amount | DECIMAL | 12,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| subtotal | DECIMAL | 12,2 | No | - | - | - | Monto en unidades monetarias |
| total | DECIMAL | 12,2 | No | - | - | - | Monto en unidades monetarias |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| purchases_documents_items_ibfk_1 | purchase_id | purchases_documents | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_product_code | No | BTREE | product_code |
| idx_purchase_id | No | BTREE | purchase_id |
| PRIMARY | Sí | BTREE | id |

---

### purchases_returns 

**Tipo:** Tabla  
**Descripción:** Devoluciones de compras a proveedores  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| return_number | VARCHAR | 50 | No | UNIQUE | - | - | Campo de datos |
| purchase_id | INT | 10 | No | FK | - | - | Referencia a la tabla purchase |
| purchase_number | VARCHAR | 50 | No | - | - | - | Campo de datos |
| return_date | DATE | - | No | FK | - | - | Fecha de return |
| supplier_name | VARCHAR | 200 | No | - | - | - | Campo de datos |
| supplier_id_number | VARCHAR | 50 | Sí | - | - | - | Campo de datos |
| reason | TEXT | 65535 | Sí | - | - | - | Campo de datos |
| status | ENUM | 9 | Sí | FK | Pending | - | Estado actual del registro |
| total_amount | DECIMAL | 12,2 | No | - | - | - | Monto en unidades monetarias |
| refund_status | ENUM | 9 | Sí | - | Pending | - | Campo de datos |
| refunded_amount | DECIMAL | 12,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| notes | TEXT | 65535 | Sí | - | - | - | Notas o comentarios adicionales |
| created_by | INT | 10 | Sí | - | - | - | Usuario que creó el registro |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| purchases_returns_ibfk_1 | purchase_id | purchases_documents | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_purchase_id | No | BTREE | purchase_id |
| idx_return_date | No | BTREE | return_date |
| idx_return_number | No | BTREE | return_number |
| idx_status | No | BTREE | status |
| PRIMARY | Sí | BTREE | id |
| return_number | Sí | BTREE | return_number |

---

### purchases_returns_items 

**Tipo:** Tabla  
**Descripción:** Detalles de productos devueltos a proveedores  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| return_id | INT | 10 | No | FK | - | - | Referencia a la tabla return |
| product_id | INT | 10 | Sí | - | - | - | Referencia a la tabla product |
| product_code | VARCHAR | 50 | Sí | FK | - | - | Campo de datos |
| product_name | VARCHAR | 200 | No | - | - | - | Campo de datos |
| quantity | DECIMAL | 10,2 | No | - | - | - | Campo de datos |
| unit_price | DECIMAL | 12,2 | No | - | - | - | Monto en unidades monetarias |
| discount_amount | DECIMAL | 12,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| tax_amount | DECIMAL | 12,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| subtotal | DECIMAL | 12,2 | No | - | - | - | Monto en unidades monetarias |
| total | DECIMAL | 12,2 | No | - | - | - | Monto en unidades monetarias |
| reason | TEXT | 65535 | Sí | - | - | - | Campo de datos |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| purchases_returns_items_ibfk_1 | return_id | purchases_returns | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_product_code | No | BTREE | product_code |
| idx_return_id | No | BTREE | return_id |
| PRIMARY | Sí | BTREE | id |

---

## Facturación

### billing_settings 

**Tipo:** Tabla  
**Descripción:** Configuración general de facturación  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| company_name | VARCHAR | 255 | No | - | - | - | Campo de datos |
| commercial_name | VARCHAR | 255 | Sí | - | - | - | Campo de datos |
| facebook | VARCHAR | 255 | Sí | - | - | - | Campo de datos |
| instagram | VARCHAR | 255 | Sí | - | - | - | Campo de datos |
| twitter | VARCHAR | 255 | Sí | - | - | - | Campo de datos |
| whatsapp | VARCHAR | 20 | Sí | - | - | - | Campo de datos |
| country | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| state | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| city | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| sector | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| company_logo_path | VARCHAR | 500 | Sí | - | - | - | Campo de datos |
| company_rtn | VARCHAR | 50 | Sí | - | - | - | Campo de datos |
| company_address | TEXT | 65535 | Sí | - | - | - | Campo de datos |
| company_phone | VARCHAR | 20 | Sí | - | - | - | Campo de datos |
| company_email | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| company_logo | VARCHAR | 255 | Sí | - | - | - | Campo de datos |
| company_website | VARCHAR | 255 | Sí | - | - | - | Campo de datos |
| invoice_prefix | VARCHAR | 10 | Sí | - | FAC | - | Campo de datos |
| last_invoice_number | INT | 10 | Sí | - | 0 | - | Campo de datos |
| invoice_number_length | INT | 10 | Sí | - | 6 | - | Campo de datos |
| credit_note_prefix | VARCHAR | 10 | Sí | - | NC | - | Campo de datos |
| last_credit_note_number | INT | 10 | Sí | - | 0 | - | Campo de datos |
| default_payment_terms | INT | 10 | Sí | - | 30 | - | Campo de datos |
| default_tax_rate | DECIMAL | 5,2 | Sí | - | 15.00 | - | Campo de datos |
| default_currency | VARCHAR | 3 | Sí | - | HNL | - | Campo de datos |
| enable_auto_email | TINYINT | 3 | Sí | - | 1 | - | Campo de datos |
| email_subject | VARCHAR | 255 | Sí | - | Nueva Factura | - | Campo de datos |
| email_body | TEXT | 65535 | Sí | - | - | - | Campo de datos |
| show_company_logo | TINYINT | 3 | Sí | - | 1 | - | Campo de datos |
| show_tax_breakdown | TINYINT | 3 | Sí | - | 1 | - | Campo de datos |
| invoice_footer_text | TEXT | 65535 | Sí | - | - | - | Campo de datos |
| invoice_notes | TEXT | 65535 | Sí | - | - | - | Campo de datos |
| created_by | INT | 10 | Sí | FK | - | - | Usuario que creó el registro |
| updated_by | INT | 10 | Sí | FK | - | - | Usuario que actualizó el registro |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| timezone | VARCHAR | 50 | Sí | - | America/Tegucigalpa | - | Campo de datos |
| date_format | VARCHAR | 20 | Sí | - | DD/MM/YYYY | - | Fecha de date format |
| time_format | VARCHAR | 10 | Sí | - | 12 | - | Campo de datos |
| financial_year | INT | 10 | Sí | - | 2025 | - | Campo de datos |
| starting_month | INT | 10 | Sí | - | 1 | - | Campo de datos |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| billing_settings_ibfk_1 | created_by | users | id |
| billing_settings_ibfk_2 | updated_by | users | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| created_by | No | BTREE | created_by |
| PRIMARY | Sí | BTREE | id |
| updated_by | No | BTREE | updated_by |

---

### credit_note_items 

**Tipo:** Tabla  
**Descripción:** Detalles de notas de crédito  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| credit_note_id | INT | 10 | No | FK | - | - | Referencia a la tabla credit_note |
| product_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla product |
| product_code | VARCHAR | 50 | Sí | - | - | - | Campo de datos |
| product_name | VARCHAR | 255 | Sí | - | - | - | Campo de datos |
| quantity | DECIMAL | 10,2 | No | - | - | - | Campo de datos |
| unit_price | DECIMAL | 10,2 | No | - | - | - | Monto en unidades monetarias |
| discount_value | DECIMAL | 10,2 | Sí | - | 0.00 | - | Campo de datos |
| tax_rate | DECIMAL | 5,2 | Sí | - | 0.00 | - | Campo de datos |
| subtotal | DECIMAL | 10,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| total | DECIMAL | 10,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| credit_note_items_ibfk_1 | credit_note_id | credit_notes | id |
| credit_note_items_ibfk_2 | product_id | products | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| credit_note_id | No | BTREE | credit_note_id |
| PRIMARY | Sí | BTREE | id |
| product_id | No | BTREE | product_id |

---

### credit_notes 

**Tipo:** Tabla  
**Descripción:** Notas de crédito emitidas  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| correlative | VARCHAR | 50 | No | - | - | - | NC-000001 |
| credit_note_number | VARCHAR | 50 | Sí | - | - | - | Número de resolución |
| invoice_id | INT | 10 | No | FK | - | - | Referencia a la tabla invoice |
| invoice_number | VARCHAR | 50 | Sí | - | - | - | Campo de datos |
| sales_return_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla sales_return |
| customer_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla customer |
| customer_name | VARCHAR | 255 | Sí | - | - | - | Campo de datos |
| customer_rtn | VARCHAR | 50 | Sí | - | - | - | Campo de datos |
| emission_date | DATE | - | No | - | - | - | Fecha de emission |
| resolution_id | INT | 10 | Sí | - | - | - | Referencia a la tabla resolution |
| cai | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| authorization_number | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| start_range | VARCHAR | 50 | Sí | - | - | - | Campo de datos |
| end_range | VARCHAR | 50 | Sí | - | - | - | Campo de datos |
| notes | TEXT | 65535 | Sí | - | - | - | Notas o comentarios adicionales |
| subtotal | DECIMAL | 10,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| discount | DECIMAL | 10,2 | Sí | - | 0.00 | - | Campo de datos |
| tax | DECIMAL | 10,2 | Sí | - | 0.00 | - | Campo de datos |
| total | DECIMAL | 10,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| created_by | INT | 10 | Sí | - | - | - | Usuario que creó el registro |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | - | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| credit_notes_ibfk_1 | invoice_id | invoices | id |
| credit_notes_ibfk_2 | sales_return_id | sales_returns | id |
| credit_notes_ibfk_3 | customer_id | customers | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| customer_id | No | BTREE | customer_id |
| invoice_id | No | BTREE | invoice_id |
| PRIMARY | Sí | BTREE | id |
| sales_return_id | No | BTREE | sales_return_id |

---

### invoice_items 

**Tipo:** Tabla  
**Descripción:** Detalles de productos en facturas  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| invoice_id | INT | 10 | No | FK | - | - | Referencia a la tabla invoice |
| product_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla product |
| product_name | VARCHAR | 255 | No | - | - | - | Campo de datos |
| product_sku | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| quantity | DECIMAL | 10,2 | No | - | - | - | Campo de datos |
| unit_price | DECIMAL | 15,2 | No | - | - | - | Monto en unidades monetarias |
| discount_type | ENUM | 10 | Sí | - | - | - | Campo de datos |
| discount_value | DECIMAL | 10,2 | Sí | - | 0.00 | - | Campo de datos |
| discount_amount | DECIMAL | 15,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| tax_rate | DECIMAL | 5,2 | Sí | - | 0.00 | - | Campo de datos |
| tax_amount | DECIMAL | 15,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| subtotal | DECIMAL | 15,2 | No | - | - | - | Monto en unidades monetarias |
| line_total | DECIMAL | 15,2 | No | - | - | - | Monto en unidades monetarias |
| notes | TEXT | 65535 | Sí | - | - | - | Notas o comentarios adicionales |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| invoice_items_ibfk_1 | invoice_id | invoices | id |
| invoice_items_ibfk_2 | product_id | products | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_invoice | No | BTREE | invoice_id |
| idx_product | No | BTREE | product_id |
| PRIMARY | Sí | BTREE | id |

---

### invoice_payments 

**Tipo:** Tabla  
**Descripción:** Pagos recibidos por facturas  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| invoice_id | INT | 10 | No | FK | - | - | Referencia a la tabla invoice |
| payment_date | DATETIME | - | No | FK | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha de payment |
| amount | DECIMAL | 15,2 | No | - | - | - | Monto en unidades monetarias |
| payment_method | VARCHAR | 50 | No | - | - | - | Campo de datos |
| reference_number | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| bank_account_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla bank_account |
| notes | TEXT | 65535 | Sí | - | - | - | Notas o comentarios adicionales |
| receipt_number | VARCHAR | 50 | Sí | - | - | - | Campo de datos |
| created_by | INT | 10 | Sí | FK | - | - | Usuario que creó el registro |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | FK | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| invoice_payments_ibfk_1 | invoice_id | invoices | id |
| invoice_payments_ibfk_2 | bank_account_id | bank_accounts | id |
| invoice_payments_ibfk_3 | created_by | users | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| bank_account_id | No | BTREE | bank_account_id |
| created_by | No | BTREE | created_by |
| idx_deleted_at | No | BTREE | deleted_at |
| idx_invoice | No | BTREE | invoice_id |
| idx_payment_date | No | BTREE | payment_date |
| PRIMARY | Sí | BTREE | id |

---

### invoices 

**Tipo:** Tabla  
**Descripción:** Facturas emitidas  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| invoice_number | VARCHAR | 50 | No | UNIQUE | - | - | Campo de datos |
| invoice_type | ENUM | 19 | No | - | factura | - | Campo de datos |
| customer_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla customer |
| customer_name | VARCHAR | 255 | No | - | - | - | Campo de datos |
| customer_rtn | VARCHAR | 50 | Sí | - | - | - | Campo de datos |
| issue_date | DATETIME | - | No | FK | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha de issue |
| warehouse_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla warehouse |
| seller_id | INT | 10 | Sí | - | - | - | Referencia a la tabla seller |
| seller_name | VARCHAR | 255 | Sí | - | - | - | Campo de datos |
| subtotal | DECIMAL | 15,2 | No | - | 0.00 | - | Monto en unidades monetarias |
| discount_type | ENUM | 10 | Sí | - | - | - | Campo de datos |
| discount_value | DECIMAL | 10,2 | Sí | - | 0.00 | - | Campo de datos |
| discount_amount | DECIMAL | 15,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| tax_rate | DECIMAL | 5,2 | Sí | - | 0.00 | - | Campo de datos |
| tax_amount | DECIMAL | 15,2 | No | - | 0.00 | - | Monto en unidades monetarias |
| shipping_cost | DECIMAL | 10,2 | Sí | - | 0.00 | - | Campo de datos |
| total | DECIMAL | 15,2 | No | - | - | - | Monto en unidades monetarias |
| payment_status | ENUM | 9 | No | FK | pending | - | Campo de datos |
| paid_amount | DECIMAL | 15,2 | Sí | - | 0.00 | - | Monto en unidades monetarias |
| resolution_id | INT | 10 | Sí | - | - | - | Referencia a la tabla resolution |
| resolution_number | VARCHAR | 50 | Sí | - | - | - | Campo de datos |
| status | ENUM | 9 | No | FK | issued | - | Estado actual del registro |
| created_by | INT | 10 | Sí | FK | - | - | Usuario que creó el registro |
| updated_by | INT | 10 | Sí | FK | - | - | Usuario que actualizó el registro |
| created_at | TIMESTAMP | - | Sí | FK | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | FK | - | - | Fecha y hora de eliminación lógica (soft delete) |
| balance_due | DECIMAL | 12,2 | Sí | - | 0.00 | - | Campo de datos |
| is_credit | TINYINT | 3 | Sí | - | 0 | - | Indica si credit |
| payment_terms_days | INT | 10 | Sí | - | 0 | - | Campo de datos |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| invoices_ibfk_1 | customer_id | customers | id |
| invoices_ibfk_2 | warehouse_id | warehouses | id |
| invoices_ibfk_3 | created_by | users | id |
| invoices_ibfk_4 | updated_by | users | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| created_by | No | BTREE | created_by |
| idx_created_at | No | BTREE | created_at |
| idx_customer | No | BTREE | customer_id |
| idx_deleted_at | No | BTREE | deleted_at |
| idx_invoice_number | No | BTREE | invoice_number |
| idx_issue_date | No | BTREE | issue_date |
| idx_payment_status | No | BTREE | payment_status |
| idx_status | No | BTREE | status |
| invoice_number | Sí | BTREE | invoice_number |
| PRIMARY | Sí | BTREE | id |
| updated_by | No | BTREE | updated_by |
| warehouse_id | No | BTREE | warehouse_id |

---

### pending_invoice_items 

**Tipo:** Tabla  
**Descripción:** Detalles de facturas pendientes  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| pending_invoice_id | INT | 10 | No | FK | - | - | Referencia a la tabla pending_invoice |
| product_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla product |
| product_code | VARCHAR | 50 | Sí | - | - | - | Campo de datos |
| product_name | VARCHAR | 255 | No | - | - | - | Campo de datos |
| quantity | DECIMAL | 10,2 | No | - | - | - | Campo de datos |
| unit_price | DECIMAL | 15,2 | No | - | - | - | Monto en unidades monetarias |
| discount_value | DECIMAL | 15,2 | Sí | - | 0.00 | - | Campo de datos |
| tax_rate | DECIMAL | 5,2 | Sí | - | 0.00 | - | Campo de datos |
| warehouse_id | INT | 10 | Sí | - | - | - | Referencia a la tabla warehouse |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| pending_invoice_items_ibfk_1 | pending_invoice_id | pending_invoices | id |
| pending_invoice_items_ibfk_2 | product_id | products | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_pending_invoice | No | BTREE | pending_invoice_id |
| PRIMARY | Sí | BTREE | id |
| product_id | No | BTREE | product_id |

---

### pending_invoices 

**Tipo:** Tabla  
**Descripción:** Facturas pendientes de emisión  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| document_number | VARCHAR | 50 | No | FK | - | - | N├║mero de documento FACT EN ESPERA 0000000001 |
| customer_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla customer |
| customer_name | VARCHAR | 255 | No | - | - | - | Campo de datos |
| customer_rtn | VARCHAR | 50 | Sí | - | - | - | Campo de datos |
| customer_phone | VARCHAR | 50 | Sí | - | - | - | Campo de datos |
| customer_email | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| branch_id | INT | 10 | Sí | - | - | - | Referencia a la tabla branch |
| warehouse_id | INT | 10 | Sí | - | - | - | Referencia a la tabla warehouse |
| seller_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla seller |
| seller_name | VARCHAR | 255 | Sí | - | - | - | Campo de datos |
| subtotal | DECIMAL | 15,2 | No | - | 0.00 | - | Monto en unidades monetarias |
| discount | DECIMAL | 15,2 | Sí | - | 0.00 | - | Campo de datos |
| tax | DECIMAL | 15,2 | No | - | 0.00 | - | Campo de datos |
| total | DECIMAL | 15,2 | No | - | - | - | Monto en unidades monetarias |
| surcharge | DECIMAL | 15,2 | No | - | 0.00 | - | Campo de datos |
| notes | TEXT | 65535 | Sí | - | - | - | Notas o comentarios adicionales |
| internal_notes | TEXT | 65535 | Sí | - | - | - | Notas internas del vendedor |
| created_by | INT | 10 | Sí | FK | - | - | Usuario que creó el registro |
| created_at | TIMESTAMP | - | Sí | FK | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| expires_at | DATE | - | Sí | - | - | - | Fecha de expiraci├│n del documento |
| deleted_at | TIMESTAMP | - | Sí | - | - | - | Fecha y hora de eliminación lógica (soft delete) |
| updated_at | TIMESTAMP | - | Sí | - | - | on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| pending_invoices_ibfk_1 | customer_id | customers | id |
| pending_invoices_ibfk_2 | created_by | users | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| created_by | No | BTREE | created_by |
| idx_created_at | No | BTREE | created_at |
| idx_customer | No | BTREE | customer_id |
| idx_document_number | No | BTREE | document_number |
| idx_seller | No | BTREE | seller_id |
| PRIMARY | Sí | BTREE | id |

---

### resolutions 

**Tipo:** Tabla  
**Descripción:** Resoluciones de facturación autorizadas por entidad tributaria  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| numero_resolucion | VARCHAR | 100 | No | UNIQUE | - | - | N├║mero de resoluci├│n de la DIAN |
| cai | VARCHAR | 255 | Sí | - | - | - | Campo de datos |
| prefijo_control | VARCHAR | 50 | Sí | - | - | - | Campo de datos |
| fecha_inicio | DATE | - | No | FK | - | - | Fecha de inicio de vigencia |
| fecha_fin | DATE | - | No | - | - | - | Fecha de fin de vigencia |
| is_active | TINYINT | 3 | Sí | FK | 1 | - | 1 = activa, 0 = inactiva |
| notas | TEXT | 65535 | Sí | - | - | - | Notas adicionales sobre la resoluci├│n |
| nro_inicial_control | INT | 10 | No | - | 0 | - | N├║mero inicial de control |
| nro_final_control | INT | 10 | No | - | 0 | - | N├║mero final de control |
| nro_actual_control | INT | 10 | No | - | 0 | - | N├║mero actual de control |
| sufijo_control | VARCHAR | 10 | Sí | - | - | - | Sufijo de control |
| nro_critico | INT | 10 | Sí | - | 0 | - | N├║mero cr├¡tico para alerta |
| alertar_dias_antes | INT | 10 | Sí | - | 6 | - | D├¡as antes de vencer para alertar |
| alertar_porcentaje_uso | INT | 10 | Sí | - | 99 | - | Porcentaje de uso para alertar |
| alertar_en_nro_control | INT | 10 | Sí | - | 0 | - | Alertar en n├║mero de control espec├¡fico |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | FK | - | - | Fecha y hora de eliminación lógica (soft delete) |
| created_by | INT | 10 | Sí | - | - | - | Usuario que creó el registro |
| updated_by | INT | 10 | Sí | - | - | - | Usuario que actualizó el registro |
| deleted_by | INT | 10 | Sí | - | - | - | Campo de datos |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_resolutions_active | No | BTREE | is_active |
| idx_resolutions_deleted | No | BTREE | deleted_at |
| idx_resolutions_numero | No | BTREE | numero_resolucion |
| idx_resolutions_vigencia | No | BTREE | fecha_inicio, fecha_fin |
| numero_resolucion | Sí | BTREE | numero_resolucion |
| PRIMARY | Sí | BTREE | id |

---

## Envíos

### shipment_items 

**Tipo:** Tabla  
**Descripción:** Detalles de productos en cada envío  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| shipment_id | INT | 10 | No | FK | - | - | Referencia a la tabla shipment |
| product_id | INT | 10 | Sí | - | - | - | ID del producto |
| product_name | VARCHAR | 255 | No | - | - | - | Nombre del producto |
| product_code | VARCHAR | 100 | Sí | - | - | - | C├│digo del producto |
| quantity | DECIMAL | 10,2 | No | - | 1.00 | - | Campo de datos |
| unit | VARCHAR | 50 | Sí | - | - | - | Unidad de medida |
| weight | DECIMAL | 10,2 | Sí | - | - | - | Peso unitario |
| description | TEXT | 65535 | Sí | - | - | - | Descripci├│n del ├¡tem |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| shipment_items_ibfk_1 | shipment_id | shipments | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_shipment | No | BTREE | shipment_id |
| PRIMARY | Sí | BTREE | id |

---

### shipments 

**Tipo:** Tabla  
**Descripción:** Registro de envíos realizados  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| shipment_number | VARCHAR | 50 | No | UNIQUE | - | - | N├║mero de gu├¡a de remisi├│n |
| invoice_id | INT | 10 | Sí | - | - | - | Referencia a factura si aplica |
| sale_id | INT | 10 | Sí | - | - | - | Referencia a venta si aplica |
| document_type | ENUM | 19 | Sí | - | guia_remision | - | Campo de datos |
| status | ENUM | 9 | Sí | FK | pendiente | - | Estado actual del registro |
| customer_id | INT | 10 | Sí | FK | - | - | ID del cliente |
| customer_name | VARCHAR | 255 | No | - | - | - | Nombre del cliente |
| customer_phone | VARCHAR | 20 | Sí | - | - | - | Tel├®fono del cliente |
| customer_document | VARCHAR | 50 | Sí | - | - | - | Documento del cliente |
| receiver_name | VARCHAR | 255 | No | - | - | - | Nombre de quien recibe |
| receiver_phone | VARCHAR | 20 | No | - | - | - | Tel├®fono de quien recibe |
| receiver_id_document | VARCHAR | 50 | Sí | - | - | - | Documento de identidad de quien recibe |
| receiver_alt_name | VARCHAR | 255 | Sí | - | - | - | Nombre alternativo de receptor |
| receiver_alt_phone | VARCHAR | 20 | Sí | - | - | - | Tel├®fono alternativo de receptor |
| receiver_alt_id_document | VARCHAR | 50 | Sí | - | - | - | Documento alternativo |
| receiver_alt2_name | VARCHAR | 255 | Sí | - | - | - | Segundo nombre alternativo |
| receiver_alt2_phone | VARCHAR | 20 | Sí | - | - | - | Segundo tel├®fono alternativo |
| receiver_alt2_id_document | VARCHAR | 50 | Sí | - | - | - | Segundo documento alternativo |
| origin_warehouse_id | INT | 10 | Sí | - | - | - | ID de bodega de origen |
| origin_warehouse_name | VARCHAR | 255 | Sí | - | - | - | Nombre de bodega de origen |
| origin_branch_id | INT | 10 | Sí | - | - | - | ID de sucursal de origen |
| origin_address | TEXT | 65535 | No | - | - | - | Direcci├│n de partida completa |
| origin_city | VARCHAR | 100 | Sí | - | - | - | Ciudad de origen |
| origin_state | VARCHAR | 100 | Sí | - | - | - | Estado/Departamento de origen |
| origin_country | VARCHAR | 100 | Sí | - | Honduras | - | Campo de datos |
| destination_address | TEXT | 65535 | No | - | - | - | Direcci├│n de destino completa |
| destination_reference | TEXT | 65535 | Sí | - | - | - | Referencias adicionales del lugar |
| destination_city | VARCHAR | 100 | Sí | - | - | - | Ciudad de destino |
| destination_state | VARCHAR | 100 | Sí | - | - | - | Estado/Departamento destino |
| destination_country | VARCHAR | 100 | Sí | - | Honduras | - | Campo de datos |
| destination_coordinates | VARCHAR | 100 | Sí | - | - | - | Coordenadas GPS si aplica |
| driver_name | VARCHAR | 255 | Sí | - | - | - | Nombre del conductor |
| driver_phone | VARCHAR | 20 | Sí | - | - | - | Tel├®fono del conductor |
| driver_id | VARCHAR | 50 | Sí | - | - | - | C├®dula del conductor |
| driver_license | VARCHAR | 50 | Sí | - | - | - | Licencia de conducir |
| driver_employee_id | INT | 10 | Sí | - | - | - | Referencia a la tabla driver_employee |
| assistant_employee_id | INT | 10 | Sí | - | - | - | Referencia a la tabla assistant_employee |
| assistant_name | VARCHAR | 255 | Sí | - | - | - | Campo de datos |
| assistant_phone | VARCHAR | 20 | Sí | - | - | - | Campo de datos |
| vehicle_id | INT | 10 | Sí | - | - | - | ID del veh├¡culo |
| vehicle_plate | VARCHAR | 20 | Sí | - | - | - | Placa del veh├¡culo |
| vehicle_type | VARCHAR | 50 | Sí | - | - | - | Tipo de veh├¡culo |
| vehicle_brand | VARCHAR | 50 | Sí | - | - | - | Marca del veh├¡culo |
| vehicle_model | VARCHAR | 50 | Sí | - | - | - | Modelo del veh├¡culo |
| emission_date | DATE | - | No | FK | - | - | Fecha de emisi├│n |
| estimated_delivery_date | DATE | - | Sí | FK | - | - | Fecha estimada de entrega |
| actual_delivery_date | DATETIME | - | Sí | - | - | - | Fecha real de entrega |
| departure_time | TIME | - | Sí | - | - | - | Hora de salida |
| arrival_time | TIME | - | Sí | - | - | - | Hora de llegada |
| notes | TEXT | 65535 | Sí | - | - | - | Notas adicionales |
| special_instructions | TEXT | 65535 | Sí | - | - | - | Instrucciones especiales |
| package_quantity | INT | 10 | Sí | - | 1 | - | Cantidad de paquetes |
| total_weight | DECIMAL | 10,2 | Sí | - | - | - | Peso total en kg |
| declared_value | DECIMAL | 15,2 | Sí | - | - | - | Valor declarado de la mercanc├¡a |
| created_by | INT | 10 | Sí | - | - | - | Usuario que cre├│ el env├¡o |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| delivered_by | INT | 10 | Sí | - | - | - | Usuario que marc├│ como entregado |
| signature_url | VARCHAR | 255 | Sí | - | - | - | URL de firma de recibido |
| photo_url | VARCHAR | 255 | Sí | - | - | - | URL de foto de evidencia |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_customer | No | BTREE | customer_id |
| idx_delivery_date | No | BTREE | estimated_delivery_date |
| idx_emission_date | No | BTREE | emission_date |
| idx_shipment_number | No | BTREE | shipment_number |
| idx_status | No | BTREE | status |
| PRIMARY | Sí | BTREE | id |
| shipment_number | Sí | BTREE | shipment_number |

---

### vehicles 

**Tipo:** Tabla  
**Descripción:** Vehículos utilizados para envíos  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| placa | VARCHAR | 50 | No | FK | - | - | Campo de datos |
| marca | VARCHAR | 100 | No | FK | - | - | Campo de datos |
| modelo | VARCHAR | 100 | No | - | - | - | Campo de datos |
| color | VARCHAR | 50 | No | - | - | - | Campo de datos |
| is_active | TINYINT | 3 | Sí | FK | 1 | - | Estado activo/inactivo del registro |
| created_by | INT | 10 | Sí | - | - | - | Usuario que creó el registro |
| updated_by | INT | 10 | Sí | - | - | - | Usuario que actualizó el registro |
| deleted_by | INT | 10 | Sí | - | - | - | Campo de datos |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | FK | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_deleted_at | No | BTREE | deleted_at |
| idx_is_active | No | BTREE | is_active |
| idx_marca | No | BTREE | marca |
| idx_placa | No | BTREE | placa |
| PRIMARY | Sí | BTREE | id |

---

## Promociones y Ofertas

### coupon_products 

**Tipo:** Tabla  
**Descripción:** Productos aplicables a cada cupón  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| coupon_id | INT | 10 | No | FK | - | - | Referencia a la tabla coupon |
| product_id | INT | 10 | No | FK | - | - | Referencia a la tabla product |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| fk_coupon_products_coupon | coupon_id | coupons | id |
| fk_coupon_products_product | product_id | products | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| idx_coupon_id | No | BTREE | coupon_id |
| idx_product_id | No | BTREE | product_id |
| PRIMARY | Sí | BTREE | id |
| unique_coupon_product | Sí | BTREE | coupon_id, product_id |

---

### coupons 

**Tipo:** Tabla  
**Descripción:** Cupones de descuento y promociones  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| codigo | VARCHAR | 50 | No | UNIQUE | - | - | Campo de datos |
| nombre | VARCHAR | 200 | No | - | - | - | Campo de datos |
| tipo_descuento | ENUM | 10 | No | - | porcentaje | - | Campo de datos |
| valor_descuento | DECIMAL | 10,2 | No | - | 0.00 | - | Campo de datos |
| fecha_desde | DATE | - | No | FK | - | - | Campo de datos |
| fecha_hasta | DATE | - | No | FK | - | - | Campo de datos |
| aplicar_a | ENUM | 19 | No | - | grupo | - | Campo de datos |
| grupo_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla grupo |
| subgrupo_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla subgrupo |
| articulo_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla articulo |
| suspendido | TINYINT | 3 | Sí | - | 0 | - | Campo de datos |
| is_active | TINYINT | 3 | Sí | FK | 1 | - | Estado activo/inactivo del registro |
| created_by | INT | 10 | Sí | FK | - | - | Usuario que creó el registro |
| updated_by | INT | 10 | Sí | FK | - | - | Usuario que actualizó el registro |
| deleted_by | INT | 10 | Sí | FK | - | - | Campo de datos |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | FK | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| fk_coupons_articulo | articulo_id | products | id |
| fk_coupons_created_by | created_by | users | id |
| fk_coupons_deleted_by | deleted_by | users | id |
| fk_coupons_grupo | grupo_id | categories | id |
| fk_coupons_subgrupo | subgrupo_id | subcategories | id |
| fk_coupons_updated_by | updated_by | users | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| codigo | Sí | BTREE | codigo |
| fk_coupons_articulo | No | BTREE | articulo_id |
| fk_coupons_created_by | No | BTREE | created_by |
| fk_coupons_deleted_by | No | BTREE | deleted_by |
| fk_coupons_grupo | No | BTREE | grupo_id |
| fk_coupons_subgrupo | No | BTREE | subgrupo_id |
| fk_coupons_updated_by | No | BTREE | updated_by |
| idx_codigo | No | BTREE | codigo |
| idx_deleted_at | No | BTREE | deleted_at |
| idx_fecha_desde | No | BTREE | fecha_desde |
| idx_fecha_hasta | No | BTREE | fecha_hasta |
| idx_is_active | No | BTREE | is_active |
| PRIMARY | Sí | BTREE | id |

---

## Pagos y Finanzas

### bank_accounts 

**Tipo:** Tabla  
**Descripción:** Cuentas bancarias de la empresa  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| banco | VARCHAR | 100 | No | FK | - | - | Nombre del banco |
| tipo_cuenta | VARCHAR | 50 | No | - | - | - | Tipo de cuenta (Cuenta de Ahorro, Cuenta de Cheques) |
| moneda | VARCHAR | 50 | No | FK | - | - | Moneda de la cuenta (Lempiras, D├│lares, etc.) |
| numero_cuenta | VARCHAR | 50 | No | - | - | - | N├║mero de cuenta bancaria |
| titular | VARCHAR | 200 | No | - | - | - | Titular de la cuenta |
| imagen_banco | VARCHAR | 255 | Sí | - | - | - | URL o path de la imagen del banco |
| is_active | TINYINT | 3 | Sí | FK | 1 | - | 1 = Activa, 0 = Inactiva |
| is_default | TINYINT | 3 | Sí | FK | 0 | - | 1 = Cuenta por defecto, 0 = No |
| created_by | INT | 10 | Sí | FK | - | - | Usuario que creó el registro |
| updated_by | INT | 10 | Sí | FK | - | - | Usuario que actualizó el registro |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | - | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| bank_accounts_ibfk_1 | created_by | users | id |
| bank_accounts_ibfk_2 | updated_by | users | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| created_by | No | BTREE | created_by |
| idx_banco | No | BTREE | banco |
| idx_is_active | No | BTREE | is_active |
| idx_is_default | No | BTREE | is_default |
| idx_moneda | No | BTREE | moneda |
| PRIMARY | Sí | BTREE | id |
| updated_by | No | BTREE | updated_by |

---

### currencies 

**Tipo:** Tabla  
**Descripción:** Monedas soportadas por el sistema  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | ID autoincrementable |
| simbolo | VARCHAR | 10 | No | UNIQUE | - | - | S├¡mbolo de la moneda (ej: L, US$) |
| factor_cambio | DECIMAL | 12,8 | No | - | 0.00000000 | - | Factor de conversi├│n |
| extranjera | TINYINT | 3 | No | FK | 0 | - | 0 = Local, 1 = Extranjera |
| multiplicar_dividir | TINYINT | 3 | No | - | 0 | - | 0 = Dividir, 1 = Multiplicar |
| plural | VARCHAR | 50 | No | - | - | - | Nombre plural (ej: LEMPIRAS) |
| singular | VARCHAR | 50 | No | - | - | - | Nombre singular (ej: LEMPIRA) |
| is_active | TINYINT | 3 | Sí | FK | 1 | - | 1 = Activa, 0 = Inactiva |
| is_default | TINYINT | 3 | Sí | FK | 0 | - | 1 = Moneda por defecto, 0 = No |
| created_by | INT | 10 | Sí | FK | - | - | Usuario que creó el registro |
| updated_by | INT | 10 | Sí | FK | - | - | Usuario que actualizó el registro |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | - | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| currencies_ibfk_1 | created_by | users | id |
| currencies_ibfk_2 | updated_by | users | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| created_by | No | BTREE | created_by |
| idx_extranjera | No | BTREE | extranjera |
| idx_is_active | No | BTREE | is_active |
| idx_is_default | No | BTREE | is_default |
| PRIMARY | Sí | BTREE | id |
| unique_simbolo | Sí | BTREE | simbolo |
| updated_by | No | BTREE | updated_by |

---

### payment_methods 

**Tipo:** Tabla  
**Descripción:** Métodos de pago disponibles (efectivo, tarjeta, transferencia)  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| name | VARCHAR | 50 | No | - | - | - | Nombre descriptivo |
| code | VARCHAR | 20 | No | UNIQUE | - | - | Código único |
| description | TEXT | 65535 | Sí | - | - | - | Descripción detallada |
| is_active | TINYINT | 3 | Sí | FK | 1 | - | Estado activo/inactivo del registro |
| requires_reference | TINYINT | 3 | Sí | - | 0 | - | Campo de datos |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| code | Sí | BTREE | code |
| idx_payment_methods_code | No | BTREE | code |
| idx_payment_methods_is_active | No | BTREE | is_active |
| PRIMARY | Sí | BTREE | id |

---

### tax_rates 

**Tipo:** Tabla  
**Descripción:** Tasas de impuestos aplicables  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| name | VARCHAR | 100 | No | UNIQUE | - | - | Nombre de la tasa (ej: ISV 15%) |
| rate | DECIMAL | 5,2 | No | - | - | - | Porcentaje de impuesto (ej: 15.00) |
| description | TEXT | 65535 | Sí | - | - | - | Descripci├│n de la tasa de impuesto |
| is_active | TINYINT | 3 | Sí | FK | 1 | - | 1 = Activa, 0 = Inactiva |
| is_default | TINYINT | 3 | Sí | FK | 0 | - | 1 = Tasa por defecto, 0 = No |
| created_by | INT | 10 | Sí | FK | - | - | Usuario que creó el registro |
| updated_by | INT | 10 | Sí | FK | - | - | Usuario que actualizó el registro |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | - | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| tax_rates_ibfk_1 | created_by | users | id |
| tax_rates_ibfk_2 | updated_by | users | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| created_by | No | BTREE | created_by |
| idx_is_active | No | BTREE | is_active |
| idx_is_default | No | BTREE | is_default |
| PRIMARY | Sí | BTREE | id |
| unique_name | Sí | BTREE | name |
| updated_by | No | BTREE | updated_by |

---

## Configuración General

### branches 

**Tipo:** Tabla  
**Descripción:** Sucursales de la empresa  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| nombre | VARCHAR | 100 | No | - | - | - | Campo de datos |
| direccion | VARCHAR | 255 | Sí | - | - | - | Campo de datos |
| city_id | INT | 10 | Sí | FK | - | - | Referencia a la tabla city |
| telefono | VARCHAR | 20 | Sí | - | - | - | Campo de datos |
| correo | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| gerente | VARCHAR | 100 | Sí | - | - | - | Campo de datos |
| is_active | TINYINT | 3 | Sí | - | 1 | - | Estado activo/inactivo del registro |
| created_by | INT | 10 | Sí | FK | - | - | Usuario que creó el registro |
| updated_by | INT | 10 | Sí | FK | - | - | Usuario que actualizó el registro |
| deleted_by | INT | 10 | Sí | FK | - | - | Campo de datos |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | - | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| branches_ibfk_1 | city_id | cities | id |
| branches_ibfk_2 | created_by | users | id |
| branches_ibfk_3 | updated_by | users | id |
| branches_ibfk_4 | deleted_by | users | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| city_id | No | BTREE | city_id |
| created_by | No | BTREE | created_by |
| deleted_by | No | BTREE | deleted_by |
| PRIMARY | Sí | BTREE | id |
| updated_by | No | BTREE | updated_by |

---

### cities 

**Tipo:** Tabla  
**Descripción:** Ciudades  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| state_id | INT | 10 | No | FK | - | - | Referencia a la tabla state |
| nombre | VARCHAR | 100 | No | - | - | - | Campo de datos |
| is_active | TINYINT | 3 | Sí | - | 1 | - | Estado activo/inactivo del registro |
| created_by | INT | 10 | Sí | FK | - | - | Usuario que creó el registro |
| updated_by | INT | 10 | Sí | FK | - | - | Usuario que actualizó el registro |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | - | on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | - | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| cities_ibfk_1 | state_id | states | id |
| cities_ibfk_2 | created_by | users | id |
| cities_ibfk_3 | updated_by | users | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| created_by | No | BTREE | created_by |
| PRIMARY | Sí | BTREE | id |
| state_id | No | BTREE | state_id |
| updated_by | No | BTREE | updated_by |

---

### countries 

**Tipo:** Tabla  
**Descripción:** Países  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| nombre | VARCHAR | 100 | No | - | - | - | Campo de datos |
| codigo_iso | VARCHAR | 3 | Sí | - | - | - | Campo de datos |
| is_active | TINYINT | 3 | Sí | - | 1 | - | Estado activo/inactivo del registro |
| created_by | INT | 10 | Sí | FK | - | - | Usuario que creó el registro |
| updated_by | INT | 10 | Sí | FK | - | - | Usuario que actualizó el registro |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | - | on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | - | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| countries_ibfk_1 | created_by | users | id |
| countries_ibfk_2 | updated_by | users | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| created_by | No | BTREE | created_by |
| PRIMARY | Sí | BTREE | id |
| updated_by | No | BTREE | updated_by |

---

### states 

**Tipo:** Tabla  
**Descripción:** Estados o departamentos  

#### Estructura de Campos

| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |
|-------|------|----------|------|-------|---------|-------|-------------|
| id | INT | 10 | No | PK | - | auto_increment | Identificador único autoincremental |
| country_id | INT | 10 | No | FK | - | - | Referencia a la tabla country |
| nombre | VARCHAR | 100 | No | - | - | - | Campo de datos |
| is_active | TINYINT | 3 | Sí | - | 1 | - | Estado activo/inactivo del registro |
| created_by | INT | 10 | Sí | FK | - | - | Usuario que creó el registro |
| updated_by | INT | 10 | Sí | FK | - | - | Usuario que actualizó el registro |
| created_at | TIMESTAMP | - | Sí | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED | Fecha y hora de creación del registro |
| updated_at | TIMESTAMP | - | Sí | - | - | on update CURRENT_TIMESTAMP | Fecha y hora de última actualización |
| deleted_at | TIMESTAMP | - | Sí | - | - | - | Fecha y hora de eliminación lógica (soft delete) |

#### Relaciones (Foreign Keys)

| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |
|------------|-------------|--------------------|-----------------|
| states_ibfk_1 | country_id | countries | id |
| states_ibfk_2 | created_by | users | id |
| states_ibfk_3 | updated_by | users | id |

#### Índices

| Nombre | Único | Tipo | Columnas |
|--------|-------|------|----------|
| country_id | No | BTREE | country_id |
| created_by | No | BTREE | created_by |
| PRIMARY | Sí | BTREE | id |
| updated_by | No | BTREE | updated_by |

---

---

## Notas

- **PK**: Primary Key (Clave Primaria)
- **FK**: Foreign Key (Clave Foránea)
- **UNIQUE**: Índice único
- **auto_increment**: Campo autoincrementable
- Las fechas están almacenadas en formato TIMESTAMP o DATETIME
- Los campos con sufijo _at generalmente representan timestamps
- Los campos deleted_at implementan eliminación lógica (soft delete)

---

*Documento generado automáticamente desde la base de datos MySQL*
