# ✅ CONFIGURACIÓN COMPLETA PARA PERSONAL DE BODEGA

## 🎯 Cambios Realizados

### 1. Botón POS Oculto
- ✅ El botón POS en el header ya NO es visible para personal de bodega
- Archivo modificado: `template/src/views/layouts/layouts-header.vue`
- Se agregó el computed `showPOSButton()` que oculta el botón para los roles:
  - `warehouse`
  - `almacenista`
  - `bodega`
  - `personal_de_bodega`

### 2. Manual de Bodega Reordenado
- ✅ "Manual Bodega" ahora aparece ANTES de "Cerrar Sesión" en el sidebar
- Archivo modificado: `template/src/assets/json/sidebar.json`

### 3. Redirección Automática al Login
- ✅ Al iniciar sesión con rol de bodega, se redirige automáticamente a:
  - `/inventory/product-list`
- Archivo modificado: `template/src/views/pages/pages/authentication/login/sign-in.vue`

### 4. Permisos del Sidebar
- ✅ Personal de bodega puede ver las siguientes secciones:
  - **Ventas:**
    - Guías de Remisión
  - **Inventario:**
    - Productos, Categorías, Sub Categorías, Marcas, Unidades, Código de Barras
    - Manejo de Inventario, Ajuste de Inventario
    - Lista de Inventario Físico, Historial de Existencias, Productos Vendidos
  - **Ajustes:**
    - Seguridad
  - **Ayuda:**
    - Manual Bodega
    - Cerrar Sesión

### 5. Permisos CRUD Completos
- ✅ Se creó el rol `warehouse` con los siguientes permisos:

#### 📦 Productos (6 permisos)
- ✅ `products.read` - Ver listado de productos
- ✅ `products.create` - Crear nuevos productos
- ✅ `products.update` - Actualizar productos
- ✅ `products.delete` - Eliminar productos
- ✅ `products.import` - Importar productos desde Excel/CSV
- ✅ `products.export` - Exportar productos a Excel/CSV

#### 🏷️ Categorías (4 permisos)
- ✅ `categories.read` - Ver categorías
- ✅ `categories.create` - Crear categorías
- ✅ `categories.update` - Actualizar categorías
- ✅ `categories.delete` - Eliminar categorías

#### 🔖 Marcas (4 permisos)
- ✅ `brands.read` - Ver marcas
- ✅ `brands.create` - Crear marcas
- ✅ `brands.update` - Actualizar marcas
- ✅ `brands.delete` - Eliminar marcas

#### 📊 Inventario (5 permisos)
- ✅ `inventory.read` - Ver niveles de inventario
- ✅ `inventory.adjust` - Realizar ajustes de inventario
- ✅ `inventory.transfer` - Transferir productos entre almacenes
- ✅ `inventory.count` - Realizar conteos físicos
- ✅ `inventory.movements` - Ver movimientos de inventario

#### 🚚 Guías de Remisión (3 permisos)
- ✅ `shipments.read` - Ver guías de remisión
- ✅ `shipments.create` - Crear guías de remisión
- ✅ `shipments.delete` - Eliminar guías de remisión

#### 📈 Reportes (2 permisos)
- ✅ `reports.inventory` - Ver reportes de inventario
- ✅ `reports.export` - Exportar reportes

#### 📊 Dashboard (1 permiso)
- ✅ `dashboard.view` - Ver dashboard

**TOTAL: 25 permisos configurados**

---

## 🚀 Cómo Usar

### Para asignar el rol a un usuario:

1. **Opción A: Desde la base de datos**
   ```sql
   -- Verificar el ID del usuario
   SELECT id, username, email FROM users WHERE username = 'tu_usuario';

   -- Asignar el rol de bodega (ID: 12)
   INSERT INTO user_roles (user_id, role_id, created_at)
   VALUES (ID_DEL_USUARIO, 12, NOW());

   -- Actualizar permisos del usuario
   UPDATE users
   SET permissions = '["products.read","products.create","products.update","products.delete","products.import","products.export","categories.read","categories.create","categories.update","categories.delete","brands.read","brands.create","brands.update","brands.delete","inventory.read","inventory.adjust","inventory.transfer","inventory.count","inventory.movements","reports.inventory","reports.export","shipments.read","shipments.create","shipments.delete","dashboard.view"]'
   WHERE id = ID_DEL_USUARIO;
   ```

2. **Opción B: Desde la interfaz web**
   - Ir a "Usuarios" → Editar usuario
   - Asignar el rol "warehouse"
   - Los permisos se aplicarán automáticamente

### Verificar cambios:

1. **Cerrar sesión** del usuario actual
2. **Iniciar sesión** con el usuario de bodega
3. Verificar que:
   - ✅ Se redirige automáticamente a `/inventory/product-list`
   - ✅ NO se ve el botón "POS" en el header
   - ✅ El sidebar muestra solo las secciones permitidas
   - ✅ "Manual Bodega" aparece arriba de "Cerrar Sesión"

---

## 📝 Archivos Modificados

1. `template/src/views/layouts/layouts-header.vue` - Ocultar botón POS
2. `template/src/assets/json/sidebar.json` - Reordenar manual
3. `template/src/utils/sidebar-permissions.js` - Permisos del sidebar
4. `template/src/views/pages/pages/authentication/login/sign-in.vue` - Redirección
5. `backend/configurar-permisos-bodega-completo.js` - Script de configuración

---

## ⚠️ Notas Importantes

- Los permisos se asignan a nivel de **rol**, no de usuario individual
- Para que los cambios surtan efecto, el usuario debe **cerrar sesión y volver a iniciar**
- Si no ves los cambios, limpia el cache del navegador (Ctrl + Shift + R)
- El frontend debe estar ejecutándose en el puerto correcto (actualmente en **3003**)

---

## 🔧 Troubleshooting

### El botón POS sigue visible
- Verifica que el usuario tenga el rol correcto: `warehouse`, `bodega`, `almacenista` o `personal_de_bodega`
- Cierra sesión y vuelve a iniciar
- Limpia el cache del navegador

### No veo el manual de bodega
- Verifica que el usuario tenga uno de los roles: `warehouse`, `bodega`, `almacenista` o `personal_de_bodega`
- Recarga el frontend con Ctrl + Shift + R

### No me redirige a la página de productos
- Verifica que el rol esté correctamente asignado
- Revisa que el localStorage contenga el usuario correcto
- Abre `VERIFICAR_ROL_Y_RECARGAR.html` para diagnosticar

---

## ✅ Checklist de Verificación

- [ ] El botón POS está oculto para personal de bodega
- [ ] Manual de Bodega aparece antes de Cerrar Sesión
- [ ] Al iniciar sesión se redirige a /inventory/product-list
- [ ] El sidebar muestra solo las secciones permitidas
- [ ] Puedo crear, editar y eliminar productos
- [ ] Puedo crear, editar y eliminar categorías
- [ ] Puedo crear, editar y eliminar marcas
- [ ] Puedo hacer ajustes de inventario
- [ ] Puedo ver historial de existencias
- [ ] Puedo crear guías de remisión

---

**Fecha de configuración:** 2026-01-24
**Versión:** 1.0
**Estado:** ✅ Completado
