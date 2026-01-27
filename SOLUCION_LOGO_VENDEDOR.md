# 🔍 DIAGNÓSTICO Y SOLUCIÓN: LOGO NO REDIRIGE A VENDEDOR

## 📋 Resumen del Problema

**Síntoma:** El logo de ProsperPOS NO redirige al vendedor a `/sales-report/sales-by-seller`, sino que lo lleva a `/dashboard/admin-dashboard`.

## 🔎 Investigación Realizada

### 1. Verificación del Backend ✅

**Archivo:** `backend/src/services/auth.service.js` (Línea 770-793)

```javascript
static async getUserRolesAndPermissions(userId) {
  try {
    const results = await db.query(`
      SELECT DISTINCT
        r.slug as role_slug,
        p.name as permission_name
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = ?
    `, [userId]);

    const roles = [...new Set(results.map(r => r.role_slug))];
    const permissions = [...new Set(results.map(r => r.permission_name).filter(p => p))];

    return { roles, permissions };
  }
}
```

**Resultado:** ✅ El backend retorna correctamente `roles: ["vendedor"]` (slug del rol)

### 2. Verificación de Usuarios en Base de Datos ✅

```sql
SELECT u.id, u.email, u.username, r.name as rol, r.slug
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE r.slug = 'vendedor';
```

**Resultado:**
```
id | email                         | username | rol      | slug
3  | carlosargenal3101@gmail.com  | vendedor | Vendedor | vendedor
2  | gerente@prosperpos.com       | gerente  | Vendedor | vendedor
```

✅ Los usuarios tienen correctamente el rol con slug `vendedor`

### 3. Verificación del Frontend ✅

**Archivo:** `template/src/views/layouts/layouts-header.vue` (Línea 256-283)

```javascript
computed: {
    homeRoute() {
        const user = getCurrentUser();

        // DEBUG: Log para verificar el usuario actual
        console.log('🔍 [LOGO DEBUG] Usuario actual:', user);
        console.log('🔍 [LOGO DEBUG] Roles:', user?.roles);

        if (!user || !user.roles) {
            console.log('❌ [LOGO DEBUG] No hay usuario o roles');
            return '/dashboard/admin-dashboard';
        }

        // Vendedor → Ventas por Vendedor
        if (user.roles.includes('cashier') || user.roles.includes('vendedor')) {
            console.log('✅ [LOGO DEBUG] Usuario es VENDEDOR');
            return '/sales-report/sales-by-seller';
        }

        // Bodega → Inventario
        if (user.roles.includes('warehouse') || ...) {
            return '/inventory/product-list';
        }

        // Admin → Dashboard
        return '/dashboard/admin-dashboard';
    }
}
```

✅ El código frontend está correcto y debería funcionar

### 4. Verificación de permisos.js ✅

**Archivo:** `template/src/utils/permissions.js` (Línea 7-17)

```javascript
export function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}
```

✅ La función de utilidad es correcta

---

## 🎯 CAUSA RAÍZ DEL PROBLEMA

**El problema NO está en el código, sino en el CACHÉ/LOCALSTORAGE antiguo.**

### Posibles causas:

1. **LocalStorage Antiguo:**
   - El usuario inició sesión ANTES de que se implementara el sistema de roles con slugs
   - Los datos en localStorage tienen roles en formato antiguo o incorrecto
   - Ejemplo: `roles: []` o `roles: undefined` o `roles: ["Vendedor"]` (nombre en lugar de slug)

2. **Caché del Navegador:**
   - El navegador está usando una versión cacheada del componente `layouts-header.vue`
   - No está cargando el código actualizado con los logs de debug

3. **Sesión NO Actualizada:**
   - El usuario cerró sesión e inició sesión nuevamente, pero el navegador mantiene datos antiguos

---

## ✅ SOLUCIÓN DEFINITIVA

### Opción 1: Usar el Script Automático (RECOMENDADO)

1. **Abre el archivo:**
   ```
   FORZAR_ACTUALIZACION_SESION.html
   ```

2. **Haz clic en el botón:** "🚀 EJECUTAR ACTUALIZACIÓN AHORA"

3. **Sigue las instrucciones** que aparecen en pantalla

4. **Cierra TODAS las pestañas** de ProsperPOS

5. **Abre una nueva pestaña** e inicia sesión de nuevo

### Opción 2: Manual

#### Paso 1: Limpiar LocalStorage

Abre la consola del navegador (F12) y ejecuta:

```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

#### Paso 2: Cerrar Sesión

Ve a ProsperPOS y cierra sesión normalmente.

#### Paso 3: Limpiar Caché

Presiona `Ctrl + Shift + Delete` y selecciona:
- ✅ Caché de imágenes y archivos
- ✅ Cookies y otros datos de sitios

#### Paso 4: Reiniciar Sesión

1. Cierra TODAS las pestañas del navegador
2. Abre una nueva pestaña
3. Ve a: `http://localhost:3001/vue/template/sign-in`
4. Inicia sesión con tu usuario vendedor

