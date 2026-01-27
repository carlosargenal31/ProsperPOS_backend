# Filtro is_active Implementado en E-commerce

## ✅ Resumen

Se ha agregado exitosamente el filtro `is_active = 1` a todos los endpoints de productos del e-commerce. Ahora los productos que aparecen en la tienda en línea deben cumplir AMBAS condiciones:

1. **is_active = 1** (producto activo)
2. **show_in_online_store = 1** (mostrar en tienda en línea)

## 📋 Cambios Realizados

### Archivo Modificado
- `backend/src/controllers/ecommerce-products.controller.js`

### Métodos Actualizados (7 ubicaciones)

#### 1. getCatalog() - Línea 42
```javascript
// ANTES:
let whereClause = "WHERE p.deleted_at IS NULL AND p.show_in_online_store = 1";

// DESPUÉS:
let whereClause = "WHERE p.deleted_at IS NULL AND p.is_active = 1 AND p.show_in_online_store = 1";
```

#### 2. getProductDetails() - Línea 290
```javascript
// ANTES:
WHERE p.id = ? AND p.deleted_at IS NULL AND p.show_in_online_store = 1

// DESPUÉS:
WHERE p.id = ? AND p.deleted_at IS NULL AND p.is_active = 1 AND p.show_in_online_store = 1
```

#### 3. getFeaturedProducts() - Línea 488
```javascript
// Ya tenía p.is_active = 1, solo se agregó show_in_online_store = 1 previamente
WHERE p.is_active = 1
  AND p.deleted_at IS NULL
  AND p.is_featured = 1
  AND p.show_in_online_store = 1
```

#### 4. search() - Línea 553-556
```javascript
// ANTES:
WHERE p.deleted_at IS NULL
  AND p.show_in_online_store = 1
  AND (p.name LIKE ? OR p.code LIKE ? OR p.barcode LIKE ?)

// DESPUÉS:
WHERE p.deleted_at IS NULL
  AND p.is_active = 1
  AND p.show_in_online_store = 1
  AND (p.name LIKE ? OR p.code LIKE ? OR p.barcode LIKE ?)
```

#### 5. getSearchSuggestions() - Subcategorías (Línea 656-659)
```javascript
// ANTES:
WHERE s.name LIKE ?
  AND p.deleted_at IS NULL
  AND p.show_in_online_store = 1

// DESPUÉS:
WHERE s.name LIKE ?
  AND p.deleted_at IS NULL
  AND p.is_active = 1
  AND p.show_in_online_store = 1
```

#### 6. getSearchSuggestions() - Categorías (Línea 682-685)
```javascript
// ANTES:
WHERE c.name LIKE ?
  AND p.deleted_at IS NULL
  AND p.show_in_online_store = 1

// DESPUÉS:
WHERE c.name LIKE ?
  AND p.deleted_at IS NULL
  AND p.is_active = 1
  AND p.show_in_online_store = 1
```

#### 7. getSearchSuggestions() - Marcas (Línea 708-711)
```javascript
// ANTES:
WHERE b.name LIKE ?
  AND p.deleted_at IS NULL
  AND p.show_in_online_store = 1

// DESPUÉS:
WHERE b.name LIKE ?
  AND p.deleted_at IS NULL
  AND p.is_active = 1
  AND p.show_in_online_store = 1
```

## 📊 Estado Actual de Productos

Según verificación en base de datos:

- **✓ Productos visibles en e-commerce:** 1,015
  - Cumplen: `is_active = 1 AND show_in_online_store = 1`

- **✗ Productos inactivos (ocultos):** 2
  - `is_active = 0`

- **✗ Productos no mostrados en tienda:** 1
  - `show_in_online_store = 0` (el producto ID 144)

- **⚠ Productos activos pero ocultos:** 0
  - `is_active = 1 pero show_in_online_store = 0`

## 🎯 Comportamiento Final

### Productos que SÍ aparecerán en e-commerce:
- ✅ `is_active = 1`
- ✅ `show_in_online_store = 1`
- ✅ `deleted_at IS NULL`

### Productos que NO aparecerán en e-commerce:
- ❌ Si `is_active = 0` (producto inactivo)
- ❌ Si `show_in_online_store = 0` (oculto de tienda)
- ❌ Si `deleted_at IS NOT NULL` (eliminado)

## 🔍 Verificación

Script de verificación creado: `backend/verify-is-active-filter.js`

Para ejecutar:
```bash
cd backend
node verify-is-active-filter.js
```

## ✅ Completado

Todos los filtros han sido aplicados correctamente en los 7 métodos del controlador de productos e-commerce. El sistema ahora respeta ambas banderas de visibilidad.
