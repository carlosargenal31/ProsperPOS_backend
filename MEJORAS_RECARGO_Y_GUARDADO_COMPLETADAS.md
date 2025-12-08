# MEJORAS DE RECARGO Y GUARDADO - COMPLETADAS

## Resumen de Cambios

Se han implementado las siguientes mejoras al sistema de documentos:

### ✅ 1. Guardado de FACTURA como Operación en Espera sin Duplicados

**Problema anterior:**
- Al importar una Operación en Espera y guardarla en modo FACTURA, se creaba un documento duplicado

**Solución implementada:**
- Ahora al guardar en modo FACTURA, se actualiza el mismo documento si viene de importación
- No se crean duplicados innecesarios

**Comportamiento:**
```
ANTES:
1. Importo "FACT EN ESPERA 0000000002"
2. Guardo en modo FACTURA
3. ❌ Se crea "FACT EN ESPERA 0000000003" (duplicado)

AHORA:
1. Importo "FACT EN ESPERA 0000000002"
2. Guardo en modo FACTURA
3. ✅ Se actualiza "FACT EN ESPERA 0000000002" (sin duplicado)
```

### ✅ 2. Campo Surcharge/Recargo en Documentos

**Cambios en Base de Datos:**

Se agregó la columna `surcharge` a las tablas:
- `pending_invoices`
- `quotes`

**SQL ejecutado:**
```sql
ALTER TABLE pending_invoices
ADD COLUMN IF NOT EXISTS surcharge DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER total;

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS surcharge DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER total;
```

### ✅ 3. Guardar y Cargar Recargo en Documentos

**Al guardar:**
- El campo `shipping_cost` del POS se guarda como `surcharge` en la base de datos
- Funciona tanto para Operaciones en Espera como para Cotizaciones

**Al importar:**
- Se carga automáticamente el `surcharge` guardado en el campo `shipping_cost` del POS
- El recargo se muestra correctamente en la interfaz

**Ejemplo:**
```
1. Agrego recargo de L 200 en el POS
2. Guardo como Cotización
3. ✅ Se guarda surcharge = 200
4. Importo esa cotización
5. ✅ Aparece recargo de L 200 en el POS
```

### ✅ 4. Resetear Recargo en Todos los Botones

El recargo (`shipping_cost`) se resetea a 0 en los siguientes casos:

1. **Al hacer clic en ELIMINAR** → Recargo = 0
2. **Después de guardar (cualquier tipo)** → Recargo = 0
3. **Después de cobrar (COBRO RÁPIDO o DETALLADO)** → Recargo = 0
4. **Al limpiar la factura (`clearInvoice()`)** → Recargo = 0

## Cambios en Código

### Backend

#### 1. `backend/database/add-surcharge-to-documents.sql`
```sql
-- Nuevas columnas agregadas
surcharge DECIMAL(15,2) NOT NULL DEFAULT 0
```

#### 2. `backend/src/controllers/pending-invoices.controller.js`

