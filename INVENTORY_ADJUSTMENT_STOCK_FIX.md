# Fix: Ajuste de Inventario - Actualización de Stock

## Problema Identificado

Cuando se aplicaba un ajuste de inventario, los datos se guardaban en las tablas `inventory_adjustments` y `inventory_adjustment_details`, pero **NO se actualizaba la tabla `stock`** que es la fuente de verdad para el inventario.

Esto causaba que:
- Al hacer un ajuste de 5 unidades de un producto
- Y luego crear un nuevo ajuste
- La "Existencia Teórica" aparecía en 0 en lugar de 5

## Causa Raíz

El campo `quantity_new` en la tabla `inventory_adjustment_details` se estaba llenando con `item.exist_nueva` que **NO venía del frontend**, causando que siempre fuera 0 o NULL.

El frontend enviaba:
- `exist_teorica`: Existencia teórica (stock actual en base de datos)
- `exist_fisica`: Existencia física (cantidad ajustada por el usuario)
- `diferencia`: Diferencia entre física y teórica

Pero el backend intentaba guardar:
- `quantity_before`: exist_teorica ✓
- `quantity_actual`: exist_fisica ✓
- `quantity_new`: exist_nueva ✗ (no existe en el frontend)

## Solución Implementada

### 1. Corrección en createAdjustment (inventory-adjustment.service.js:300)

**ANTES:**
```javascript
item.exist_nueva || 0,  // quantity_new - siempre 0
```

**DESPUÉS:**
```javascript
item.exist_fisica || 0,  // quantity_new = exist_fisica (cantidad ajustada)
```

### 2. Flujo Completo

1. **Usuario ajusta inventario:**
   - Producto X: Existencia Teórica = 0, Existencia Física = 5
   - Se guarda en `inventory_adjustment_details` con `quantity_new = 5`

2. **Al aplicar el ajuste (applyAdjustment):**
   - Se lee `quantity_new` de la tabla de detalles
   - Se actualiza o inserta en la tabla `stock`:
     ```sql
     UPDATE stock SET quantity = 5
     WHERE product_id = X AND warehouse_id = Y AND store_id = Z
     ```

3. **Próximo ajuste:**
   - Al cargar inventario, la consulta hace JOIN con la tabla `stock`
   - Existencia Teórica ahora muestra 5 (el valor guardado en `stock`)

### 3. Logging Agregado

Se agregaron logs en el método `applyAdjustment` para debugging:
```javascript
console.log('Applying adjustment for product:', {
  product_id: detail.product_id,
  warehouse_id: detail.warehouse_id,
  store_id: storeId,
  quantity_before: detail.quantity_before,
  quantity_new: detail.quantity_new
});
```

## Archivos Modificados

1. **backend/src/services/inventory-adjustment.service.js**
   - Línea 300: Cambio de `exist_nueva` a `exist_fisica` para `quantity_new`
   - Líneas 303-305: Eliminación de campos de costo (no se usan)
   - Líneas 355-361: Agregado de logging en `applyAdjustment`
   - Líneas 370-379: Agregado de logging en UPDATE/INSERT de stock

## Estructura de Datos

### Frontend (stock-adjustment-modal.vue)
```javascript
{
  product_id: 123,
  exist_teorica: 0,     // Stock actual en DB
  exist_fisica: 5,      // Cantidad ajustada por usuario
  diferencia: 5         // Física - Teórica
}
```

### Backend - inventory_adjustment_details
```sql
quantity_before = exist_teorica (0)
quantity_actual = exist_fisica (5)
quantity_new = exist_fisica (5)  -- CORREGIDO
difference = diferencia (5)
```

### Backend - stock
```sql
product_id = 123
warehouse_id = 1
store_id = 1
quantity = 5  -- Actualizado desde quantity_new
```

## Verificación

Para verificar que funciona correctamente:

1. Crear un ajuste de inventario con 5 unidades de un producto
2. Aplicar el ajuste
3. Crear un nuevo ajuste para el mismo producto en la misma bodega
4. La "Existencia Teórica" debe mostrar 5

## Notas Adicionales

- El sistema ahora mantiene correctamente el inventario en la tabla `stock`
- Cada ajuste actualiza el stock real en la base de datos
- Los ajustes subsecuentes leen el stock correcto de la tabla `stock`
- El filtro por `store_id` asegura que cada tienda tenga su propio inventario independiente
