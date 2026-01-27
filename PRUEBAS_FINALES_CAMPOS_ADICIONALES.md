# 🧪 PRUEBAS FINALES - CAMPOS ADICIONALES

## ✅ CAMBIOS COMPLETADOS

### 1. **Problema de Numeración** - ✅ CORREGIDO
- **Cotizaciones**: Ahora usa `MAX(id)` en lugar de `COUNT(*)`
- **Facturas en Espera**: Ahora usa `MAX(id)` en lugar de `COUNT(*)`
- **Resultado**: ID 28 = Número 0000000028 (CORRECTO)

### 2. **Guardado de Campos en Facturas** - ✅ CORREGIDO
- **Problema**: El frontend enviaba formato incorrecto al backend
- **Solución**: Ahora envía `{ invoice_data, items }` según lo esperado
- **Archivo modificado**: `template/src/views/pages/pos/pos-invoice.vue` (líneas 4449-4473)

### 3. **Visualización en Impresiones** - ⚠️ REQUIERE PRUEBA
- Los campos YA están implementados en el HTML de impresión
- El backend YA trae todos los campos con `SELECT *`
- **Necesita verificación manual desde el navegador**

---

## 🔍 CÓMO PROBAR

### PASO 1: Crear Cotización con Campos Adicionales

1. Abre **POS Facturación** en el navegador
   ```
   http://localhost:8080/#/pos-facturacion
   ```

2. **Selecciona Cliente** (cualquiera)

3. **Agrega productos** a la cotización

4. **Haz clic en "OPCIONES"** (botón arriba a la derecha)

5. **Ingresa valores de prueba**:
   ```
   Orden de Compra: PRUEBA-ORDEN-001
   Constancia Exonerado: PRUEBA-CONST-002
   Registro SAG: PRUEBA-SAG-003
   ```

6. **Haz clic en "GUARDAR COMO COTIZACIÓN"**

7. **Anota el número** de cotización que aparece

### PASO 2: Verificar en Base de Datos

```sql
-- Obtener la última cotización creada
SELECT
  id,
  quote_number,
  orden_compra,
  constancia_exonerado,
  registro_sag
FROM quotes
ORDER BY id DESC
LIMIT 1;
```

**Resultado Esperado**:
```
id: 29 (o el siguiente)
quote_number: 0000000029
orden_compra: PRUEBA-ORDEN-001
constancia_exonerado: PRUEBA-CONST-002
registro_sag: PRUEBA-SAG-003
```

### PASO 3: Verificar en Reimpresiones

1. Ve a **Ventas > Reimpresiones**

2. **Selecciona "COTIZACIÓN"** como tipo de documento

3. **Busca** la cotización que acabas de crear

4. **Haz clic en "VER/IMPRIMIR"**

5. **Abre la consola del navegador** (F12)

6. **Busca en la consola** el log:
   ```
   === DATOS DEL DOCUMENTO ===
   Orden Compra: PRUEBA-ORDEN-001
   Constancia Exonerado: PRUEBA-CONST-002
   Registro SAG: PRUEBA-SAG-003
   ```

7. **Haz clic en "IMPRIMIR"**

8. **Verifica en la vista previa** que los campos aparezcan:
   ```
   No. Correlativo de la Orden de Compra Exenta: PRUEBA-ORDEN-001
   No. Correlativo de la Constancia del Reg Exonerado: PRUEBA-CONST-002
   No. Identificativo del Registro SAG: PRUEBA-SAG-003
   ```

### PASO 4: Probar Factura en Espera

Repite los pasos 1-8 pero en el paso 6 elige **"GUARDAR COMO FACTURA EN ESPERA"**

### PASO 5: Probar Factura

Repite los pasos 1-8 pero en el paso 6 elige **"FACTURAR"** (o el botón de pago)

---

## 🐛 SI LOS CAMPOS NO APARECEN EN LA IMPRESIÓN

### Posible Causa 1: Los datos no están llegando al frontend

