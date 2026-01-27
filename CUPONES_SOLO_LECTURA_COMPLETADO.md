# ✅ CUPONES EN MODO SOLO LECTURA PARA VENDEDOR - COMPLETADO

## 🎯 Objetivo

Permitir que vendedor y personal de bodega puedan **VER** los cupones pero **NO** puedan:
- ❌ Agregar nuevos cupones
- ❌ Editar cupones existentes
- ❌ Eliminar cupones
- ❌ Guardar reportes

---

## 🔧 Cambios Implementados

### 1. Permisos de Backend Agregados ✅

**Script Ejecutado:** Inline script para asignar permisos

**Permisos Agregados:**
- `branches.read` (ID: 142) - Ya existía, se asignó a vendedor
- `subcategories.read` - Creado y asignado a vendedor

**Resultado:**
- ✅ Cupones ahora cargan sin errores 403
- ✅ Vendedor puede ver sucursales en el modal
- ✅ Vendedor puede ver subcategorías en el modal

---

### 2. Botones Ocultos en Frontend ✅

**Archivo Modificado:** [coupons.vue](template/src/views/pages/sales/coupons.vue)

#### Cambios Realizados:

**a) Importado getCurrentUser (Línea 203):**
```javascript
import { getCurrentUser } from '@/utils/permissions';
```

**b) Agregadas Computed Properties (Líneas 223-235):**
```javascript
computed: {
  currentUser() {
    return getCurrentUser();
  },
  isVendedor() {
    if (!this.currentUser || !this.currentUser.roles) return false;
    return (
      this.currentUser.roles.includes('cashier') ||
      this.currentUser.roles.includes('vendedor') ||
      this.currentUser.roles.includes('warehouse') ||
      this.currentUser.roles.includes('almacenista') ||
      this.currentUser.roles.includes('bodega')
    );
  },
  // ... sortedCoupons
}
```

**c) Botones Ocultos con v-if="!isVendedor":**

1. **Botón "Agregar Nuevo Cupón" (Línea 27):**
```vue
<a
  v-if="!isVendedor"
  href="#"
  class="btn btn-primary"
  data-bs-toggle="modal"
  data-bs-target="#add-coupon"
  @click="openAddModal"
>
  <i class="ti ti-circle-plus me-1"></i>Agregar Nuevo Cupón
</a>
```

2. **Botón "Guardar Reporte" (Línea 36):**
```vue
<button v-if="!isVendedor" class="btn btn-success" @click="showSaveReportModal = true">
  <i class="ti ti-download me-1"></i>Guardar Reporte
</button>
```

3. **Botón Editar en Tabla (Línea 128):**
```vue
<a
  v-if="!isVendedor"
  class="me-2 p-2"
  href="#"
  @click.prevent="openEditModal(coupon)"
  data-bs-toggle="modal"
  data-bs-target="#add-coupon"
>
  <i data-feather="edit" class="feather-edit"></i>
</a>
```

4. **Botón Eliminar en Tabla (Línea 138):**
```vue
<a
  v-if="!isVendedor"
  class="confirm-text p-2"
  href="#"
  @click.prevent="openDeleteModal(coupon)"
  data-bs-toggle="modal"
  data-bs-target="#delete-coupon-modal"
>
  <i data-feather="trash-2" class="feather-trash-2"></i>
</a>
```

**Botón Visible (Solo Lectura):**
- ✅ **Botón Ver (ojo)** - Permanece visible para vendedor

---

## 📊 Resultado

### Para Administrador:
```
Botones Visibles:
✅ Agregar Nuevo Cupón
✅ Guardar Reporte
✅ Ver (ojo)
✅ Editar (lápiz)
✅ Eliminar (basura)
```

### Para Vendedor/Bodega:
```
Botones Visibles:
✅ Ver (ojo) ← SOLO ESTE

Botones Ocultos:
❌ Agregar Nuevo Cupón
❌ Guardar Reporte
❌ Editar
❌ Eliminar
```

---

## 🚀 Cómo Probar

### 1. Limpiar Caché del Navegador
```bash
Ctrl + Shift + R
```

### 2. Iniciar Sesión como Vendedor

