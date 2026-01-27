# Correcciones necesarias en purchase-book.vue

## 1. Filtro de Estado de Pago (Líneas 148-162)
**CAMBIAR:**
```vue
<option value="">Todos</option>
<option value="paid">Pagado</option>
<option value="pending">Pendiente</option>
<option value="partial">Abonos</option>
```

**POR:**
```vue
<option value="">Todos</option>
<option value="Completed">Completado</option>
<option value="Returned">Devuelto</option>
```

## 2. Agregar Columnas de Descuento y Recargo en la Tabla (Líneas 228-257)
**AGREGAR** después de la columna de subtotal (línea 244):
```vue
<th v-if="isColumnVisible('descuento')" @click="sortByColumn('descuento')" class="text-end cursor-pointer">
  Descuento <i :class="getSortIcon('descuento')"></i>
</th>
<th v-if="isColumnVisible('recargo')" @click="sortByColumn('recargo')" class="text-end cursor-pointer">
  Recargo <i :class="getSortIcon('recargo')"></i>
</th>
```

## 3. Agregar Celdas de Descuento y Recargo en tbody (Líneas 260-279)
**AGREGAR** después de `<td v-if="isColumnVisible('subtotal')" ...>` (línea 265):
```vue
<td v-if="isColumnVisible('descuento')" class="text-end">{{ formatCurrency(purchase.descuento) }}</td>
<td v-if="isColumnVisible('recargo')" class="text-end">{{ formatCurrency(purchase.recargo) }}</td>
```

## 4. Agregar Totales de Descuento y Recargo en tfoot (Líneas 287-299)
**AGREGAR** después de `<td v-if="isColumnVisible('subtotal')" ...>` (línea 293):
```vue
<td v-if="isColumnVisible('descuento')" class="text-end">{{ formatCurrency(totals.descuento_total) }}</td>
<td v-if="isColumnVisible('recargo')" class="text-end">{{ formatCurrency(totals.recargo_total) }}</td>
```

## 5. Actualizar availableColumns (Líneas 383-393)
**AGREGAR** después de la columna 'subtotal':
```javascript
{ key: 'descuento', label: 'Descuento', visible: true },
{ key: 'recargo', label: 'Recargo', visible: true },
```

## 6. Actualizar función getStatusBadgeClass (Líneas 510-518)
**CAMBIAR:**
```javascript
getStatusBadgeClass(status) {
  const classes = {
    paid: 'bg-success',
    pending: 'bg-warning',
    partial: 'bg-info',
    returned: 'bg-danger',
  };
  return classes[status] || 'bg-secondary';
},
```

**POR:**
```javascript
getStatusBadgeClass(status) {
  const classes = {
    'Completed': 'bg-success',  // Verde para completado
    'Returned': 'bg-danger',    // Rojo para devuelto
  };
  return classes[status] || 'bg-secondary';
},
```

## 7. Corregir función saveAsExcel (Líneas 535-598)
**CAMBIAR todas las referencias:**
- `pur.fecha_operacion` → `pur.fecha`
- `pur.almacen` → (eliminar, no existe en backend)
- `pur.nro_documento` → `pur.numero_factura`
- `pur.factura_proveedor` → (eliminar)
- `pur.impuesto` → `pur.isv`
- `pur.comprador` → `pur.usuario`
- `pur.abonado` y `pur.saldo` → (eliminar, no existen)
- Agregar `pur.descuento` y `pur.recargo`

**CÓDIGO CORRECTO:**
```javascript
const data = this.filteredPurchases.map(pur => ({
  'Fecha': pur.fecha,
  'Número Factura': pur.numero_factura,
  'Proveedor': pur.proveedor,
  'RTN': pur.rtn_proveedor || 'N/A',
  'Estatus': pur.estatus,
  'Subtotal': parseFloat(pur.subtotal || 0),
  'Descuento': parseFloat(pur.descuento || 0),
  'Recargo': parseFloat(pur.recargo || 0),
  'ISV': parseFloat(pur.isv || 0),
  'Total': parseFloat(pur.total || 0),
  'Usuario': pur.usuario
}));

data.push({
  'Fecha': '',
  'Número Factura': '',
  'Proveedor': '',
  'RTN': '',
  'Estatus': 'TOTALES',
  'Subtotal': this.totals.subtotal_total,
  'Descuento': this.totals.descuento_total,
  'Recargo': this.totals.recargo_total,
  'ISV': this.totals.isv_total,
  'Total': this.totals.total_total,
  'Usuario': ''
});
```

## 8. Corregir función saveAsPDF (Líneas 600-707)
**CAMBIAR todas las referencias en el HTML generado:**
- `pur.fecha_operacion.substring(0, 16)` → `pur.fecha`
- `pur.almacen` → (eliminar columna)
- `pur.nro_documento` → `pur.numero_factura`
- `pur.impuesto` → `pur.isv`
- `pur.flete` → `pur.recargo`
- `pur.saldo` → (eliminar columna)
- Agregar columna `pur.descuento`