**Verificar en consola del navegador**:
```javascript
// Deberías ver esto en la consola cuando abres el documento en reimpresiones:
=== DATOS DEL DOCUMENTO ===
Orden Compra: PRUEBA-ORDEN-001   // ← Si esto es undefined, el backend no está enviando los datos
```

**Solución**: Verifica que el backend esté trayendo los campos en el SELECT

### Posible Causa 2: El HTML no está renderizando los campos

**Verificar**: Inspecciona el HTML generado para la impresión

**Archivos a verificar**:
- `template/src/views/pages/sales/reprint.vue` (líneas 1055-1057, 1471-1473)
- `template/src/views/pages/finance/account-statement.vue` (líneas 1586-1588, 1945-1947)

### Posible Causa 3: Cache del navegador

**Solución**: Limpia el caché del navegador
```
Ctrl + Shift + Del
```

---

## 📝 CÓDIGO DEBUG AGREGADO

En `template/src/views/pages/sales/reprint.vue` líneas 636-638:

```javascript
console.log('Orden Compra:', this.selectedDocument.orden_compra);
console.log('Constancia Exonerado:', this.selectedDocument.constancia_exonerado);
console.log('Registro SAG:', this.selectedDocument.registro_sag);
```

Este código muestra en la consola los valores de los campos cuando abres un documento en reimpresiones.

---

## ✅ CHECKLIST DE VERIFICACIÓN

### Cotizaciones
- [ ] Los campos se guardan en la base de datos
- [ ] Los campos aparecen en el log de consola
- [ ] Los campos aparecen en la impresión formato carta
- [ ] El número de cotización coincide con el ID

### Facturas en Espera
- [ ] Los campos se guardan en la base de datos
- [ ] Los campos aparecen en el log de consola
- [ ] Los campos aparecen en la impresión formato carta
- [ ] El número de factura en espera coincide con el ID

### Facturas
- [ ] Los campos se guardan en la base de datos
- [ ] Los campos aparecen en el log de consola
- [ ] Los campos aparecen en la impresión formato ticket 80mm
- [ ] El número de factura es correcto

---

## 🔧 CAMBIOS TÉCNICOS REALIZADOS

### Backend

1. **Numeración de Cotizaciones** (`backend/src/controllers/quotes.controller.js:41-45`)
   ```javascript
   // ANTES
   const countSql = 'SELECT COUNT(*) as total FROM quotes';
   const quoteCount = countResult[0].total + 1;

   // AHORA
   const maxIdSql = 'SELECT COALESCE(MAX(id), 0) as max_id FROM quotes';
   const nextId = maxIdResult[0].max_id + 1;
   ```

2. **Numeración de Facturas en Espera** (`backend/src/controllers/pending-invoices.controller.js:40-44`)
   - Mismo cambio que cotizaciones

3. **Campos en Models/Controllers**:
   - ✅ `invoice.model.js`: Agregados campos al INSERT
   - ✅ `quotes.controller.js`: Agregados campos al INSERT
   - ✅ `pending-invoices.controller.js`: Agregados campos al INSERT

### Frontend

1. **Formato de Envío de Facturas** (`template/src/views/pages/pos/pos-invoice.vue:4449-4473`)
   ```javascript
   // ANTES
   await api.post('/billing/invoices', invoiceData);

   // AHORA
   const requestData = {
     invoice_data: invoiceData,
     items: this.invoice.items
   };
   await api.post('/billing/invoices', requestData);
   ```

2. **Console.log para Debug** (`template/src/views/pages/sales/reprint.vue:636-638`)
   - Agregado log de campos adicionales

3. **Visualización en Impresiones**:
   - ✅ `reprint.vue`: Campos en todos los formatos
   - ✅ `account-statement.vue`: Campos en todos los formatos

---

## 🚀 SIGUIENTE PASO

**PRUEBA MANUAL DESDE EL NAVEGADOR** siguiendo los pasos descritos arriba.

Si los campos NO aparecen en la consola del navegador, significa que el backend no está enviando los datos y necesitamos investigar más.

Si los campos SÍ aparecen en la consola pero NO en la impresión, significa que hay un problema en el HTML de renderizado.
