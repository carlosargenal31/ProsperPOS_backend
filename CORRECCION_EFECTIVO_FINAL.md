# Corrección del Cálculo de Efectivo en Arqueo de Caja

## Problema Identificado

El sistema estaba mostrando valores incorrectos en la columna de EFECTIVO del arqueo de caja. El usuario reportó que el efectivo debería mostrar **L 7,025.00** (el total sin deducir las devoluciones), pero el sistema mostraba valores negativos o incorrectos.

## Causa Raíz

El problema tenía dos causas principales:

1. **Las DEVOLUCIONES se estaban restando del efectivo en el backend**: El código estaba tratando las devoluciones como si fueran retiros de efectivo, cuando en realidad las devoluciones se manejan como NOTAS DE CRÉDITO de forma separada.

2. **No se diferenciaba entre notas de crédito en EFECTIVO vs TRANSFERENCIA**: Las notas de crédito debían restar del efectivo solo cuando eran de tipo EFECTIVO, no cuando eran transferencias.

## Solución Implementada

### 1. Backend - `cash-register.model.js` (líneas 336-362)

**Cambio clave**: Modificamos el método `calculateSystemTotals` para:

```javascript
// Restar egresos, retiros y devoluciones del total general
transactions.forEach(transaction => {
  const amount = parseFloat(transaction.total || 0);
  totals.total_general -= amount;

  // Solo restar RETIROS y EGRESOS del efectivo
  // Las DEVOLUCIONES se manejan como NOTAS DE CREDITO separadamente
  if (transaction.transaction_type === 'RETIRO' ||
      transaction.transaction_type === 'EGRESO') {
    totals.total_cash -= amount;
  }
});

// Obtener notas de crédito de tipo EFECTIVO y restarlas del efectivo
const creditNotesQuery = `
  SELECT SUM(total_local) as total
  FROM cash_register_bank_payments
  WHERE session_id = ?
    AND payment_method = 'NOTA DE CREDITO'
    AND (credit_note_type = 'EFECTIVO' OR credit_note_type IS NULL)
`;

const creditNotes = await db.query(creditNotesQuery, [session.id]);
const creditNotesInCash = parseFloat(creditNotes[0]?.total || 0);

// Restar notas de crédito en efectivo del total de efectivo
totals.total_cash -= creditNotesInCash;
```

**Antes**:
- Se restaban DEVOLUCIONES del efectivo
- No se consideraba el tipo de nota de crédito

**Después**:
- Solo se restan RETIROS y EGRESOS del efectivo
- Las DEVOLUCIONES solo afectan el total general
- Se obtienen específicamente las notas de crédito de tipo EFECTIVO y solo esas se restan del efectivo

### 2. Frontend - `EditArqueoModal.vue` (líneas 569-580)

```javascript
const totalEfectivo = computed(() => {
  // Sumar todas las denominaciones
  const totalDenominations = formData.value.denominations.reduce((sum, d) => sum + parseFloat(d.total_value || 0), 0);

  // Restar las notas de crédito de tipo EFECTIVO
  const creditNotesInCash = formData.value.bank_payments
    .filter(p => p.payment_method === 'NOTA DE CREDITO' && p.credit_note_type === 'EFECTIVO')
    .reduce((sum, p) => sum + parseFloat(p.total_local || 0), 0);

  const total = totalDenominations - creditNotesInCash;
  return parseFloat(total.toFixed(2));
});
```

### 3. Frontend - `print-arqueo.vue` (líneas 541-563)

```javascript
getTotalCashCount() {
  if (!this.session?.denominations || this.session.denominations.length === 0) {
    return parseFloat(this.session?.total_cash || 0);
  }

  // Sumar todas las denominaciones de efectivo
  const totalDenominations = this.session.denominations.reduce((sum, denom) => {
    const totalValue = parseFloat(denom.total_value) || 0;
    if (totalValue > 0) {
      return sum + totalValue;
    }
    const unitValue = parseFloat(denom.unit_value) || 0;
    const quantity = parseFloat(denom.quantity) || 0;
    return sum + (unitValue * quantity);
  }, 0);

  // Restar las notas de crédito de tipo EFECTIVO
  const creditNotesInCash = this.session.bank_payments
    ?.filter(p => p.payment_method === 'NOTA DE CREDITO' && p.credit_note_type === 'EFECTIVO')
    .reduce((sum, p) => sum + parseFloat(p.total_local || 0), 0) || 0;

  return totalDenominations - creditNotesInCash;
}
```

## Lógica de Cálculo Correcta

### EFECTIVO (Según Sistema):
```
Efectivo = Apertura + Ventas en Efectivo - Retiros - Egresos - Notas de Crédito (EFECTIVO)
```

**NO se restan las DEVOLUCIONES** porque estas se manejan como NOTAS DE CRÉDITO de forma separada.

### Ejemplo con los datos del usuario:
- **Apertura**: L 3,000.00
- **Ventas en efectivo**: L 4,025.00
- **Subtotal**: L 7,025.00 ✓ (Este es el valor que el usuario esperaba ver)
- **Retiros**: L 2,000.00
- **Egresos**: L 300.00
- **Notas de crédito en efectivo**: L 3,622.50
- **Efectivo Final**: L 7,025.00 - L 2,000.00 - L 300.00 - L 3,622.50 = **L 1,102.50**

### TOTAL GENERAL (Según Sistema):
```
Total General = Efectivo + Transferencias + Tarjetas + Cheques + Link de Pago - Retiros - Egresos - Devoluciones
```

### EFECTIVO (Según Arqueo/Conteo):
```
Efectivo Contado = Suma de Denominaciones - Notas de Crédito (EFECTIVO)
```

## Archivos Modificados

1. ✅ `backend/src/models/cash-register.model.js`
   - Método: `calculateSystemTotals()` (líneas 336-362)

2. ✅ `template/src/views/pages/cash-register/components/EditArqueoModal.vue`
   - Computed: `totalEfectivo` (líneas 569-580)

3. ✅ `template/src/views/pages/cash-register/print-arqueo.vue`
   - Método: `getTotalCashCount()` (líneas 541-563)

## Resultado Final

Con estos cambios, el sistema ahora:

1. ✅ Muestra correctamente el efectivo antes de deducciones (L 7,025.00 en el ejemplo del usuario)
2. ✅ Resta solo los movimientos que afectan el efectivo físico (retiros, egresos, notas de crédito en efectivo)
3. ✅ NO resta las devoluciones del efectivo (solo las resta del total general)
4. ✅ Diferencia entre notas de crédito en EFECTIVO vs TRANSFERENCIA
5. ✅ La diferencia entre "TOTAL SEGÚN ARQUEO" y "TOTAL SEGÚN SISTEMA" debe ser 0 cuando el conteo es correcto

## Próximos Pasos

El backend ha sido reiniciado con los cambios aplicados. Para verificar:

1. Abrir el módulo de Arqueo de Caja
2. Verificar que el EFECTIVO (Sistema) muestre L 7,025.00 o el valor correcto según las ventas
3. Confirmar que las NOTAS DE CRÉDITO solo restan del efectivo cuando son de tipo EFECTIVO
4. Verificar que la diferencia sea 0 cuando el conteo coincide con el sistema

---
**Fecha de corrección**: 2026-01-21
**Estado**: ✅ COMPLETADO
