# 🔍 DEPURACIÓN CAMPOS ADICIONALES EN REIMPRESIONES

## 📊 ESTADO ACTUAL - 19 de Enero 2026, 20:15

### ✅ VERIFICACIONES COMPLETADAS

1. **Base de Datos** ✅
   - Las columnas existen en la tabla `invoices`:
     - `orden_compra` (varchar 100)
     - `constancia_exonerado` (varchar 100)
     - `registro_sag` (varchar 100)

2. **Datos en BD** ✅
   - Factura ID 59 (000-002-01-00040010) tiene los valores:
     - orden_compra: "hola 19"
     - constancia_exonerado: "hola 29"
     - registro_sag: "hola 39"

3. **Query del Backend** ✅
   - El SELECT en `getInvoiceDetails()` SÍ devuelve los campos correctamente
   - Verificado con script de simulación

### 🔧 CAMBIOS REALIZADOS

#### Backend - [backend/src/controllers/reprint.controller.js](backend/src/controllers/reprint.controller.js)

**1. Líneas 106-108** - Agregados en listado de facturas:
```javascript
i.orden_compra,
i.constancia_exonerado,
i.registro_sag,
```

**2. Líneas 438-440** - Agregados en detalles de factura:
```javascript
i.orden_compra,
i.constancia_exonerado,
i.registro_sag,
```

**3. Líneas 460-467** - Logs de depuración al cargar factura:
```javascript
// DEBUG: Ver campos adicionales
console.log('=== DEBUG REPRINT INVOICE ===');
console.log('Invoice ID:', invoice.id);
console.log('Invoice Number:', invoice.invoice_number);
console.log('orden_compra:', invoice.orden_compra);
console.log('constancia_exonerado:', invoice.constancia_exonerado);
console.log('registro_sag:', invoice.registro_sag);
console.log('============================');
```

**4. Líneas 337-345** - Logs antes de enviar al frontend:
```javascript
// DEBUG: Ver qué se está enviando al frontend
if (documentType === 'FACTURA') {
  console.log('=== ENVIANDO AL FRONTEND ===');
  console.log('Invoice ID:', documentData.id);
  console.log('orden_compra:', documentData.orden_compra);
  console.log('constancia_exonerado:', documentData.constancia_exonerado);
  console.log('registro_sag:', documentData.registro_sag);
  console.log('===========================');
}
```

#### Frontend - [template/src/views/pages/sales/reprint.vue](template/src/views/pages/sales/reprint.vue)

**1. Líneas 1058-1060** - ELIMINADAS (aparecían arriba cerca del cliente)

**2. Líneas 1471-1473** - Posición correcta (abajo, cerca de fecha límite):
```javascript
<strong>No. Correlativo de la Orden de Compra Exenta:</strong> ${this.selectedDocument.orden_compra || 'N/A'}<br>
<strong>No. Correlativo de la Constancia del Reg Exonerado:</strong> ${this.selectedDocument.constancia_exonerado || 'N/A'}<br>
<strong>No. Identificativo del Registro SAG:</strong> ${this.selectedDocument.registro_sag || 'N/A'}
```

**3. Líneas 636-638** - Logs en consola del navegador (ya existían):
```javascript
console.log('Orden Compra:', this.selectedDocument.orden_compra);
console.log('Constancia Exonerado:', this.selectedDocument.constancia_exonerado);
console.log('Registro SAG:', this.selectedDocument.registro_sag);
```

### 🧪 PRUEBAS A REALIZAR

Para verificar que todo funciona:

1. **Abrir Reimpresiones**: `http://localhost:3001/#/sales/reprint`
2. **Buscar factura**: 000-002-01-00040010
3. **Hacer clic en "Ver"**

**Esperado en consola del backend:**
```
=== DEBUG REPRINT INVOICE ===
Invoice ID: 59
Invoice Number: 000-002-01-00040010
orden_compra: hola 19
constancia_exonerado: hola 29
registro_sag: hola 39
============================

=== ENVIANDO AL FRONTEND ===
Invoice ID: 59
orden_compra: hola 19
constancia_exonerado: hola 29
registro_sag: hola 39
===========================
```

**Esperado en consola del navegador (F12):**
```
=== DATOS DEL DOCUMENTO ===
Orden Compra: hola 19
Constancia Exonerado: hola 29
Registro SAG: hola 39
===========================
```

**Esperado en la impresión:**
Los campos deben aparecer ABAJO (cerca de "Fecha Límite de Emisión Vigente"):
```
Fecha Límite de Emisión Vigente: 31/12/2025
No. Correlativo de la Orden de Compra Exenta: hola 19
No. Correlativo de la Constancia del Reg Exonerado: hola 29
No. Identificativo del Registro SAG: hola 39
```

### ⚙️ CONFIGURACIÓN ACTUAL

- Backend: Puerto 3000 ✅
- Frontend: Puerto 3001 ✅
- Base de datos: MySQL local (prosper_pos) ✅

### 📝 SCRIPTS DE VERIFICACIÓN CREADOS

1. `backend/test-reprint-campos.js` - Verifica facturas con campos adicionales
2. `backend/check-invoice-with-fields.js` - Lista últimas facturas y sus campos
3. `backend/test-reprint-api-simulation.js` - Simula el query exacto de la API

### 🎯 PRÓXIMOS PASOS

1. Usuario debe abrir la factura en el navegador
2. Verificar logs del backend (CMD)
3. Verificar logs del navegador (F12 → Console)
4. Si los logs muestran los valores correctos pero la impresión no, el problema está en el HTML del frontend
5. Si los logs del backend no muestran los valores, hay un problema con la conexión a BD

---

**Estado:** EN PRUEBAS
**Fecha:** 19/01/2026
**Hora:** 20:15
