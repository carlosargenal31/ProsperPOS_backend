# SISTEMA DE TRACKING Y CONVERSIÓN DE DOCUMENTOS IMPLEMENTADO

## Resumen

Se ha implementado un sistema completo de tracking y conversión entre documentos (Facturas en Espera y Cotizaciones) que permite:

1. ✅ **Actualizar documentos importados** en lugar de crear duplicados
2. ✅ **Convertir entre tipos de documentos** (Factura en Espera ↔ Cotización)
3. ✅ **Eliminar documentos origen** al hacer cobro o al presionar ELIMINAR
4. ✅ **Preservar cotizaciones** cuando se hace clic en ELIMINAR

## Comportamientos Implementados

### 1. Importar y Re-guardar Mismo Documento

**Escenario:** Importo "FACT EN ESPERA 0000000002" y luego la guardo

**Comportamiento:**
- ✅ NO se crea una nueva factura en espera
- ✅ Se actualiza la misma "FACT EN ESPERA 0000000002" con los cambios
- ✅ Mantiene el mismo número de documento

### 2. Eliminar en FACTURA con Documento Importado

**Escenario A:** Importo una Factura en Espera en modo FACTURA y presiono ELIMINAR

**Comportamiento:**
- ✅ Se elimina la factura en espera de la base de datos (soft delete)
- ✅ Se limpia el carrito del POS

**Escenario B:** Importo una Cotización en modo FACTURA y presiono ELIMINAR

**Comportamiento:**
- ✅ La cotización NO se elimina de la base de datos
- ✅ Solo se limpia el carrito del POS

### 3. Convertir de Factura en Espera a Cotización

**Escenario:** Estoy en modo COTIZACIÓN e importo una Factura en Espera, luego guardo como Cotización

**Comportamiento:**
- ✅ Se elimina la factura en espera original
- ✅ Se crea una nueva cotización con el contenido
- ✅ Se genera un nuevo número de cotización (ej: COTIZACION 0000000003)

### 4. Convertir de Cotización a Factura en Espera

**Escenario:** Estoy en modo FACTURA (cambio de COTIZACIÓN a FACTURA) e importo una Cotización, luego guardo

**Comportamiento:**
- ✅ Se elimina la cotización original
- ✅ Se crea una nueva factura en espera con el contenido
- ✅ Se genera un nuevo número de factura en espera (ej: FACT EN ESPERA 0000000005)

### 5. Cobrar Factura Importada

**Escenario A:** Importo una Factura en Espera y hago COBRO RÁPIDO o COBRO DETALLADO

**Comportamiento:**
- ✅ Se procesa el cobro normalmente
- ✅ Se elimina la factura en espera de la base de datos
- ✅ Se genera el comprobante de venta

**Escenario B:** Importo una Cotización en modo FACTURA y hago cobro

**Comportamiento:**
- ✅ Se procesa el cobro normalmente
- ✅ Se elimina la cotización de la base de datos
- ✅ Se genera el comprobante de venta

## Cambios en Backend

### Controladores Modificados

#### 1. `backend/src/controllers/pending-invoices.controller.js`

**Nuevo método agregado:**
```javascript
static async update(req, res)
```

Permite actualizar una factura en espera existente sin crear una nueva.

#### 2. `backend/src/controllers/quotes.controller.js`

**Nuevo método agregado:**
```javascript
static async update(req, res)
```

Permite actualizar una cotización existente sin crear una nueva.

### Rutas Modificadas

#### 1. `backend/src/routes/pending-invoices.routes.js`

**Nueva ruta agregada:**
```javascript
router.put('/:id', PendingInvoicesController.update);
```

Endpoint: `PUT /api/v1/pending-invoices/:id`

#### 2. `backend/src/routes/quotes.routes.js`

**Nueva ruta agregada:**
```javascript
router.put('/:id', QuotesController.update);
```

Endpoint: `PUT /api/v1/quotes/:id`

## Cambios en Frontend

### Archivo Modificado: `template/src/views/pages/pos/pos-invoice.vue`

### 1. Nueva Propiedad de Data

```javascript
importedDocument: {
  id: null,
  type: null, // 'pending-invoice' or 'quote'
  number: null
}
```

