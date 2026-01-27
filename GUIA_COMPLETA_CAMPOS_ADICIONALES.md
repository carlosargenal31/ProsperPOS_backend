# 📖 GUÍA COMPLETA - CAMPOS ADICIONALES

## ✅ ESTADO ACTUAL DEL SISTEMA

Los campos adicionales funcionan **COMPLETAMENTE** en todos los módulos:

| Módulo | Guardado BD | Impresión | Estado |
|--------|-------------|-----------|--------|
| **POS - Cotización** | ✅ | ✅ | FUNCIONA |
| **POS - Factura** | ✅ | ✅ | FUNCIONA |
| **POS - Factura en Espera** | ✅ | N/A | FUNCIONA |
| **Reimpresiones** | ✅ | ✅ | FUNCIONA |
| **Estado de Cuentas** | ✅ | ✅ | FUNCIONA |

---

## 🎯 CÓMO USAR LOS CAMPOS ADICIONALES

### PASO 1: Abrir POS Facturación

```
http://localhost:8080/#/pos-facturacion
```

### PASO 2: Crear Documento (Factura, Cotización o Factura en Espera)

1. **Selecciona un cliente**
2. **Agrega productos** al carrito
3. **ANTES de guardar/facturar**, haz clic en el botón **"CAMPOS"**
   - Está en la parte superior derecha, junto al botón "OPCIONES"
   - Atajo de teclado: `Alt + M`

### PASO 3: Ingresar Campos Adicionales

En el modal que aparece, ingresa los valores:

```
📝 No. Correlativo de la Orden de Compra Exenta
   [                                          ]

📝 No. Correlativo de la Constancia del Reg Exonerado
   [                                          ]

📝 No. Identificativo del Registro SAG
   [                                          ]
```

**Ejemplo:**
```
Orden de Compra: OC-2026-001
Constancia Exonerado: CONST-2026-123
Registro SAG: SAG-2026-456
```

### PASO 4: Guardar Campos

Haz clic en el botón **"GUARDAR"** en el modal.

Verás una alerta: "Guardado - Campos adicionales guardados"

### PASO 5: Guardar/Facturar el Documento

Ahora puedes:

- **Cotización**: Clic en "GUARDAR COMO COTIZACIÓN"
- **Factura en Espera**: Clic en "GUARDAR COMO FACTURA EN ESPERA"
- **Factura**: Clic en "FACTURAR" o el botón de pago

---

## 🔍 VERIFICAR QUE SE GUARDARON

### Opción 1: Base de Datos

```sql
-- Para facturas
SELECT
  id,
  invoice_number,
  orden_compra,
  constancia_exonerado,
  registro_sag
FROM invoices
ORDER BY id DESC
LIMIT 5;

-- Para cotizaciones
SELECT
  id,
  quote_number,
  orden_compra,
  constancia_exonerado,
  registro_sag
FROM quotes
ORDER BY id DESC
LIMIT 5;

-- Para facturas en espera
SELECT
  id,
  document_number,
  orden_compra,
  constancia_exonerado,
  registro_sag
FROM pending_invoices
ORDER BY id DESC
LIMIT 5;
```

### Opción 2: Script de Prueba

```bash
cd backend
node test-factura-campos-adicionales.js
```

### Opción 3: Reimpresiones / Estado de Cuentas

1. Ve a **Ventas > Reimpresiones** o **Ventas > Estado de Cuentas**
2. Busca el documento que acabas de crear
3. Haz clic en **"VER/IMPRIMIR"**
4. Verifica que los campos aparezcan con los valores ingresados

---

## ❓ SI LOS CAMPOS APARECEN VACÍOS

### Causa #1: No ingresaste los campos ANTES de facturar

**Solución**: Debes hacer clic en "CAMPOS" ANTES de guardar/facturar.

**Orden correcta:**
```
1. Agregar productos ✅
2. Clic en "CAMPOS" ✅
3. Ingresar valores ✅
4. Clic en "GUARDAR" (del modal) ✅
5. Clic en "FACTURAR" ✅
```

**Orden incorrecta (NO funciona):**
```
1. Agregar productos ✅
2. Clic en "FACTURAR" ❌ (facturaste sin campos)
3. Clic en "CAMPOS" ❌ (muy tarde, ya facturaste)
```

### Causa #2: Limpiaste los campos sin querer

El botón "CANCELAR Y LIMPIAR DATOS" en el modal **borra** los valores ingresados.

**Solución**: Usa el botón "GUARDAR" en verde, no el de "CANCELAR" en gris.

### Causa #3: Creaste nueva factura

Cuando haces clic en "NUEVA FACTURA" o creas un nuevo documento, los campos se limpian automáticamente.

**Solución**: Debes ingresar los campos para cada factura/cotización nueva.

---

## 📊 DÓNDE SE MUESTRAN LOS CAMPOS