**ESTRUCTURA DE TABLA CORRECTA:**
```html
<thead>
  <tr style="background-color: #4472C4; color: white; border-bottom: 2px solid #333;">
    <th style="padding: 8px 4px; text-align: left; border: 1px solid #ddd;">Fecha</th>
    <th style="padding: 8px 4px; text-align: left; border: 1px solid #ddd;">Nro Factura</th>
    <th style="padding: 8px 4px; text-align: left; border: 1px solid #ddd;">Proveedor</th>
    <th style="padding: 8px 4px; text-align: left; border: 1px solid #ddd;">Estatus</th>
    <th style="padding: 8px 4px; text-align: right; border: 1px solid #ddd;">Subtotal</th>
    <th style="padding: 8px 4px; text-align: right; border: 1px solid #ddd;">Descuento</th>
    <th style="padding: 8px 4px; text-align: right; border: 1px solid #ddd;">Recargo</th>
    <th style="padding: 8px 4px; text-align: right; border: 1px solid #ddd;">ISV</th>
    <th style="padding: 8px 4px; text-align: right; border: 1px solid #ddd;">Total</th>
  </tr>
</thead>
<tbody>
  ${this.filteredPurchases.map(pur => {
    const isReturn = pur.tipo_fila === 'DEVOLUCION';
    const statusColor = pur.estatus_raw === 'Completed' ? '#28a745' : (isReturn || pur.estatus_raw === 'Returned' ? '#dc3545' : '#333');

    return `
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 6px 4px; border: 1px solid #ddd; font-size: 9px;">${pur.fecha.substring(0, 10)}</td>
      <td style="padding: 6px 4px; border: 1px solid #ddd; font-size: 9px;">${pur.numero_factura}</td>
      <td style="padding: 6px 4px; border: 1px solid #ddd; font-size: 9px;">${pur.proveedor.substring(0, 30)}</td>
      <td style="padding: 6px 4px; border: 1px solid #ddd; font-size: 9px; color: ${statusColor}; font-weight: bold;">${pur.estatus}</td>
      <td style="padding: 6px 4px; text-align: right; border: 1px solid #ddd; font-size: 9px;">L ${this.formatCurrency(pur.subtotal)}</td>
      <td style="padding: 6px 4px; text-align: right; border: 1px solid #ddd; font-size: 9px;">L ${this.formatCurrency(pur.descuento)}</td>
      <td style="padding: 6px 4px; text-align: right; border: 1px solid #ddd; font-size: 9px;">L ${this.formatCurrency(pur.recargo)}</td>
      <td style="padding: 6px 4px; text-align: right; border: 1px solid #ddd; font-size: 9px;">L ${this.formatCurrency(pur.isv)}</td>
      <td style="padding: 6px 4px; text-align: right; border: 1px solid #ddd; font-size: 9px;">L ${this.formatCurrency(pur.total)}</td>
    </tr>
  `}).join('')}
</tbody>
<tfoot>
  <tr style="background-color: #4472C4; color: white; font-weight: bold; border-top: 2px solid #333;">
    <td colspan="4" style="padding: 10px 4px; border: 1px solid #ddd;">TOTALES</td>
    <td style="padding: 10px 4px; text-align: right; border: 1px solid #ddd;">L ${this.formatCurrency(this.totals.subtotal_total)}</td>
    <td style="padding: 10px 4px; text-align: right; border: 1px solid #ddd;">L ${this.formatCurrency(this.totals.descuento_total)}</td>
    <td style="padding: 10px 4px; text-align: right; border: 1px solid #ddd;">L ${this.formatCurrency(this.totals.recargo_total)}</td>
    <td style="padding: 10px 4px; text-align: right; border: 1px solid #ddd;">L ${this.formatCurrency(this.totals.isv_total)}</td>
    <td style="padding: 10px 4px; text-align: right; border: 1px solid #ddd;">L ${this.formatCurrency(this.totals.total_total)}</td>
  </tr>
</tfoot>
```

## 9. Corregir función saveAsImage (Líneas 708-800)
**Aplicar las mismas correcciones que en saveAsPDF**

## 10. Actualizar totals en data() (Líneas 362-370)
**AGREGAR:**
```javascript
descuento_total: 0,
recargo_total: 0,
```

## RESUMEN DE CAMBIOS

1. ✅ Filtro de estado: Solo "Completado" y "Devuelto"
2. ✅ Columnas: Agregar "Descuento" y "Recargo"
3. ✅ Colores: Verde para Completed, Rojo para Returned/DEVOLUCION
4. ✅ Campos corregidos: fecha, numero_factura, isv, usuario
5. ✅ Eliminados campos inexistentes: almacen, flete, saldo, abonado, factura_proveedor
6. ✅ Color del encabezado de tabla en PDF: #4472C4 (azul como libro de ventas)
