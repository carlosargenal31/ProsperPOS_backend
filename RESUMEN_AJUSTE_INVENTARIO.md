# Resumen: Sistema de Ajuste de Inventario - Corrección Completa

## Fecha: 2025-12-16

## Problema Original

El usuario reportó que al hacer un ajuste de inventario (por ejemplo, ajustar un producto a 5 unidades), cuando volvía a crear un nuevo ajuste, la "Existencia Teórica" aparecía en 0 en lugar de mostrar las 5 unidades del ajuste anterior.

## Diagnóstico

El problema tenía **DOS causas principales**:

### 1. Falta de filtro por `store_id` en la consulta de inventario

**Síntoma:** La existencia teórica no se cargaba correctamente desde la base de datos.

**Causa:** La tabla `stock` tiene la estructura:
- `product_id`
- `warehouse_id`
- `store_id`
- `quantity`

Pero la consulta SQL solo hacía JOIN por `product_id` y `warehouse_id`, ignorando el `store_id`. Esto causaba que:
- No se encontrara el stock correcto
- O se encontrara stock de otra tienda

**Solución:**
- Frontend ahora envía el `store_id` del usuario en la petición
- Backend filtra el subquery de stock por `store_id`
- El JOIN ahora incluye las tres claves: `product_id`, `warehouse_id`, `store_id`

### 2. Campo incorrecto al guardar el ajuste

**Síntoma:** Aunque se aplicara el ajuste, el stock no se actualizaba en la tabla `stock`.

**Causa:** En el método `createAdjustment`, al guardar los detalles del ajuste, se usaba:
```javascript
quantity_new: item.exist_nueva || 0  // ❌ exist_nueva NO viene del frontend
```

Como `exist_nueva` no existe en los datos del frontend, siempre era 0. Luego cuando se aplicaba el ajuste con `applyAdjustment`, se intentaba actualizar el stock con `detail.quantity_new` que era 0.

**Solución:**
```javascript
quantity_new: item.exist_fisica || 0  // ✓ exist_fisica es la cantidad ajustada
```

Ahora `quantity_new` contiene el valor correcto que el usuario ingresó como existencia física.

## Archivos Modificados

### 1. Frontend: `template/src/components/modal/stock-adjustment-modal.vue`

**Líneas 569-576:** Agregado de `store_id` a la petición
```javascript
// Obtener store_id del usuario
const userStr = localStorage.getItem('user');
if (userStr) {
  const user = JSON.parse(userStr);
  if (user.store_id) {
    params.append('store_id', user.store_id);
  }
}
```

### 2. Backend: `backend/src/controllers/inventory-adjustment.controller.js`

**Línea 32:** Agregado de `store_id` a los filtros
```javascript
store_id: req.query.store_id,
```

**Líneas 41-48:** Agregado de logging para debugging

### 3. Backend: `backend/src/services/inventory-adjustment.service.js`

**Cambios múltiples:**

a) **Línea 42:** Extracción de `store_id` de los filtros
```javascript
const { warehouse_id, store_id, product_id, ... } = filters;
```

b) **Líneas 55-57:** Agregado de parámetros para `store_id`
```javascript
// Los parámetros para el subquery de stock van primero
if (store_id) {
  params.push(store_id); // Para WHERE s.store_id = ?
  params.push(store_id); // Para AND stock_data.store_id = ?
}
```

c) **Líneas 120, 124:** Modificación del JOIN para incluir `store_id`
```sql
LEFT JOIN (
  SELECT ...
  FROM stock s
  ${store_id ? 'WHERE s.store_id = ?' : ''}
  GROUP BY s.product_id, s.warehouse_id, s.store_id
) stock_data ON stock_data.product_id = p.id
  AND stock_data.warehouse_id = w.id
  ${store_id ? 'AND stock_data.store_id = ?' : ''}
```

d) **Línea 300:** Corrección del valor de `quantity_new`
```javascript
item.exist_fisica || 0,  // quantity_new = exist_fisica (la cantidad ajustada)
```

e) **Líneas 303-305:** Eliminación de campos de costo
```javascript
0, // cost_before (no se usa)
0, // cost_actual (no se usa)
0  // cost_new (no se usa)
```

f) **Líneas 355-387:** Agregado de logging en `applyAdjustment`

## Flujo Completo Corregido

### Paso 1: Usuario crea ajuste de inventario
1. Selecciona bodega (warehouse_id = 1)
2. Carga productos con su existencia teórica desde tabla `stock`
3. Usuario ajusta "Producto X" de 0 a 5 unidades
4. Frontend envía:
   ```javascript
   {
     warehouse_id: 1,
     items: [{
       product_id: 123,
       exist_teorica: 0,    // Stock anterior
       exist_fisica: 5,     // Nueva cantidad ajustada
       diferencia: 5        // Diferencia
     }]
   }
   ```