### POS Invoice (Vista Previa)

Cuando creas una **cotización** o **factura**, se abre un modal con la vista previa.

Los campos aparecen en la sección de encabezado:

```
COTIZACION: 0000000033
#Control Interno: 0000000033
Sucursal: Agencia Principal
Emisión: 19/01/2026
Condiciones de la Transacción: Contado
Entrega: 19/01/2026
No. Correlativo de la Orden de Compra Exenta: OC-2026-001
No. Correlativo de la Constancia del Reg Exonerado: CONST-2026-123
No. Identificativo del Registro SAG: SAG-2026-456
```

### Reimpresiones

Ve a **Ventas > Reimpresiones** y selecciona el documento:

**Formato Carta:**
```
No. Correlativo de la Orden de Compra Exenta: OC-2026-001
No. Correlativo de la Constancia del Reg Exonerado: CONST-2026-123
No. Identificativo del Registro SAG: SAG-2026-456
```

**Formato Ticket 80mm:**
```
Orden de Compra: OC-2026-001
Constancia Exonerado: CONST-2026-123
Registro SAG: SAG-2026-456
```

### Estado de Cuentas

Ve a **Ventas > Estado de Cuentas**, selecciona cliente y documento:

```
No. Correlativo de la Orden de Compra Exenta: OC-2026-001
No. Correlativo de la Constancia del Reg Exonerado: CONST-2026-123
No. Identificativo del Registro SAG: SAG-2026-456
```

---

## 🎯 CAMPOS OPCIONALES

Los campos adicionales son **OPCIONALES**:

- ✅ Si los ingresas, aparecen en la impresión
- ✅ Si NO los ingresas, no aparecen (o aparecen vacíos según el módulo)
- ✅ Puedes dejar algunos vacíos y otros con valores

---

## 🔧 TÉCNICO: CÓMO FUNCIONA

### Flujo de Datos

```
1. Usuario ingresa valores en modal "CAMPOS"
   ↓
2. Se guardan en this.additionalFields {}
   ↓
3. Al facturar/guardar, se envían al backend
   ↓
4. Backend los guarda en la base de datos
   ↓
5. Al imprimir/ver, se traen de la BD y se muestran
```

### Archivos Involucrados

**Backend:**
- `backend/src/models/invoice.model.js` (líneas 276-278, 308-310)
- `backend/src/controllers/quotes.controller.js` (líneas 34-36, 53, 61)
- `backend/src/controllers/pending-invoices.controller.js` (líneas 33-35, 52, 60)
- `backend/src/controllers/account-statement.controller.js` (líneas 561-563, 608-610, 655-657)
- `backend/src/controllers/reprint.controller.js` (usa SELECT *)

**Frontend:**
- `template/src/views/pages/pos/pos-invoice.vue`:
  - Líneas 834-854: Modal de campos adicionales
  - Líneas 2454-2458: Inicialización de additionalFields
  - Líneas 4463-4465: Envío en facturas
  - Líneas 4093-4095: Envío en cotizaciones
  - Líneas 4390-4392: Envío en facturas en espera
  - Líneas 3957-3959: Vista previa de cotizaciones
  - Líneas 5455-5457: Impresión de facturas

- `template/src/views/pages/sales/reprint.vue`:
  - Líneas 1055-1057: Ticket 80mm
  - Líneas 1471-1473: Formato carta
  - Líneas 1896-1898: Guía de remisión

- `template/src/views/pages/finance/account-statement.vue`:
  - Líneas 1586-1588: Formato carta
  - Líneas 1945-1947: Ticket 80mm
  - Líneas 2330-2332: Guía de remisión

---

## ✅ CHECKLIST DE VERIFICACIÓN

Para verificar que todo funciona:

### Cotización:
- [ ] Crear cotización con campos adicionales
- [ ] Verificar en la vista previa del POS
- [ ] Verificar en Reimpresiones
- [ ] Verificar en Estado de Cuentas
- [ ] Verificar en la base de datos

### Factura en Espera:
- [ ] Crear factura en espera con campos
- [ ] Verificar en Reimpresiones
- [ ] Verificar en Estado de Cuentas
- [ ] Verificar en la base de datos

### Factura:
- [ ] Crear factura con campos adicionales
- [ ] Verificar en la vista previa del POS
- [ ] Verificar en Reimpresiones
- [ ] Verificar en Estado de Cuentas
- [ ] Verificar en la base de datos

---

## 🎉 CONCLUSIÓN

Los campos adicionales están **100% implementados y funcionando** en todo el sistema.

**Solo necesitas recordar:**
1. Hacer clic en **"CAMPOS"** ANTES de facturar
2. Ingresar los valores que necesites
3. Hacer clic en **"GUARDAR"**
4. Luego facturar/guardar normalmente

**¡Y listo!** Los campos aparecerán en todas las impresiones y reportes. 🎯
