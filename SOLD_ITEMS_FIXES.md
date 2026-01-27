# Correcciones al Módulo de Productos Vendidos

## Resumen
Se corrigieron todos los errores en el módulo de productos vendidos para que funcione correctamente con el esquema real de la base de datos.

## Problemas Encontrados y Solucionados

### 1. Error de Columnas en la Tabla `invoices`
**Problema**: El query intentaba acceder a columnas que no existen.
- `i.document_type` → No existe
- `i.invoice_date` → No existe

**Solución**:
- Cambiar `i.document_type = 'FACTURA'` por `i.invoice_type = 'factura'`
- Cambiar `i.invoice_date` por `i.issue_date`
- Agregar filtro `i.deleted_at IS NULL` para excluir registros eliminados

### 2. Error de Columnas en la Tabla `products`
**Problema**: El query intentaba acceder a `p.price` que no existe.
- La tabla `products` tiene `price_1`, `price_2`, ..., `price_6`

**Solución**:
- Cambiar `COALESCE(p.price, 0)` por `AVG(COALESCE(ii.unit_price, 0))`
- Usar el precio desde `invoice_items` que es el precio real al que se vendió

### 3. Error de Nombre de Tabla de Subcategorías
**Problema**: El query intentaba acceder a `sub_categories` (con guión bajo).
- La tabla real es `subcategories` (sin guión bajo)

**Solución**:
- Cambiar todas las referencias de `sub_categories` a `subcategories`
- Cambiar `p.sub_category_id` a `p.subcategory_id`

### 4. Error de Columna de Estado en Products
**Problema**: El query usaba `WHERE active = 1`.
- La columna real es `is_active`

**Solución**:
- Cambiar `WHERE active = 1` por `WHERE is_active = 1`

### 5. Error de Destructuring con db.query()
**Problema**: El servicio hacía destructuring doble del resultado.
```javascript
const [rows] = await db.query(...);  // ❌ INCORRECTO
```

**Solución**:
- El wrapper `db.query()` ya hace el destructuring internamente
- Cambiar a: `const rows = await db.query(...);` // ✅ CORRECTO

### 6. Error de GROUP BY con SQL Mode
**Problema**: MySQL en modo `ONLY_FULL_GROUP_BY` rechazaba la consulta.
- `ii.unit_price` no estaba en GROUP BY

**Solución**:
- Usar `AVG(COALESCE(ii.unit_price, 0))` en lugar de solo `ii.unit_price`
- Esto agrupa correctamente los precios cuando un producto se vende a diferentes precios

### 7. Nombres de Columnas Incorrectos
**Problema**: Varios nombres de columnas no coincidían con el esquema.

**Solución**:
- `ii.total_amount` → `ii.line_total`
- Usar COALESCE apropiadamente para manejar valores NULL

## Archivos Modificados

### backend/src/services/sold-items.service.js
- ✅ Corregido query principal
- ✅ Actualizado nombre de tablas (subcategories)
- ✅ Removido destructuring doble
- ✅ Cambiado `active` por `is_active`
- ✅ Usados nombres de columnas correctos

### Archivos de Prueba Creados
- `test-sold-items-schema.js` - Verificar esquema de tablas
- `test-sold-items-query.js` - Probar query SQL
- `test-sold-items-simple.js` - Prueba simple del query ✅
- `test-sold-items-service.js` - Prueba completa del servicio ✅

## Resultados de las Pruebas

### Query SQL - ✅ FUNCIONA
```
✓ Consulta ejecutada exitosamente!
✓ Registros encontrados: 10
✓ Total Final: L 173,226.23
```

### Servicio Completo - ✅ FUNCIONA
```
1. Consulta básica: ✓ 20 productos, L 198,933.87
2. Con categorías y marcas: ✓ Funciona correctamente
3. getProducts: ✓ 1,014 productos activos
4. getGroups: ✓ 24 categorías
5. getSubgroups: ✓ 83 subcategorías
```

## Query Final Corregido

```sql
SELECT
  COALESCE(p.code, '') AS codigo,
  p.name AS producto,
  SUM(COALESCE(ii.quantity, 0)) AS cantidad,
  AVG(COALESCE(ii.unit_price, 0)) AS precio,
  SUM(COALESCE(ii.subtotal, 0)) AS total_neto,
  SUM(COALESCE(ii.tax_amount, 0)) AS impuesto,
  SUM(COALESCE(ii.line_total, 0)) AS total_final
FROM invoice_items ii
INNER JOIN invoices i ON ii.invoice_id = i.id
INNER JOIN products p ON ii.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
LEFT JOIN brands b ON p.brand_id = b.id
WHERE i.invoice_type = 'factura'
  AND i.deleted_at IS NULL
  [+ filtros dinámicos]
GROUP BY p.id, p.code, p.name
ORDER BY cantidad DESC
```

## Estado Actual
✅ **COMPLETADO** - Todos los errores han sido corregidos y el servicio funciona correctamente.

## Próximos Pasos
1. ✅ Reiniciar el backend
2. ✅ Probar el endpoint completo desde el frontend
3. ✅ Verificar que los filtros funcionen correctamente
4. ⏳ Implementar exportación a Excel/PDF (opcional, está preparado pero no implementado)

## Notas Adicionales
- El frontend ya tiene implementados los headers de autenticación
- El modal de búsqueda de clientes está implementado
- Todos los filtros están conectados correctamente
- Las rutas existentes para branches, brands, warehouses y sellers son compatibles