### Paso 2: Backend guarda el ajuste
1. Crea registro en `inventory_adjustments` con estado "pending"
2. Crea registro en `inventory_adjustment_details`:
   - `quantity_before = 0` (exist_teorica)
   - `quantity_actual = 5` (exist_fisica)
   - `quantity_new = 5` ✓ (exist_fisica) **CORREGIDO**
   - `difference = 5`

### Paso 3: Usuario aplica el ajuste
1. Método `applyAdjustment` se ejecuta
2. Lee `quantity_new = 5` de la tabla de detalles
3. Busca en tabla `stock`:
   ```sql
   WHERE product_id = 123
   AND warehouse_id = 1
   AND store_id = 1
   ```
4. Si existe → UPDATE stock SET quantity = 5
5. Si no existe → INSERT INTO stock (quantity = 5)
6. Cambia estado del ajuste a "processed"

### Paso 4: Usuario crea nuevo ajuste (verificación)
1. Selecciona misma bodega
2. Frontend envía `store_id = 1` en la petición
3. Backend hace JOIN con filtro de `store_id`
4. Query retorna:
   ```javascript
   {
     product_id: 123,
     exist_teorica: 5,  // ✓ Correcto! Viene de tabla stock
     producto: "Producto X",
     bodega: "Bodega 101"
   }
   ```

## Estructura de Tablas Involucradas

### Tabla: `inventory_adjustments`
```sql
id, consecutive, issue_date, issuer, warehouse_id,
concept, total_items, status, created_by, updated_by
```

### Tabla: `inventory_adjustment_details`
```sql
id, adjustment_id, product_id, warehouse_id,
quantity_before,  -- exist_teorica (stock anterior)
quantity_actual,  -- exist_fisica (cantidad ajustada)
quantity_new,     -- exist_fisica (lo mismo, para aplicar al stock)
difference,       -- diferencia
cost_unit, cost_before, cost_actual, cost_new
```

### Tabla: `stock` (FUENTE DE VERDAD)
```sql
id, product_id, store_id, warehouse_id,
quantity,          -- Cantidad actual en inventario
reserved_quantity, -- Cantidad reservada
created_at, updated_at
```

**CLAVE COMPUESTA:** (product_id, store_id, warehouse_id)

## Verificación de Funcionamiento

Para verificar que todo funciona:

1. **Crear primer ajuste:**
   - Seleccionar bodega
   - Ajustar producto a 5 unidades
   - Guardar y aplicar ajuste
   - Verificar en consola del backend: "Updating existing stock from 0 to 5"

2. **Verificar en base de datos:**
   ```sql
   SELECT * FROM stock
   WHERE product_id = X
   AND warehouse_id = Y
   AND store_id = Z;
   ```
   Debe mostrar `quantity = 5`

3. **Crear segundo ajuste:**
   - Seleccionar misma bodega
   - Debe aparecer el producto con exist_teorica = 5
   - Ajustar a 10 unidades
   - Guardar y aplicar
   - Verificar que stock se actualiza a 10

## Scripts de Prueba Creados

1. **test-stock-query.js**: Prueba la consulta de stock con y sin store_id
2. **test-adjustment-flow.js**: Prueba el flujo completo de crear y aplicar ajuste

## Consideraciones Importantes

1. **Multi-tienda**: El sistema ahora soporta correctamente múltiples tiendas con inventarios independientes

2. **store_id es requerido**: Todas las consultas de stock deben incluir store_id

3. **Consistencia de datos**: La tabla `stock` es la ÚNICA fuente de verdad para cantidades de inventario

4. **Modelos legacy**: El archivo `stock.model.js` tiene métodos que NO consideran `store_id`. Estos métodos deben actualizarse si se usan en otras partes del sistema.

## Próximos Pasos Recomendados

1. ✓ **Corregir consultas de stock** para incluir `store_id` (COMPLETADO)
2. ✓ **Corregir guardado de ajustes** para usar `exist_fisica` en `quantity_new` (COMPLETADO)
3. ⚠️ **Actualizar stock.model.js** para incluir `store_id` en todos los métodos (PENDIENTE)
4. ⚠️ **Revisar product.service.js** y otros servicios que manipulen stock (PENDIENTE)
5. ⚠️ **Revisar sale.model.js** para asegurar que también filtra por `store_id` (PENDIENTE)

## Estado Actual

✅ **FUNCIONANDO CORRECTAMENTE**

El sistema de ajuste de inventario ahora:
- Guarda correctamente los ajustes en la base de datos
- Actualiza la tabla `stock` al aplicar ajustes
- Carga correctamente la existencia teórica en ajustes subsecuentes
- Filtra por tienda (store_id) correctamente
- Mantiene el inventario consistente entre ajustes
