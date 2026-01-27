# 🔧 Solución: Problema con Manuales de Usuario

## Problema Identificado

El sistema no mostraba los manuales de usuario porque el backend estaba enviando el **nombre del rol** (ej: "Administrador") en lugar del **slug del rol** (ej: "admin").

### Ejemplo del Problema:

```javascript
// ❌ ANTES (Incorrecto)
user.roles = ["Administrador", "Super Administrador"]

// ✅ AHORA (Correcto)
user.roles = ["admin", "super_admin"]
```

---

## Solución Aplicada

### 1. ✅ Backend Corregido

Se modificó el archivo:
- **Archivo:** `backend/src/services/auth.service.js`
- **Cambio:** En la función `getUserRolesAndPermissions`, se cambió de `r.name` a `r.slug`
- **Líneas:** 774 y 784

**Antes:**
```sql
SELECT DISTINCT
  r.name as role_name,  -- ❌ Enviaba el nombre
  ...
```

**Después:**
```sql
SELECT DISTINCT
  r.slug as role_slug,  -- ✅ Ahora envía el slug
  ...
```

### 2. ✅ Backend Reiniciado

El servidor backend ha sido reiniciado para aplicar los cambios.

---

## 📋 Pasos para Probar la Solución

### PASO 1: Cerrar Sesión

1. Ve a tu aplicación ProsperPOS
2. Cierra sesión (importante para limpiar el localStorage)

### PASO 2: Abrir Herramienta de Diagnóstico

1. Abre en tu navegador: `http://localhost:5173/test-user-roles.html`
2. Deberías ver la página de diagnóstico

### PASO 3: Iniciar Sesión Nuevamente

1. En otra pestaña, inicia sesión con el usuario **admin**
   - Usuario: `admin`
   - Contraseña: tu contraseña de admin

### PASO 4: Verificar Diagnóstico

1. Vuelve a la pestaña del diagnóstico
2. Haz clic en "🔍 Verificar Usuario"
3. Verifica que en la sección "VERIFICANDO CAMPO ROLES" aparezca:
   ```
   ✓ Campo "roles" EXISTE
   Tipo: Array
   Valor: ["admin"] o ["super_admin"]
   ```

### PASO 5: Verificar Manuales

1. Ve al menú lateral → **Ayuda**
2. Deberías ver: **"Manual de Usuario - Administrador"**
3. Haz clic en el manual

**Resultado Esperado:**
- ⚠️ Si los archivos PDF aún no existen: Error 404
- ✅ Si los archivos PDF existen: Se descarga el manual

---

## 🧪 Pruebas con Diferentes Usuarios

### Prueba 1: Usuario Administrador

```bash
Usuario: admin
Contraseña: [tu contraseña]
```

**Debe ver en Ayuda:**
- ✅ Manual de Usuario - Administrador
- ❌ Manual de Usuario - Vendedor
- ❌ Manual de Usuario - Personal de Bodega

### Prueba 2: Usuario Vendedor

```bash
Usuario: vendedor
Contraseña: [tu contraseña]
```

**Debe ver en Ayuda:**
- ❌ Manual de Usuario - Administrador
- ✅ Manual de Usuario - Vendedor
- ❌ Manual de Usuario - Personal de Bodega

### Prueba 3: Usuario de Bodega

```bash
Usuario: almacenista
Contraseña: [tu contraseña]
```

**Debe ver en Ayuda:**
- ❌ Manual de Usuario - Administrador
- ❌ Manual de Usuario - Vendedor
- ✅ Manual de Usuario - Personal de Bodega

---

## 🔍 Verificación con la Consola del Navegador

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Console**
3. Escribe y ejecuta:

```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('Roles del usuario:', user.roles);
```

**Resultado Esperado:**
```javascript
// Para usuario admin:
Roles del usuario: ["admin"]  // ✅ Ahora es "admin" (slug)

// ANTES (incorrecto):
Roles del usuario: ["Administrador"]  // ❌ Era el nombre
```

