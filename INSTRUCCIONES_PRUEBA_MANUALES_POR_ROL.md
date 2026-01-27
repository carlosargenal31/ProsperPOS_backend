# 🧪 Instrucciones para Probar Manuales por Rol

## ✅ Sistema Implementado

Se ha implementado un sistema completo de filtrado de sidebar y manuales por rol:

1. **Vendedor (cashier)** - Solo ve Manual Vendedor y secciones limitadas
2. **Bodega (warehouse)** - Solo ve Manual Bodega y secciones limitadas
3. **Administrador (admin)** - Ve Manual Administrador y todas las secciones

---

## 🔧 PASO 1: Verificar que el Backend Esté Actualizado

El backend debe estar enviando **slugs de roles** en lugar de nombres.

**Verificar el archivo:**
```
backend/src/services/auth.service.js
Línea 774 debe ser: r.slug as role_slug
```

✅ **Ya está corregido** en tu sistema.

---

## 🔄 PASO 2: Reiniciar el Backend

**IMPORTANTE:** El backend debe reiniciarse para que los cambios surtan efecto.

### Opción A: Reiniciar manualmente

```bash
cd backend
# Detener el proceso actual (Ctrl + C si está corriendo)
npm start
```

### Opción B: Usar el script de reinicio

```bash
# Desde la raíz del proyecto
restart-backend.bat
```

**Espera a ver este mensaje:**
```
✓ Backend corriendo en http://localhost:3000
```

---

## 🧹 PASO 3: Limpiar el Frontend

### 3.1 Reiniciar el Frontend

```bash
cd template
# Detener el proceso actual (Ctrl + C si está corriendo)
npm run dev
```

### 3.2 Limpiar Caché del Navegador

1. Abre el navegador en `http://localhost:3001`
2. Presiona **Ctrl + Shift + R** (fuerza recarga y limpia caché)

---

## 🔍 PASO 4: Verificar Roles en localStorage

**Antes de cerrar sesión**, vamos a verificar los roles actuales:

1. Presiona **F12** para abrir las herramientas de desarrollo
2. Ve a la pestaña **Console**
3. Ejecuta este código:

```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('Roles actuales:', user.roles);
```

### Resultado Esperado:

- ✅ **CORRECTO:** `["admin"]` o `["cashier"]` o `["warehouse"]` (slugs)
- ❌ **INCORRECTO:** `["Administrador"]` o `["Vendedor"]` o `["Almacenista"]` (nombres)

### Si ves nombres en lugar de slugs:

**Causa:** El usuario fue creado con el backend antiguo que enviaba nombres.

**Solución:**
1. Cierra sesión (verás cómo hacerlo en el siguiente paso)
2. Inicia sesión de nuevo (el backend actualizado enviará slugs)

---

## 🚪 PASO 5: Cerrar Sesión

**IMPORTANTE:** Debes cerrar sesión para limpiar los datos antiguos.

### Opción A: Cerrar sesión desde el menú

1. Haz scroll hasta el final del sidebar
2. Ve a **Gestión de Usuarios** → **Cerrar Sesión**

### Opción B: Limpiar localStorage manualmente

1. Presiona **F12**
2. En la consola, ejecuta:

```javascript
localStorage.clear();
location.reload();
```

---

## 🔐 PASO 6: Probar con Usuario Vendedor

### 6.1 Iniciar Sesión

```
Usuario: vendedor
Contraseña: [tu contraseña]
```

### 6.2 Verificar Roles en Consola

```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('Roles:', user.roles);
// Debe mostrar: ["cashier"]
```

### 6.3 Verificar Sidebar

El usuario **vendedor (cashier)** debe ver SOLAMENTE:

#### ✅ Secciones Visibles:
- **Centro de Control**
  - Panel Administrativo

- **Ventas**
  - Archivos:
    - Cupones
    - Ofertas
  - Procesos:
    - POS Facturación
    - Devoluciones Ventas
    - Guías de Remisión
  - Reportes:
    - Reimpresiones Ventas
    - Ventas por Vendedor
    - Estado Cuenta Ventas

- **Inventario**
  - Archivos:
    - Productos
    - Categorias
  - Reportes:
    - Lista de Inventario Físico
    - Codigo de Barras

