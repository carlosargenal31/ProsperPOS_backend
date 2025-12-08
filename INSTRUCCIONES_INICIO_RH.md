# 🚀 Instrucciones para Iniciar y Probar el Módulo de RH

## ✅ Pre-requisitos Completados

- ✅ Tablas de base de datos creadas
- ✅ Datos de ejemplo insertados
- ✅ Permisos configurados
- ✅ Backend implementado
- ✅ Frontend implementado

---

## 📋 Pasos para Iniciar

### 1️⃣ Iniciar el Backend

Abre una terminal en la carpeta del backend:

```bash
cd C:\Users\carlo\OneDrive\Escritorio\ProsperPOS\backend
npm run dev
```

**Deberías ver:**
```
Server running on port 3000
Database connected successfully
```

**Si hay errores:**
- Verifica que MySQL esté corriendo
- Verifica las credenciales en `.env`
- Verifica que las tablas estén creadas

---

### 2️⃣ Iniciar el Frontend

Abre OTRA terminal en la carpeta del frontend:

```bash
cd C:\Users\carlo\OneDrive\Escritorio\ProsperPOS\template
npm run dev
```

**Deberías ver:**
```
VITE vX.X.X  ready in XXX ms

➜  Local:   http://localhost:3001/
```

---

### 3️⃣ Acceder a la Aplicación

1. Abre tu navegador en: **http://localhost:3001**

2. Inicia sesión con tus credenciales de administrador

3. En el menú lateral, busca: **Gestión de Recursos Humanos**

4. Verás 3 opciones:
   - 📁 **Departamentos** → `/hrm/departments`
   - 💼 **Cargos/Puestos** → `/hrm/positions`
   - 👥 **Empleados** → `/hrm/employees`

---

## 🧪 Probar las Funcionalidades

### En Departamentos:

1. **Ver departamentos existentes** - Deberías ver 8 departamentos de ejemplo
2. **Crear nuevo** - Click en "Agregar Departamento"
   - Ingresa: Nombre, Descripción
   - Activa/desactiva el estado
   - Click en "Guardar"
3. **Editar** - Click en el ícono de lápiz
4. **Eliminar** - Click en el ícono de basura
5. **Buscar** - Usa el campo de búsqueda
6. **Refrescar** - Click en el ícono de refresh

### En Cargos/Puestos:

1. **Ver cargos existentes** - Deberías ver 21 cargos de ejemplo
2. **Crear nuevo cargo**
   - Nombre del cargo
   - Seleccionar departamento
   - Descripción
   - Estado activo
3. **Editar y eliminar** - Igual que departamentos
4. **Filtrar por departamento** - En el select de departamento

### En Empleados:

1. **Ver lista de empleados** - Inicialmente vacía
2. **Crear nuevo empleado**
   - Código (opcional, pero único)
   - Nombre y apellido
   - Email (opcional, pero único)
   - Teléfono
   - Departamento (select)
   - Cargo (select, filtrado por departamento)
   - Fecha de ingreso
   - Salario
   - Estado activo
3. **Editar y eliminar** - Igual que anteriores
4. **Buscar** - Por código, nombre, email, teléfono

---

## 🔍 Probar los Endpoints de la API

### Opción 1: Script Automático de Prueba

Ejecuta el script de prueba que verifica todos los endpoints:

```bash
cd C:\Users\carlo\OneDrive\Escritorio\ProsperPOS\backend
node test_hr_endpoints.js
```

**Nota:** Asegúrate de que exista un usuario `admin@example.com` con password `admin123` o edita el script con tus credenciales.

### Opción 2: Prueba Manual con Postman o Thunder Client

#### 1. Login para obtener token
```
POST http://localhost:3000/api/v1/auth/login
Body (JSON):
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

Copia el `token` de la respuesta.

#### 2. Probar endpoints (agrega el token en Headers)
```
Authorization: Bearer TU_TOKEN_AQUI
```

**Departamentos:**
```
GET    http://localhost:3000/api/v1/departments
GET    http://localhost:3000/api/v1/departments/active
GET    http://localhost:3000/api/v1/departments/1
POST   http://localhost:3000/api/v1/departments
PUT    http://localhost:3000/api/v1/departments/1
DELETE http://localhost:3000/api/v1/departments/1
```

**Cargos:**
```
GET    http://localhost:3000/api/v1/positions
GET    http://localhost:3000/api/v1/positions/active
GET    http://localhost:3000/api/v1/positions/department/1
```

**Empleados:**
```
GET    http://localhost:3000/api/v1/employees
POST   http://localhost:3000/api/v1/employees
```

---

## 📊 Consultas SQL Útiles

Abre MySQL Workbench o tu cliente MySQL y ejecuta:

### Ver estadísticas generales
```sql
USE prosperpos;
CALL sp_get_hr_statistics();
```

### Ver todos los departamentos con su información
```sql
SELECT * FROM vw_department_summary;
```

### Ver todos los cargos con su información
```sql
SELECT * FROM vw_position_summary;
```

### Ver empleados con información completa
```sql
SELECT * FROM vw_employees_full;
```

### Listar departamentos con cantidad de cargos
```sql
SELECT
    d.id,
    d.nombre as departamento,
    COUNT(p.id) as total_cargos,
    COUNT(e.id) as total_empleados