### 3. Navegar a Cupones
- Ir a: **Ventas → Archivos → Cupones**
- O URL: `http://localhost:3001/vue/template/sales/coupons`

### 4. Verificar Comportamiento

**✅ Debe Funcionar:**
- La lista de cupones carga correctamente
- Se pueden ver los detalles de cada cupón (botón ojo)
- NO aparecen errores 403 en la consola

**❌ NO Debe Aparecer:**
- Botón "Agregar Nuevo Cupón"
- Botón "Guardar Reporte"
- Botón de editar (lápiz) en la tabla
- Botón de eliminar (basura) en la tabla

### 5. Iniciar Sesión como Admin y Verificar

**✅ Debe Ver:**
- Todos los botones visibles
- Funcionalidad completa de CRUD

---

## 🔒 Errores Solucionados

### Error 1: 403 Forbidden - Branches
```
GET http://localhost:3000/api/v1/branches 403 (Forbidden)
```

**Solución:**
- Asignado permiso `branches.read` (ID: 142) a rol vendedor
- ✅ RESUELTO

### Error 2: 403 Forbidden - Subcategories
```
GET http://localhost:3000/api/v1/subcategories 403 (Forbidden)
```

**Solución:**
- Creado permiso `subcategories.read`
- Asignado a rol vendedor
- ✅ RESUELTO

---

## 📁 Archivos Modificados

1. ✅ [template/src/views/pages/sales/coupons.vue](template/src/views/pages/sales/coupons.vue)
   - Importado `getCurrentUser`
   - Agregadas computed properties `currentUser` e `isVendedor`
   - Ocultos 4 botones con `v-if="!isVendedor"`

2. ✅ Base de Datos - Permisos
   - Asignado `branches.read` a vendedor
   - Creado y asignado `subcategories.read` a vendedor

---

## 📋 Permisos Actuales del Vendedor

```
✅ coupons.read         - Ver cupones (SIN editar/eliminar)
✅ offers.read          - Ver ofertas (SIN editar/eliminar)
✅ products.read        - Ver productos (SIN editar/eliminar)
✅ branches.read        - Ver sucursales
✅ subcategories.read   - Ver subcategorías
✅ pos.access           - Acceso al POS
✅ sales.create         - Crear ventas
✅ sales.read           - Ver ventas
... (26+ permisos totales)
```

---

## ⚠️ Próximos Pasos Recomendados

### 1. Aplicar Mismo Patrón a Ofertas

**Archivo:** `template/src/views/pages/offers/offers-list.vue`

**Cambios Necesarios:**
- Importar `getCurrentUser`
- Agregar computed property `isVendedor`
- Ocultar botones: "Agregar Oferta", "Editar", "Eliminar", "Guardar Reporte"

### 2. Aplicar Mismo Patrón a Productos

**Archivo:** `template/src/views/pages/inventory/product-list/product-list.vue`

**Cambios Necesarios:**
- Importar `getCurrentUser`
- Agregar computed property `isVendedor`
- Ocultar botones: "Agregar Producto", "Editar", "Eliminar", "Guardar Reporte"

---

## 🎉 IMPLEMENTACIÓN EXITOSA

**Estado:** ✅ COMPLETADO

Los cupones ahora están en modo **solo lectura** para vendedor y personal de bodega. Los errores 403 han sido resueltos y todos los botones de acción están ocultos correctamente.

**Fecha:** 2026-01-24

---

## 🔍 Notas Técnicas

### ¿Por qué incluir bodega/almacenista en isVendedor?

El computed property `isVendedor` incluye también los roles de bodega/almacenista porque estos roles tampoco deben poder modificar cupones. La lógica es:

```javascript
isVendedor() {
  // Roles que NO pueden modificar cupones
  return (
    this.currentUser.roles.includes('cashier') ||
    this.currentUser.roles.includes('vendedor') ||
    this.currentUser.roles.includes('warehouse') ||
    this.currentUser.roles.includes('almacenista') ||
    this.currentUser.roles.includes('bodega')
  );
}
```

**Solo el Administrador puede:**
- Crear cupones
- Editar cupones
- Eliminar cupones
- Guardar reportes

**Vendedor y Bodega solo pueden:**
- Ver cupones
- Ver detalles de cupones