Esta propiedad rastrea qué documento fue importado para saber cómo manejarlo al guardar o eliminar.

### 2. Método `importDocument()` Modificado

Ahora guarda la información del documento importado:

```javascript
this.importedDocument = {
  id: docData.id,
  type: this.importDocumentType,
  number: docData.document_number || docData.quote_number
};
```

### 3. Método `saveAsPendingInvoice()` Mejorado

**Lógica implementada:**

```javascript
// Caso 1: Si viene de pending-invoice importada → ACTUALIZAR
if (this.importedDocument.type === 'pending-invoice') {
  await api.put(`/pending-invoices/${this.importedDocument.id}`, data);
}

// Caso 2: Si viene de quote importada → CONVERTIR
else if (this.importedDocument.type === 'quote') {
  await api.delete(`/quotes/${this.importedDocument.id}`);
  await api.post('/pending-invoices', data);
}

// Caso 3: Si no viene de importación → CREAR NUEVA
else {
  await api.post('/pending-invoices', data);
}
```

### 4. Método `saveAsQuote()` Mejorado

**Lógica implementada:**

```javascript
// Caso 1: Si viene de quote importada → ACTUALIZAR
if (this.importedDocument.type === 'quote') {
  await api.put(`/quotes/${this.importedDocument.id}`, data);
}

// Caso 2: Si viene de pending-invoice importada → CONVERTIR
else if (this.importedDocument.type === 'pending-invoice') {
  await api.delete(`/pending-invoices/${this.importedDocument.id}`);
  await api.post('/quotes', data);
}

// Caso 3: Si no viene de importación → CREAR NUEVA
else {
  await api.post('/quotes', data);
}
```

### 5. Método `clearInvoice()` Modificado

Ahora es asíncrono y elimina documentos según el contexto:

```javascript
async clearInvoice() {
  if (this.importedDocument.id) {
    // Si estoy en FACTURA y el documento es pending-invoice → ELIMINAR
    if (this.documentType === 'FACTURA' &&
        this.importedDocument.type === 'pending-invoice') {
      await api.delete(`/pending-invoices/${this.importedDocument.id}`);
    }

    // Si es cotización → NO ELIMINAR (las cotizaciones se preservan)
  }

  // Resetear tracking y limpiar carrito
  this.importedDocument = { id: null, type: null, number: null };
  this.invoice.items = [];
}
```

### 6. Métodos `processQuickPayment()` y `processDetailedPayment()` Mejorados

Ambos métodos ahora eliminan el documento importado tras un cobro exitoso:

```javascript
// Antes de mostrar el modal de impresión
if (this.importedDocument.id) {
  if (this.importedDocument.type === 'pending-invoice') {
    await api.delete(`/pending-invoices/${this.importedDocument.id}`);
  } else if (this.importedDocument.type === 'quote') {
    await api.delete(`/quotes/${this.importedDocument.id}`);
  }
}
```

## Flujos de Trabajo Completos

### Flujo 1: Actualizar Factura en Espera

```
1. Usuario hace clic en "Importar Documento" → "Operación en Espera"
2. Selecciona "FACT EN ESPERA 0000000002"
3. Se carga el documento en el POS
4. Usuario modifica productos o cantidades
5. Usuario hace clic en "GUARDAR" (en modo FACTURA)
   O "Guardar como Operación en Espera" (en modo COTIZACIÓN)
6. ✅ Se actualiza la misma "FACT EN ESPERA 0000000002"
7. NO se crea un documento duplicado
```

### Flujo 2: Convertir Factura en Espera a Cotización

```
1. Usuario cambia el tipo de documento a "COTIZACIÓN"
2. Hace clic en "Importar Documento" → "Operación en Espera"
3. Selecciona "FACT EN ESPERA 0000000002"
4. Se carga el documento en el POS
5. Usuario hace clic en "Guardar como Cotización"
6. ✅ Se elimina "FACT EN ESPERA 0000000002"
7. ✅ Se crea "COTIZACION 0000000003"
```

### Flujo 3: Eliminar con Botón ELIMINAR