**Método `create()` actualizado:**
```javascript
const {
  // ... otros campos
  surcharge,  // ← AGREGADO
  // ...
} = req.body;

const insertSql = `
  INSERT INTO pending_invoices (
    // ... otros campos
    surcharge,  // ← AGREGADO
    // ...
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

await db.query(insertSql, [
  // ... otros valores
  surcharge || 0,  // ← AGREGADO
  // ...
]);
```

**Método `update()` actualizado:**
```javascript
const updateSql = `
  UPDATE pending_invoices SET
    // ... otros campos
    surcharge = ?,  // ← AGREGADO
    // ...
  WHERE id = ?
`;

await db.query(updateSql, [
  // ... otros valores
  surcharge || 0,  // ← AGREGADO
  // ...
]);
```

#### 3. `backend/src/controllers/quotes.controller.js`

**Mismo patrón aplicado:**
- Método `create()` actualizado con campo `surcharge`
- Método `update()` actualizado con campo `surcharge`

### Frontend

#### 1. `template/src/views/pages/pos/pos-invoice.vue`

**Método `saveAsQuote()` actualizado:**
```javascript
const quoteData = {
  // ... otros campos
  surcharge: this.invoice.shipping_cost || 0,  // ← AGREGADO
  // ...
};
```

**Método `saveAsPendingInvoice()` actualizado:**
```javascript
const pendingInvoiceData = {
  // ... otros campos
  surcharge: this.invoice.shipping_cost || 0,  // ← AGREGADO
  // ...
};
```

**Método `importDocument()` actualizado:**
```javascript
// Cargar el recargo (surcharge) si existe
if (docData.surcharge !== undefined && docData.surcharge !== null) {
  this.invoice.shipping_cost = parseFloat(docData.surcharge) || 0;
}
```

**Método `clearInvoice()` actualizado:**
```javascript
this.invoice.items = [];
this.invoice.shipping_cost = 0; // ← AGREGADO - Resetear recargo
this.currentProduct = {
  // ...
};
```

## Casos de Uso Completos

### Caso 1: Guardar Cotización con Recargo
```
1. Usuario crea una cotización
2. Agrega productos por L 1,000
3. Agrega recargo de L 200
4. Total: L 1,200
5. Hace clic en "Guardar como Cotización"
6. ✅ Se guarda cotización con surcharge = 200
7. ✅ El carrito se limpia y recargo vuelve a 0
```

### Caso 2: Importar y Re-guardar Cotización
```
1. Usuario importa "COTIZACION 0000000003" (con recargo de L 200)
2. ✅ Aparece recargo de L 200 en el POS
3. Usuario modifica productos
4. Hace clic en "Guardar como Cotización"
5. ✅ Se actualiza la misma cotización (no se crea duplicado)
6. ✅ Se mantiene el recargo de L 200
```

### Caso 3: Importar Factura en Espera y Guardar
```
1. Usuario importa "FACT EN ESPERA 0000000002" (con recargo de L 150)
2. ✅ Aparece recargo de L 150 en el POS
3. Usuario está en modo FACTURA
4. Hace clic en "GUARDAR"
5. ✅ Se actualiza "FACT EN ESPERA 0000000002" (no duplica)
6. ✅ Se mantiene el recargo de L 150
```

### Caso 4: Cobrar Documento con Recargo
```
1. Usuario importa documento con recargo de L 300
2. ✅ Aparece recargo de L 300
3. Hace clic en "COBRO RÁPIDO"
4. ✅ Se procesa el pago (total incluye recargo)
5. ✅ Se elimina el documento importado
6. ✅ Recargo vuelve a 0
```

## Archivos Modificados

### Backend
1. ✅ `backend/database/add-surcharge-to-documents.sql` - NUEVO
2. ✅ `backend/src/controllers/pending-invoices.controller.js` - MODIFICADO
   - Método `create()` - Agregado campo surcharge
   - Método `update()` - Agregado campo surcharge
3. ✅ `backend/src/controllers/quotes.controller.js` - MODIFICADO
   - Método `create()` - Agregado campo surcharge
   - Método `update()` - Agregado campo surcharge

### Frontend
1. ✅ `template/src/views/pages/pos/pos-invoice.vue` - MODIFICADO
   - Método `saveAsQuote()` - Envía surcharge
   - Método `saveAsPendingInvoice()` - Envía surcharge
   - Método `importDocument()` - Carga surcharge
   - Método `clearInvoice()` - Resetea shipping_cost a 0

## Ventajas del Sistema

1. ✅ **No hay duplicados** - Guardar documentos importados actualiza el original
2. ✅ **Recargo persistente** - El recargo se guarda y se carga correctamente
3. ✅ **Interfaz limpia** - El recargo se resetea automáticamente después de cada operación
4. ✅ **Flujo natural** - El usuario puede modificar documentos sin crear duplicados
5. ✅ **Trazabilidad** - Todos los cargos adicionales se rastrean correctamente

## Estado Final

**🎉 TODOS LOS CAMBIOS COMPLETADOS Y PROBADOS**

- ✅ Guardado de FACTURA sin duplicados
- ✅ Campo surcharge agregado a base de datos
- ✅ Guardar recargo en documentos
- ✅ Cargar recargo al importar
- ✅ Resetear recargo después de cada operación

---

**Fecha de Implementación**: 2025-11-18
**Desarrollador**: Claude Code
**Sistema**: ProsperPOS - Punto de Venta
**Versión**: 3.1 - Mejoras de Recargo y Guardado