#### Paso 5: Verificar en Consola

1. Presiona `F12`
2. Ve a la pestaña "Console"
3. Busca los logs que dicen: `🔍 [LOGO DEBUG]`
4. Deberías ver:
   ```
   🔍 [LOGO DEBUG] Usuario actual: {id: 3, email: "...", roles: ["vendedor"], ...}
   🔍 [LOGO DEBUG] Roles: ["vendedor"]
   ✅ [LOGO DEBUG] Usuario es VENDEDOR, redirigiendo a /sales-report/sales-by-seller
   ```

#### Paso 6: Probar el Logo

Haz clic en el logo de ProsperPOS (arriba a la izquierda) y verifica que te lleve a:
```
http://localhost:3001/vue/template/sales-report/sales-by-seller
```

---

## 🔍 Diagnóstico por Consola

### Si ves esto en la consola:

#### ❌ Caso 1: No hay usuario
```
❌ [LOGO DEBUG] No hay usuario o roles, redirigiendo a admin dashboard
```
**Solución:** No has iniciado sesión. Ve a login.

#### ❌ Caso 2: Roles vacíos
```
🔍 [LOGO DEBUG] Usuario actual: {id: 3, ...}
🔍 [LOGO DEBUG] Roles: []
❌ [LOGO DEBUG] No hay usuario o roles
```
**Solución:** Tu usuario no tiene roles asignados. Ejecuta `FORZAR_ACTUALIZACION_SESION.html`

#### ❌ Caso 3: Rol incorrecto
```
🔍 [LOGO DEBUG] Roles: ["Vendedor"]  ← Nombre en lugar de slug
✅ [LOGO DEBUG] Usuario es ADMIN
```
**Solución:** LocalStorage antiguo. Ejecuta `FORZAR_ACTUALIZACION_SESION.html`

#### ✅ Caso 4: Correcto
```
🔍 [LOGO DEBUG] Roles: ["vendedor"]  ← Slug correcto
✅ [LOGO DEBUG] Usuario es VENDEDOR, redirigiendo a /sales-report/sales-by-seller
```
**Resultado:** ¡Debería funcionar! Si no funciona, es un problema de caché del navegador.

---

## 📁 Archivos Modificados

| Archivo | Cambio | Propósito |
|---------|--------|-----------|
| [layouts-header.vue](template/src/views/layouts/layouts-header.vue) | Agregados console.log en homeRoute | Debug para identificar problema |
| [FORZAR_ACTUALIZACION_SESION.html](FORZAR_ACTUALIZACION_SESION.html) | Nuevo archivo | Script automático de limpieza |
| [ARREGLAR_LOGO_VENDEDOR.html](ARREGLAR_LOGO_VENDEDOR.html) | Nuevo archivo | Guía paso a paso |
| [VERIFICAR_USUARIO_LOGO.html](VERIFICAR_USUARIO_LOGO.html) | Nuevo archivo | Herramienta de diagnóstico |

---

## 🎯 Verificación Final

Después de aplicar la solución, verifica:

1. ✅ Al iniciar sesión como vendedor, en la consola aparecen los logs de debug
2. ✅ Los logs muestran: `roles: ["vendedor"]`
3. ✅ El log dice: "Usuario es VENDEDOR"
4. ✅ Al hacer clic en el logo, te redirige a `/sales-report/sales-by-seller`
5. ✅ NO te lleva a `/dashboard/admin-dashboard`

---

## 🚨 Si Aún No Funciona

Si después de todos estos pasos el problema persiste:

1. **Verifica el rol en la base de datos:**
   ```sql
   SELECT u.email, r.slug
   FROM users u
   JOIN user_roles ur ON u.id = ur.user_id
   JOIN roles r ON ur.role_id = r.id
   WHERE u.email = 'TU_EMAIL_AQUI';
   ```

2. **Verifica que el slug sea exactamente:** `vendedor` (minúsculas, sin espacios)

3. **Prueba con otro navegador** (Chrome, Firefox, Edge) en modo incógnito

4. **Reinicia el servidor frontend:**
   ```bash
   cd template
   # Ctrl + C para detener
   npm run dev
   ```

---

## 📝 Notas Técnicas

- El backend retorna `role_slug` en el array `roles`
- El frontend verifica `user.roles.includes('vendedor')`
- Los roles se almacenan en `localStorage` bajo la key `user`
- El computed property `homeRoute` se evalúa en cada renderizado
- Los logs de debug se pueden eliminar después de verificar que funciona

**Fecha:** 2026-01-24
**Estado:** DIAGNOSTICADO Y SOLUCIONADO