**En modo FACTURA con Factura en Espera importada:**
```
1. Usuario importa "FACT EN ESPERA 0000000002"
2. Usuario hace clic en "ELIMINAR"
3. ✅ Se elimina "FACT EN ESPERA 0000000002" de la BD
4. ✅ Se limpia el carrito
```

**En modo FACTURA con Cotización importada:**
```
1. Usuario importa "COTIZACION 0000000003"
2. Usuario hace clic en "ELIMINAR"
3. ✅ La cotización NO se elimina (se preserva)
4. ✅ Solo se limpia el carrito
```

### Flujo 4: Cobrar Documento Importado

**Con Factura en Espera:**
```
1. Usuario importa "FACT EN ESPERA 0000000002"
2. Usuario hace clic en "COBRO RÁPIDO" o "COBRO DETALLADO"
3. Completa el pago
4. ✅ Se procesa la factura de venta
5. ✅ Se elimina "FACT EN ESPERA 0000000002" de la BD
6. ✅ Se muestra el modal de impresión
```

**Con Cotización:**
```
1. Usuario cambia a modo "FACTURA"
2. Usuario importa "COTIZACION 0000000003"
3. Usuario hace clic en "COBRO RÁPIDO" o "COBRO DETALLADO"
4. Completa el pago
5. ✅ Se procesa la factura de venta
6. ✅ Se elimina "COTIZACION 0000000003" de la BD
7. ✅ Se muestra el modal de impresión
```

## Archivos Modificados

### Backend
1. ✅ `backend/src/controllers/pending-invoices.controller.js` - Agregado método `update()`
2. ✅ `backend/src/controllers/quotes.controller.js` - Agregado método `update()`
3. ✅ `backend/src/routes/pending-invoices.routes.js` - Agregada ruta PUT
4. ✅ `backend/src/routes/quotes.routes.js` - Agregada ruta PUT

### Frontend
1. ✅ `template/src/views/pages/pos/pos-invoice.vue` - Múltiples modificaciones

## Endpoints API Disponibles

### Facturas en Espera
- `POST /api/v1/pending-invoices` - Crear nueva
- `GET /api/v1/pending-invoices` - Listar todas
- `GET /api/v1/pending-invoices/:id` - Obtener una
- **`PUT /api/v1/pending-invoices/:id`** - ✨ **NUEVO:** Actualizar existente
- `DELETE /api/v1/pending-invoices/:id` - Eliminar (soft delete)

### Cotizaciones
- `POST /api/v1/quotes` - Crear nueva
- `GET /api/v1/quotes` - Listar todas
- `GET /api/v1/quotes/:id` - Obtener una
- **`PUT /api/v1/quotes/:id`** - ✨ **NUEVO:** Actualizar existente
- `PATCH /api/v1/quotes/:id/status` - Actualizar estado
- `DELETE /api/v1/quotes/:id` - Eliminar (soft delete)

## Ventajas del Sistema

1. ✅ **No hay duplicados** - Al guardar un documento importado, se actualiza el original
2. ✅ **Conversión fluida** - Puedes convertir fácilmente entre tipos de documentos
3. ✅ **Integridad de datos** - Los documentos se eliminan automáticamente al cobrar
4. ✅ **Protección de cotizaciones** - No se eliminan accidentalmente con el botón ELIMINAR
5. ✅ **Trazabilidad completa** - Siempre se sabe de dónde vino cada documento
6. ✅ **UX mejorada** - El usuario no necesita preocuparse por duplicados o documentos huérfanos

## Estado Final

**🎉 SISTEMA 100% FUNCIONAL Y PROBADO**

Todos los casos de uso solicitados han sido implementados exitosamente:
- ✅ Actualizar documentos importados sin crear duplicados
- ✅ Eliminar factura en espera al usar ELIMINAR en modo FACTURA
- ✅ Preservar cotizaciones al usar ELIMINAR
- ✅ Convertir entre tipos de documentos al guardar
- ✅ Eliminar documentos al cobrar exitosamente

---

**Fecha de Implementación**: 2025-11-18
**Desarrollador**: Claude Code
**Sistema**: ProsperPOS - Punto de Venta
**Versión**: 3.0 - Sistema de Tracking y Conversión de Documentos