FROM hr_departments d
LEFT JOIN hr_positions p ON d.id = p.department_id AND p.deleted_at IS NULL
LEFT JOIN hr_employees e ON d.id = e.department_id AND e.deleted_at IS NULL
WHERE d.deleted_at IS NULL
GROUP BY d.id, d.nombre
ORDER BY d.nombre;
```

---

## 🐛 Resolución de Problemas

### Backend no inicia
- ✅ Verifica que MySQL esté corriendo
- ✅ Revisa el archivo `.env` (credenciales correctas)
- ✅ Ejecuta `npm install` si faltan dependencias
- ✅ Revisa los logs de la consola

### Frontend no inicia
- ✅ Ejecuta `npm install` si faltan dependencias
- ✅ Verifica que el puerto 3001 no esté ocupado
- ✅ Revisa los logs de la consola

### No aparecen los menús de RH
- ✅ Verifica que el usuario tenga los permisos de RH
- ✅ Refresca la página (Ctrl + F5)
- ✅ Revisa `sidebar.json` que tenga las rutas de RH

### Error al crear/editar
- ✅ Abre la consola del navegador (F12)
- ✅ Revisa el tab "Network" para ver el error exacto
- ✅ Verifica que el backend esté respondiendo
- ✅ Verifica que tengas los permisos necesarios

### Error 404 en endpoints
- ✅ Verifica que el backend esté corriendo
- ✅ Revisa que las rutas estén en `backend/src/routes/index.js`
- ✅ Verifica la URL completa (debe incluir `/api/v1/`)

---

## 📝 Estructura de un Empleado de Ejemplo

```json
{
  "codigo": "EMP001",
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan.perez@example.com",
  "telefono": "9999-9999",
  "department_id": 1,
  "position_id": 4,
  "fecha_ingreso": "2025-01-15",
  "salario": 15000.00,
  "is_active": true
}
```

---

## ✅ Checklist de Verificación

Antes de considerar el módulo como funcional, verifica:

- [ ] Backend corriendo sin errores
- [ ] Frontend corriendo sin errores
- [ ] Puedes hacer login
- [ ] Ves el menú "Gestión de Recursos Humanos"
- [ ] Puedes ver la lista de departamentos
- [ ] Puedes crear un nuevo departamento
- [ ] Puedes editar un departamento
- [ ] Puedes eliminar un departamento
- [ ] Puedes ver la lista de cargos
- [ ] Puedes crear un nuevo cargo
- [ ] Puedes ver la lista de empleados
- [ ] Puedes crear un nuevo empleado
- [ ] Las búsquedas funcionan
- [ ] Los filtros funcionan
- [ ] Las notificaciones aparecen correctamente

---

## 🎯 Próximos Pasos Opcionales

Una vez que todo funcione:

1. **Personalizar datos de ejemplo**
   - Edita los departamentos según tu empresa
   - Ajusta los cargos a tu organización
   - Agrega tus empleados reales

2. **Configurar permisos**
   - Asigna permisos de RH a otros roles
   - Configura qué usuarios pueden ver/editar

3. **Agregar más funcionalidades**
   - Exportar a Excel
   - Reportes avanzados
   - Módulo de asistencia
   - Módulo de nómina

---

## 📞 Información de Soporte

**Archivos de documentación:**
- `MODULO_RH_COMPLETADO.md` - Resumen completo del módulo
- `backend/database/migrations/README_HR_MIGRATION.md` - Documentación de la base de datos
- Este archivo - Instrucciones de inicio

**Logs importantes:**
- Backend: Consola donde corre `npm run dev`
- Frontend: Consola del navegador (F12 → Console)
- Base de datos: MySQL logs

---

**¡Todo listo para comenzar a usar el módulo de Recursos Humanos! 🎉**
