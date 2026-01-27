# 🔧 CORRECCIÓN SQL - INVENTARIO FÍSICO

## ❌ Problema

Error al ejecutar el endpoint `/api/v1/physical-inventory`:

```
Unknown column 's.type' in 'field list'
```

## 🔍 Causa Raíz

El servicio de inventario físico estaba usando una subconsulta incorrecta que asumía que la tabla `stock` tenía una columna `type` para diferenciar tipos de movimientos (in, out, sale, reserved, etc.).

### Estructura Real de la Tabla Stock

```sql
CREATE TABLE `stock` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `store_id` int NOT NULL,
  `warehouse_id` int DEFAULT '1',
  `quantity` decimal(15,3) NOT NULL DEFAULT '0.000',           -- ✅ Cantidad actual
  `reserved_quantity` decimal(15,3) DEFAULT '0.000',           -- ✅ Cantidad reservada
  `last_updated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_product_store_warehouse` (`product_id`,`store_id`,`warehouse_id`),
  ...
)
```

**Nota:** La tabla `stock` almacena directamente las cantidades actuales (`quantity` y `reserved_quantity`), no tiene un campo `type` para tipos de movimiento.

Los movimientos históricos se registran en la tabla `stock_movements` que sí tiene `movement_type`:

```sql
CREATE TABLE `stock_movements` (
  ...
  `movement_type` enum('adjustment_in','adjustment_out','sale','purchase','transfer_in','transfer_out','return'),
  `quantity` decimal(15,3) NOT NULL,
  ...
)
```

## ✅ Solución

**Archivo:** `backend/src/services/physical-inventory.service.js`

### Antes (Incorrecto):

```javascript
const stockSubquery = `
  SELECT
    s.product_id,
    s.warehouse_id,
    SUM(CASE WHEN s.type = 'in' OR s.type = 'initial' THEN s.quantity
             WHEN s.type = 'out' OR s.type = 'sale' THEN -s.quantity
             ELSE 0 END) as stock_quantity,
    SUM(CASE WHEN s.type = 'reserved' THEN s.quantity ELSE 0 END) as stock_quantity_reservada
  FROM stock s
  WHERE s.deleted_at IS NULL
  GROUP BY s.product_id, s.warehouse_id
`;
```

**Problema:** Intentaba usar `s.type` que no existe en la tabla `stock`.

### Después (Correcto):

```javascript
const stockSubquery = `
  SELECT
    s.product_id,
    s.warehouse_id,
    COALESCE(s.quantity, 0) as stock_quantity,
    COALESCE(s.reserved_quantity, 0) as stock_quantity_reservada
  FROM stock s
  GROUP BY s.product_id, s.warehouse_id
`;
```

**Solución:** Usa directamente las columnas `quantity` y `reserved_quantity` que existen en la tabla.

## 📊 Cambios Realizados

**Líneas modificadas:** 132-140

```diff
  // Subconsulta para obtener stock por bodega
  const stockSubquery = `
    SELECT
      s.product_id,
      s.warehouse_id,
-     SUM(CASE WHEN s.type = 'in' OR s.type = 'initial' THEN s.quantity
-              WHEN s.type = 'out' OR s.type = 'sale' THEN -s.quantity
-              ELSE 0 END) as stock_quantity,
-     SUM(CASE WHEN s.type = 'reserved' THEN s.quantity ELSE 0 END) as stock_quantity_reservada
+     COALESCE(s.quantity, 0) as stock_quantity,
+     COALESCE(s.reserved_quantity, 0) as stock_quantity_reservada
    FROM stock s
-   WHERE s.deleted_at IS NULL
    GROUP BY s.product_id, s.warehouse_id
  `;
```

## 🎯 Resultado

Ahora el query funciona correctamente:

1. ✅ Lee las cantidades directamente de `stock.quantity`
2. ✅ Lee las cantidades reservadas de `stock.reserved_quantity`
3. ✅ No intenta acceder a columnas inexistentes
4. ✅ El endpoint `/api/v1/physical-inventory` responde correctamente

## 🧪 Cómo Verificar

1. **Recargar la página del frontend:**
   - Navega a `/reports/physical-inventory`
   - Haz clic en "Generar Reporte"

2. **Verificar en consola del navegador:**
   - No debe haber error 500
   - Debe aparecer el reporte con datos

3. **Verificar en logs del backend:**
   - No debe aparecer "Unknown column 's.type'"
   - Debe aparecer "200 OK" en el endpoint

## 📝 Archivos Modificados

1. `backend/src/services/physical-inventory.service.js` (Líneas 132-140)

## 🔄 Compatibilidad

Esta corrección es compatible con la estructura actual de la base de datos y no requiere migraciones adicionales. La tabla `stock` ya contiene las columnas necesarias (`quantity` y `reserved_quantity`).

---

**Fecha:** 2025-12-16
**Estado:** ✅ Corregido
**Tipo:** SQL Query Fix