---

## 🛠️ Solución de Problemas

### Problema: Aún no veo el manual después de cerrar sesión

**Solución 1: Limpiar caché del navegador**
```
1. Presiona Ctrl + Shift + Delete
2. Selecciona "Todo el tiempo"
3. Marca: Cookies, Caché
4. Haz clic en "Borrar datos"
5. Cierra y abre el navegador
6. Inicia sesión nuevamente
```

**Solución 2: Limpiar localStorage manualmente**
```javascript
// En la consola del navegador (F12):
localStorage.clear();
// Luego recarga la página y vuelve a iniciar sesión
```

### Problema: El diagnóstico muestra que roles no es un array

**Solución:**
1. Verifica que el backend se haya reiniciado correctamente
2. Revisa los logs del backend:
   ```bash
   cd backend
   npm start
   ```
3. Asegúrate de cerrar sesión antes de volver a iniciar

### Problema: Error 404 al hacer clic en el manual

**Causa:** Los archivos PDF aún no existen

**Solución:**
1. Crea los archivos PDF (manual-administrador.pdf, manual-vendedor.pdf, manual-bodega.pdf)
2. Colócalos en: `template/public/manuales/`
3. Verifica que los nombres sean exactos (minúsculas, con guiones)

---

## 📁 Archivos que Debes Crear

Recuerda que aún necesitas crear los archivos PDF:

```
template/public/manuales/
├── manual-administrador.pdf          ← CREAR
├── manual-vendedor.pdf               ← CREAR
├── manual-bodega.pdf                 ← CREAR
├── manual-tienda-online-cliente.pdf  ← CREAR
└── manual-tienda-online-gestion.pdf  ← CREAR
```

---

## 🎯 Mapeo de Roles del Sistema

Para tu referencia:

| Rol en DB | Slug (Usado en código) | Nombre Visible |
|-----------|------------------------|----------------|
| ID 1 | `super_admin` | Super Administrador |
| ID 2 | `admin` | Administrador |
| ID 3 | `manager` | Gerente |
| ID 4 | `cashier` | Vendedor |
| ID 5 | `warehouse` | Almacenista |
| ID 6 | `accountant` | Contador |
| ID 7 | `viewer` | Visor |

---

## ✅ Checklist de Verificación

Verifica que todo esté funcionando:

- [ ] Backend reiniciado correctamente
- [ ] Usuario cerró sesión antes de volver a entrar
- [ ] Al iniciar sesión, `user.roles` contiene slugs (no nombres)
- [ ] Usuario admin ve "Manual de Usuario - Administrador"
- [ ] Usuario vendedor ve "Manual de Usuario - Vendedor"
- [ ] Usuario bodega ve "Manual de Usuario - Personal de Bodega"
- [ ] Manuales de tienda online aparecen en módulo de Tienda en Línea
- [ ] Archivos PDF creados y colocados en carpeta correcta

---

## 📞 Si Aún No Funciona

1. **Abre la página de diagnóstico:**
   - URL: `http://localhost:5173/test-user-roles.html`

2. **Copia el resultado del diagnóstico**

3. **Revisa los logs del backend:**
   ```bash
   cd backend
   npm start
   ```

4. **Verifica la estructura del usuario en localStorage:**
   ```javascript
   // En consola del navegador:
   console.log(localStorage.getItem('user'));
   ```

---

## 🎉 Resumen

**Cambio Principal:**
- Ahora el backend envía `user.roles = ["admin"]` en lugar de `user.roles = ["Administrador"]`
- Esto permite que el sistema de filtrado de manuales funcione correctamente

**Próximo Paso:**
- Crear los archivos PDF y colocarlos en `template/public/manuales/`

---

**Fecha de Solución:** 2026-01-23
**Archivo Modificado:** `backend/src/services/auth.service.js`
**Estado:** ✅ Corregido
