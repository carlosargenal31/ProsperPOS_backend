# Columna "Devuelto" en Libro de Ventas - Completado

## 📋 Resumen
Se ha agregado exitosamente una columna "Devuelto" en el Libro de Ventas que muestra:
- **0.00** para facturas que no han sido devueltas
- **El monto devuelto** para facturas que tienen devoluciones asociadas (notas de crédito)

## 🔧 Cambios Realizados

### Backend (Node.js)

#### 1. Servicio de Libro de Ventas
**Archivo:** `backend/src/services/sales-book.service.js`

**Cambios:**
- Se agregó un subquery en la consulta principal para calcular el monto devuelto por factura:
  ```sql
  COALESCE(
    (SELECT ABS(SUM(cn.total))
     FROM credit_notes cn
     WHERE cn.invoice_id = i.id
     AND cn.deleted_at IS NULL),
    0
  ) as devuelto
  ```
- Se agregó la columna `devuelto` también en el UNION ALL para las devoluciones (notas de crédito)
- Se actualizó la función `exportSalesBook()` para incluir la columna "Devuelto" en las exportaciones

### Frontend (Vue.js)

#### 2. Componente de Libro de Ventas
**Archivo:** `template/src/views/pages/reports/sales-book.vue`

**Cambios:**

1. **Columnas disponibles**: Se agregó la columna "Devuelto" a la lista de columnas configurables
   ```javascript
   { key: 'devuelto', label: 'Devuelto', visible: true }
   ```

2. **Encabezado de tabla**: Se agregó el header ordenable para la columna
   ```html
   <th v-if="isColumnVisible('devuelto')" @click="sortByColumn('devuelto')" class="text-end cursor-pointer">
     Devuelto <i :class="getSortIcon('devuelto')"></i>
   </th>
   ```

3. **Datos de tabla**: Se agregó la celda con formato condicional (rojo cuando hay devolución)
   ```html
   <td v-if="isColumnVisible('devuelto')" class="text-end" :class="{ 'text-danger fw-bold': invoice.devuelto > 0 }">
     {{ formatCurrency(invoice.devuelto || 0) }}
   </td>
   ```

4. **Footer de totales**: Se agregó la celda de totales en rojo
   ```html
   <td v-if="isColumnVisible('devuelto')" class="text-end text-danger">
     {{ formatCurrency(totals.total_devuelto || 0) }}
   </td>
   ```

5. **Ordenamiento**: Se agregó 'devuelto' a la lista de columnas numéricas para ordenamiento correcto

6. **Reportes (PDF/Imagen)**: Se actualizó `buildSalesBookHTML()` para incluir la columna en reportes
   - Columna "Devuelto" con formato rojo cuando hay devolución
   - Total devuelto en el footer en rojo

7. **Exportación Excel**: Se actualizó `saveAsExcel()` para incluir:
   - Columna "Devuelto" en los datos
   - Total devuelto en la fila de totales

## 📊 Comportamiento

### Para Facturas Normales (Sin Devoluciones)
- La columna "Devuelto" muestra **0.00**
- El texto se muestra en color normal

### Para Facturas con Devoluciones Parciales o Totales
- La columna "Devuelto" muestra el **monto total devuelto** (suma de todas las notas de crédito asociadas)
- El texto se muestra en **rojo y negrita** para llamar la atención
- Ejemplo: Si una factura de L 1,000 tiene una devolución de L 500, mostrará:
  - Total: L 1,000.00
  - Devuelto: **L 500.00** (en rojo)

### Para Notas de Crédito (Filas de Devolución)
- La columna "Devuelto" muestra el **valor absoluto del total de la nota de crédito**
- Se muestra en rojo y negrita

## 🎨 Características de Visualización

1. **Columna Configurable**: Los usuarios pueden ocultar/mostrar la columna usando el selector de columnas
2. **Ordenamiento**: Se puede ordenar por la columna "Devuelto" de forma ascendente o descendente
3. **Formato Monetario**: Usa el mismo formato que las demás columnas monetarias (con separadores de miles)
4. **Totales**: El footer muestra el total devuelto de todas las facturas en rojo
5. **Exportaciones**: La columna se incluye en todas las exportaciones (Excel, PDF, Imagen, Impresión)

## 🔍 Validaciones

### Consulta SQL
- Usa un subquery para calcular el total devuelto por cada factura
- Usa `ABS(SUM(cn.total))` para obtener el valor absoluto
- Maneja correctamente facturas sin devoluciones (retorna 0)

### Frontend
- Maneja valores null/undefined con `|| 0`
- Aplica formato condicional solo cuando `devuelto > 0`
- Incluye la columna en todos los reportes y exportaciones

## ✅ Beneficios

1. **Visibilidad Mejorada**: Ahora es fácil identificar qué facturas tienen devoluciones
2. **Análisis Más Completo**: Se puede ver el impacto de las devoluciones directamente en cada factura
3. **Reportes Completos**: Todas las exportaciones incluyen esta información
4. **Flexibilidad**: La columna se puede ocultar si no se necesita

## 🚀 Uso

1. **Ver el Libro de Ventas**: Navegar a Reportes > Libro de Ventas
2. **Columna Visible por Defecto**: La columna "Devuelto" estará visible automáticamente
3. **Ocultar/Mostrar**: Usar el botón "Columnas" para configurar la visibilidad
4. **Ordenar**: Hacer clic en el encabezado "Devuelto" para ordenar por esta columna
5. **Exportar**: La columna se incluirá automáticamente en todas las exportaciones

## 📝 Notas Técnicas

- El cálculo se hace mediante un subquery en SQL para optimizar el rendimiento
- No se requieren cambios en la estructura de la base de datos
- Compatible con el sistema actual de notas de crédito
- Mantiene la consistencia con el total devuelto mostrado en las tarjetas superiores

---

**Fecha de implementación:** 23 de enero de 2026
**Estado:** ✅ Completado y listo para usar