- **Gestión de Usuarios**
  - Cerrar Sesión

- **Ajustes**
  - Ajustes Generales:
    - Seguridad

- **Ayuda**
  - **Manual Vendedor** ← DEBE APARECER AQUÍ

#### ❌ NO Debe Ver:
- Compras
- Personas y Lugares
- Gestión de Recursos Humanos
- Reportes (sección principal)
- Tienda en Línea
- Manual Administrador
- Manual Bodega

### 6.4 Probar el Manual

1. Ve a **Ayuda** → **Manual Vendedor**
2. Haz clic en "Manual Vendedor"
3. **Resultado esperado:** Se abre el PDF en una nueva pestaña

---

## 📦 PASO 7: Probar con Usuario Bodega

### 7.1 Cerrar Sesión del Vendedor

1. **Gestión de Usuarios** → **Cerrar Sesión**

### 7.2 Iniciar Sesión con Bodega

```
Usuario: almacenista
Contraseña: [tu contraseña]
```

### 7.3 Verificar Roles en Consola

```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('Roles:', user.roles);
// Debe mostrar: ["warehouse"]
```

### 7.4 Verificar Sidebar

El usuario **bodega (warehouse)** debe ver SOLAMENTE:

#### ✅ Secciones Visibles:
- **Centro de Control**
  - Panel Administrativo

- **Inventario**
  - Archivos:
    - Productos
    - Categorias
    - Sub Categorias
    - Marcas
    - Unidades
    - Codigo de Barras
  - Procesos:
    - Manejo de Inventario
    - Ajuste de Inventario
  - Reportes:
    - Lista de Inventario Físico
    - Historial de Existencias

- **Gestión de Usuarios**
  - Cerrar Sesión

- **Ajustes**
  - Ajustes Generales:
    - Seguridad

- **Ayuda**
  - **Manual Bodega** ← DEBE APARECER AQUÍ

#### ❌ NO Debe Ver:
- Ventas
- Compras
- Personas y Lugares
- Gestión de Recursos Humanos
- Reportes (sección principal)
- Tienda en Línea
- Manual Administrador
- Manual Vendedor

### 7.5 Probar el Manual

1. Ve a **Ayuda** → **Manual Bodega**
2. Haz clic en "Manual Bodega"
3. **Resultado esperado:** Se abre el PDF en una nueva pestaña

---

## 👑 PASO 8: Probar con Usuario Administrador

### 8.1 Cerrar Sesión de Bodega

1. **Gestión de Usuarios** → **Cerrar Sesión**

### 8.2 Iniciar Sesión con Admin

```
Usuario: admin
Contraseña: [tu contraseña]
```

### 8.3 Verificar Roles en Consola

```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('Roles:', user.roles);
// Debe mostrar: ["admin"] o ["super_admin"]
```

### 8.4 Verificar Sidebar

El usuario **administrador** debe ver **TODAS** las secciones:

- Centro de Control
- Ventas (completo)
- Inventario (completo)
- Compras (completo)
- Personas y Lugares (completo)
- Gestión de Recursos Humanos (completo)
- Reportes (completo)
- Tienda en Línea (completo)
- Gestión de Usuarios (completo)
- Ajustes (completo)
- **Ayuda**
  - **Manual Administrador** ← DEBE APARECER AQUÍ

### 8.5 Probar el Manual

1. Ve a **Ayuda** → **Manual Administrador**
2. Haz clic en "Manual Administrador"
3. **Resultado esperado:** Se abre el PDF en una nueva pestaña

---

## 🐛 Solución de Problemas

### ❌ Problema 1: No veo el manual de mi rol

**Síntomas:**
- Soy vendedor pero no veo "Manual Vendedor"
- Soy bodega pero no veo "Manual Bodega"

**Diagnóstico:**

1. Abre la consola (F12)
2. Ejecuta:
```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('Roles:', user.roles);
```

**Si muestra nombres (ej: ["Vendedor"]):**
- Cierra sesión
- Asegúrate de que el backend esté reiniciado
- Inicia sesión de nuevo

