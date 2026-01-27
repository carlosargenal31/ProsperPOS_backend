# Corrección: Separación de Ventas en Efectivo vs Efectivo en Caja

## Problema Identificado

En la sección "FORMA DE PAGO" del arqueo, la columna de **EFECTIVO** estaba mostrando el total de efectivo disponible en caja (apertura + ventas - movimientos), cuando debería mostrar **únicamente las ventas en efectivo del día**.

### Ejemplo del error:
- Usuario reportó que EFECTIVO debería mostrar: **805** o **4,025** (solo ventas)
- Sistema mostraba: **3,680** (que incluía apertura y deducciones)

## Solución Implementada

Se crearon **dos valores separados** para diferenciar:

1. **`total_cash_sales`**: Solo las ventas en efectivo (sin apertura, sin deducciones)
2. **`total_cash`**: Efectivo disponible en caja (apertura + ventas - retiros - egresos - notas de crédito en efectivo)

---

## Cambios Realizados

### 1. Backend - `cash-register.model.js`

**Líneas 270-325**: Modificado el método `calculateSystemTotals`

#### Antes:
```javascript
const totals = {
  total_cash: 0, // Se usaba para todo
  total_card_credit: 0,
  // ...
};

sales.forEach(sale => {
  switch (method) {
    case 'EFECTIVO':
      totals.total_cash += amount; // Aquí se mezclaba ventas con apertura
      break;
    // ...
  }
});

totals.total_cash += parseFloat(session.opening_amount || 0); // Se sumaba apertura
```

#### Después:
```javascript
const totals = {
  total_cash_sales: 0, // ✅ NUEVO: Solo ventas en efectivo
  total_cash: 0,       // Efectivo disponible en caja
  total_card_credit: 0,
  // ...
};

sales.forEach(sale => {
  switch (method) {
    case 'EFECTIVO':
      totals.total_cash_sales += amount; // ✅ Solo ventas (SIN apertura)
      totals.total_cash += amount;        // También para cálculo de caja
      break;
    // ...
  }
});

// Apertura se suma SOLO a total_cash, NO a total_cash_sales
totals.total_cash += parseFloat(session.opening_amount || 0);
```

### 2. Frontend - `print-arqueo.vue`

**Líneas 403-413**: Actualizado el objeto `systemTotals` en data()

```javascript
systemTotals: {
  total_cash_sales: 0, // ✅ NUEVO: Solo ventas en efectivo
  total_cash: 0,       // Efectivo disponible en caja
  total_card_credit: 0,
  // ...
}
```

**Líneas 131-137**: Cambiado para usar `total_cash_sales` en la sección de EFECTIVO

```vue
<tr class="system-row">
  <td colspan="3" class="text-right"><strong>TOTAL SEGUN SISTEMA</strong></td>
  <!-- ANTES: systemTotals.total_cash -->
  <td class="text-right"><strong>{{ formatCurrency(systemTotals.total_cash_sales || 0) }}</strong></td>
</tr>
<tr class="difference-row">
  <td colspan="3" class="text-right"><strong>DIFERENCIA</strong></td>
  <!-- ANTES: getTotalCashCount() - systemTotals.total_cash -->
  <td class="text-right"><strong>{{ formatCurrency(getTotalCashCount() - (systemTotals.total_cash_sales || 0)) }}</strong></td>
</tr>
```

### 3. Frontend - `EditArqueoModal.vue`

**Línea 123**: Actualizado para usar `total_cash_sales`

```vue
<tr>
  <td><i class="ti ti-cash me-1"></i>EFECTIVO</td>
  <!-- ANTES: systemTotals.total_cash - formData.opening_amount -->
  <td class="text-end fw-medium">{{ formatCurrency(systemTotals.total_cash_sales || 0) }}</td>
</tr>
```

---

## Resultado Final

### Sección "VENTAS DEL DÍA (SEGÚN SISTEMA)"

Ahora la tabla de FORMA DE PAGO muestra correctamente:

| Forma de Pago | Total Ventas |
|---------------|--------------|
| EFECTIVO | **805.00** o **4,025.00** ✅ (solo ventas) |
| TRANSFERENCIA | 2,012.50 |
| TARJETA | xxx.xx |
| **TOTAL VENTAS** | **1,667.50** |

### Cálculos:

1. **EFECTIVO (en ventas)**:
   ```
   = Ventas en efectivo del día
   = 805.00 o 4,025.00
   ```

2. **EFECTIVO (disponible en caja)**:
   ```
   = Apertura + Ventas en efectivo - Retiros - Egresos - Notas de crédito (efectivo)
   = 3,000 + 4,025 - 2,000 - 300 - 3,622.50
   = 1,102.50
   ```

3. **TOTAL EN CAJA**:
   ```
   = TOTAL GENERAL - Retiros - Egresos - Devoluciones
   ```

---

## Archivos Modificados

1. ✅ [backend/src/models/cash-register.model.js](c:\Users\carlo\OneDrive\Escritorio\ProsperPOS\backend\src\models\cash-register.model.js#L270-L325)
   - Agregado campo `total_cash_sales`
   - Separada lógica de ventas vs efectivo en caja

2. ✅ [template/src/views/pages/cash-register/print-arqueo.vue](c:\Users\carlo\OneDrive\Escritorio\ProsperPOS\template\src\views\pages\cash-register\print-arqueo.vue#L131-L137)
   - Actualizado para usar `total_cash_sales` en sección EFECTIVO

3. ✅ [template/src/views/pages/cash-register/components/EditArqueoModal.vue](c:\Users\carlo\OneDrive\Escritorio\ProsperPOS\template\src\views\pages\cash-register\components\EditArqueoModal.vue#L123)
   - Actualizado para usar `total_cash_sales` en tabla de ventas

---

## Pruebas Recomendadas

1. ✅ Abrir un arqueo y verificar que EFECTIVO muestre solo ventas (805 o 4,025)
2. ✅ Verificar que APERTURA DE CAJA aparezca en su propia línea
3. ✅ Confirmar que TOTAL VENTAS no incluya la apertura
4. ✅ Validar que TOTAL EN CAJA sí incluya apertura + ventas - movimientos

---

**Fecha de corrección**: 2026-01-21
**Estado**: ✅ COMPLETADO
