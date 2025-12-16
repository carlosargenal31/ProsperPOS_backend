# Libro de Compras - Implementación Completada

## Resumen de Cambios

Se ha completado la implementación del **Libro de Compras** con las siguientes características:

### 1. ✅ Filtro de Estado de Pago Restringido

**Archivo:** `backend/src/services/purchase-book.service.js` (líneas 44-60)

- El filtro de estado de pago ahora **solo permite** dos valores:
  - `Completed` (Completado)
  - `Returned` (Devuelto)
- Los estados inválidos son filtrados automáticamente
- Se cambió de `p.payment_status` a `p.status` para usar el campo correcto

### 2. ✅ Columnas de Descuentos y Recargos

**Archivo:** `backend/src/services/purchase-book.service.js` (líneas 79-81)

Se agregaron las columnas:
- `descuento` - Muestra el monto de descuento aplicado
- `recargo` - Muestra el monto de recargo aplicado

### 3. ✅ Filas de Devoluciones con Notas de Crédito

**Archivo:** `backend/src/services/purchase-book.service.js` (líneas 97-124)

- Se implementó un **UNION ALL** similar al libro de ventas
- Las devoluciones se muestran como filas separadas con:
  - Tipo de fila: `DEVOLUCION`
  - Número de factura: `DEVOLUCION-XXXXXX`
  - Estatus: `NC-XXXXXX - FAC: COMP-XXXXXX` (muestra la nota de crédito y factura original)
  - Montos negativos para subtotal, descuento, ISV y total
- Las devoluciones se obtienen de la tabla `purchase_returns`

### 4. ✅ Totales Actualizados

**Archivo:** `backend/src/services/purchase-book.service.js` (líneas 131-166)

Los totales ahora incluyen:
- `total_compras` - Cantidad de compras
- `total_devoluciones` - Cantidad de devoluciones
- `subtotal_total` - Suma de subtotales
- `descuento_total` - Suma de descuentos
- `recargo_total` - Suma de recargos
- `isv_total` - Suma de ISV
- `total_total` - Suma de totales
- `total_devuelto` - Monto total devuelto (valor absoluto)

### 5. ✅ Exportación a PDF

**Archivos modificados:**
- `backend/src/controllers/purchase-book.controller.js` (líneas 83-103)
- `backend/src/services/purchase-book.service.js` (líneas 339-590)
- `backend/src/routes/purchase-book.routes.js` (líneas 39-46)

#### Características del PDF:

1. **Formato similar al Libro de Ventas:**
   - Orientación horizontal (landscape) tamaño LETTER
   - Márgenes de 30 puntos

2. **Encabezado:**
   - Logo/nombre de la compañía (color azul #4472C4)
   - RTN y teléfono
   - Título "LIBRO DE COMPRAS" (color azul)
   - Período de fechas

3. **Tabla con columnas:**
   - FECHA
   - NÚMERO
   - PROVEEDOR
   - RTN
   - SUBTOTAL
   - DESCUENTO ⭐ NUEVO
   - RECARGO ⭐ NUEVO
   - ISV
   - TOTAL
   - ESTATUS

4. **Colores y Estilo:**
   - Encabezado azul (#4472C4) con texto blanco
   - Filas alternas con fondo gris claro (#F2F2F2)
   - Devoluciones en color rojo (#DC143C)
   - Formato de moneda: `L #,##0.00`

5. **Filas de Devolución:**
   - Se muestran con color rojo
   - Estatus muestra: `NC-XXXXXX - FAC: COMP-XXXXXX`
   - Montos negativos

6. **Totales:**
   - Fila de totales con fondo azul
   - Resumen adicional mostrando:
     - Total de Compras
     - Total de Devoluciones
     - Total Devuelto

7. **Pie de página:**
   - Fecha y hora de generación
   - "Generado por ProsperPOS"

8. **Paginación automática:**
   - Repite encabezados en cada página

## Endpoints Disponibles

### GET /api/v1/purchase-book/export-pdf

**Query Parameters:**
- `date_from` - Fecha inicial (YYYY-MM-DD)
- `date_to` - Fecha final (YYYY-MM-DD)
- `supplier_id` - ID del proveedor (opcional)
- `payment_status` - Array de estados (Completed, Returned)
- `show_only_returns` - Mostrar solo devoluciones (true/false)

**Ejemplo:**
```
GET /api/v1/purchase-book/export-pdf?date_from=2024-01-01&date_to=2024-12-31&payment_status=Completed,Returned
```

**Respuesta:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename=libro-compras-2024-01-01-2024-12-31.pdf`

## Ejemplo de Uso desde el Frontend

```javascript
// Función para exportar a PDF
async function exportarLibroComprasPDF() {
  const filters = {
    date_from: '2024-01-01',
    date_to: '2024-12-31',
    payment_status: ['Completed', 'Returned']
  };

  const queryString = new URLSearchParams(filters).toString();
  const url = `/api/v1/purchase-book/export-pdf?${queryString}`;

  // Descargar el PDF
  window.open(url, '_blank');

  // O usando fetch para más control
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `libro-compras-${filters.date_from}-${filters.date_to}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
```

## Diferencias con el Libro de Ventas

| Característica | Libro de Ventas | Libro de Compras |
|---------------|-----------------|------------------|
| Tabla principal | `invoices` | `purchases_documents` |
| Tabla de devoluciones | `credit_notes` | `purchase_returns` |
| Columna de fecha | `issue_date` | `purchase_date` |
| Campo de estado | `payment_status` | `status` |
| Estados permitidos | Todos | Solo Completed y Returned |
| Columnas especiales | Recargos | Descuentos y Recargos |

## Archivos Modificados

1. ✅ `backend/src/services/purchase-book.service.js`
2. ✅ `backend/src/controllers/purchase-book.controller.js`
3. ✅ `backend/src/routes/purchase-book.routes.js`

## Próximos Pasos

Para el frontend, necesitarás:

1. Agregar botón "Guardar Reporte" o "Exportar PDF" en la vista del libro de compras
2. Actualizar los filtros para solo mostrar opciones "Completado" y "Devuelto"
3. Agregar columnas de "Descuento" y "Recargo" en la tabla
4. Implementar la lógica para llamar al endpoint `/api/v1/purchase-book/export-pdf`

## Validación

✅ Sintaxis verificada correctamente
✅ Controlador carga sin errores
✅ Servicio carga sin errores
✅ Rutas cargan sin errores
✅ Endpoint configurado: `/api/v1/purchase-book/export-pdf`

---

**Fecha de Completación:** 11 de diciembre de 2024
**Estado:** ✅ COMPLETADO