**Si muestra slugs correctos (ej: ["cashier"]):**
- Presiona Ctrl + Shift + R para limpiar caché
- Verifica que estés en la sección "Ayuda"

---

### ❌ Problema 2: Veo secciones que no debería ver

**Ejemplo:** Soy vendedor pero veo la sección "Compras"

**Solución:**
1. Presiona **Ctrl + Shift + R** (fuerza recarga)
2. Cierra sesión
3. Inicia sesión de nuevo
4. Si persiste, abre un issue con screenshot

---

### ❌ Problema 3: El PDF no se abre

**Síntomas:**
- Hago clic en el manual pero no pasa nada
- Sale error 404

**Diagnóstico:**

1. Verifica que el backend esté corriendo:
```
http://localhost:3000/health
```

2. Prueba abrir el PDF directamente:
```
http://localhost:3000/manuales/manual-vendedor.pdf
```

**Si funciona el enlace directo pero no desde el menú:**
- Desactiva el bloqueador de ventanas emergentes
- Permite pop-ups para localhost:3001

**Si NO funciona el enlace directo:**
- Reinicia el backend
- Verifica que los PDFs existan en `template/public/manuales/`

---

### ❌ Problema 4: Error en la consola del navegador

**Busca errores rojos en la consola (F12)**

**Error común:**
```
Cannot read property 'includes' of undefined
```

**Causa:** user.roles es undefined

**Solución:**
1. Cierra sesión
2. Reinicia el backend
3. Inicia sesión de nuevo

---

## 📊 Verificación Final

### Checklist Completo:

- [ ] Backend reiniciado
- [ ] Frontend reiniciado
- [ ] Caché del navegador limpiado (Ctrl + Shift + R)
- [ ] Sesión cerrada
- [ ] Iniciado sesión con vendedor
- [ ] Roles en localStorage muestran: `["cashier"]`
- [ ] Manual Vendedor aparece en sección Ayuda
- [ ] Manual Vendedor se abre correctamente
- [ ] Solo veo las secciones permitidas para vendedor
- [ ] Cerrado sesión de vendedor
- [ ] Iniciado sesión con bodega
- [ ] Roles en localStorage muestran: `["warehouse"]`
- [ ] Manual Bodega aparece en sección Ayuda
- [ ] Manual Bodega se abre correctamente
- [ ] Solo veo las secciones permitidas para bodega
- [ ] Cerrado sesión de bodega
- [ ] Iniciado sesión con admin
- [ ] Manual Administrador aparece en sección Ayuda
- [ ] Manual Administrador se abre correctamente
- [ ] Veo todas las secciones como admin

---

## 🔧 Herramienta de Verificación

He creado un archivo HTML para verificar los roles:

**Ubicación:**
```
VERIFICAR_ROLES_USUARIO.html
```

**Cómo usarlo:**
1. Abre el archivo en tu navegador (doble clic)
2. Sigue las instrucciones en la página
3. Ejecuta las pruebas automáticas

**O simplemente abre la consola del navegador y ejecuta el script que está en esa página.**

---

## ✅ Todo Funcionando

Si completaste todos los pasos y todos los checkboxes están marcados:

🎉 **¡El sistema de manuales por rol está funcionando correctamente!**

Cada usuario ve solo:
- Su manual correspondiente
- Las secciones que tiene permitidas
- Los submenús que puede acceder

---

## 📝 Archivos Modificados

### Backend:
- ✅ `backend/src/services/auth.service.js` (línea 774)
- ✅ `backend/app.js` (línea 159 - servir PDFs)

### Frontend:
- ✅ `template/src/utils/sidebar-permissions.js` (NUEVO)
- ✅ `template/src/utils/manual-download.js` (NUEVO)
- ✅ `template/src/views/layouts/vertical-sidebar.vue`
- ✅ `template/src/assets/json/sidebar.json`
- ✅ `template/src/assets/scss/layout/_sidebar.scss`

### PDFs:
- ✅ `template/public/manuales/manual-administrador.pdf`
- ✅ `template/public/manuales/manual-vendedor.pdf`
- ✅ `template/public/manuales/manual-bodega.pdf`

---

**Fecha:** 2026-01-23
**Estado:** ✅ Sistema Completado
**Versión:** 1.0 Final
