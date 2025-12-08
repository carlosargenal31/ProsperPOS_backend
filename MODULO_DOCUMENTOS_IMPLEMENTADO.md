# MÓDULO DE IMPORTACIÓN Y GUARDADO DE DOCUMENTOS - COMPLETADO

## Resumen
Se ha implementado exitosamente el módulo completo de importación y guardado de documentos para el sistema POS de facturación. Este módulo permite a los vendedores guardar operaciones en espera y cotizaciones, y posteriormente importarlas para completar el proceso de facturación.

## Características Implementadas

### 1. Base de Datos
Se crearon 4 nuevas tablas en MySQL:

#### Tabla: `pending_invoices` (Operaciones en Espera)
- Almacena facturas que están en proceso pero no han sido cobradas
- Incluye toda la información del cliente, vendedor y totales
- Número de documento automático: `FACT EN ESPERA 0000000001`
- Soft delete implementado (campo `deleted_at`)

#### Tabla: `pending_invoice_items` (Items de Operaciones en Espera)
- Almacena los productos/items de cada operación en espera
- Incluye cantidad, precio, descuentos e impuestos
- Relación con productos y bodegas

#### Tabla: `quotes` (Cotizaciones)
- Almacena cotizaciones generadas por los vendedores
- Número de cotización automático: `COTIZACION 0000000001`
- Estados: pending, approved, rejected, converted
- Campo para rastrear si fue convertida a factura

#### Tabla: `quote_items` (Items de Cotizaciones)
- Almacena los productos/items de cada cotización
- Estructura similar a pending_invoice_items

**Archivo**: `backend/database/create-pending-documents-tables.sql`

### 2. Backend - Controladores

#### `PendingInvoicesController`
**Archivo**: `backend/src/controllers/pending-invoices.controller.js`

Métodos implementados:
- `create()` - Crear operación en espera con numeración automática
- `getAll()` - Obtener todas las operaciones en espera con información del usuario
- `getById()` - Obtener una operación específica con sus items
- `delete()` - Eliminación soft delete de operaciones

#### `QuotesController`
**Archivo**: `backend/src/controllers/quotes.controller.js`

Métodos implementados:
- `create()` - Crear cotización con numeración automática
- `getAll()` - Obtener todas las cotizaciones
- `getById()` - Obtener cotización específica con items y códigos de producto
- `updateStatus()` - Actualizar estado de cotización (pending/approved/rejected/converted)
- `delete()` - Eliminación soft delete de cotizaciones

### 3. Backend - Rutas API

#### Rutas de Operaciones en Espera
**Archivo**: `backend/src/routes/pending-invoices.routes.js`

- `POST /api/v1/pending-invoices` - Crear operación en espera
- `GET /api/v1/pending-invoices` - Listar todas las operaciones
- `GET /api/v1/pending-invoices/:id` - Obtener operación por ID
- `DELETE /api/v1/pending-invoices/:id` - Eliminar operación

#### Rutas de Cotizaciones
**Archivo**: `backend/src/routes/quotes.routes.js`

- `POST /api/v1/quotes` - Crear cotización
- `GET /api/v1/quotes` - Listar todas las cotizaciones
- `GET /api/v1/quotes/:id` - Obtener cotización por ID
- `PATCH /api/v1/quotes/:id/status` - Actualizar estado
- `DELETE /api/v1/quotes/:id` - Eliminar cotización

Todas las rutas requieren autenticación mediante token JWT.

### 4. Frontend - Componente POS Invoice

**Archivo**: `template/src/views/pages/pos/pos-invoice.vue`

#### Botón de Importación
- Botón morado "IMPORTAR DOCUMENTO" con dropdown
- Opciones disponibles:
  - ✅ **Operación en Espera** (Funcional)
  - ✅ **Cotización** (Funcional)
  - 🔜 Factura (Próximamente)
  - 🔜 Nota de Entrega (Próximamente)
  - 🔜 Pedido (Próximamente)

#### Modal de Importación
Características:
- Búsqueda por número de documento o nombre de cliente
- Filtros por rango de fechas (desde/hasta)
- Tabla con información de documentos:
  - Número de documento
  - Cliente
  - Fecha de creación
  - Total
  - Estado
  - Botón de vista previa (ícono de ojo)
- Selección mediante radio buttons
- Botón "Importar Documento" para cargar en el POS

#### Funcionalidad de Guardado

##### Para FACTURAS:
- Al hacer clic en "GUARDAR" → Se guarda como **Operación en Espera**
- El documento queda disponible para importación posterior

##### Para COTIZACIONES:
- Al hacer clic en "GUARDAR" → Se muestra un diálogo con 2 opciones:
  1. **Guardar como Cotización** (botón azul)
  2. **Guardar como Operación en Espera** (botón amarillo)

#### Métodos Frontend Implementados

1. **openImportModal(type)** - Abre el modal de importación
2. **closeImportModal()** - Cierra el modal
3. **loadDocuments()** - Carga documentos desde la API
4. **viewDocumentDetails(doc)** - Muestra detalles en modal de SweetAlert2
5. **importDocument()** - Importa el documento seleccionado al POS
6. **saveAsQuote()** - Guarda como cotización
7. **saveAsPendingInvoice()** - Guarda como operación en espera
8. **formatDate(dateString)** - Formatea fechas
9. **getStatusBadgeClass(status)** - Retorna clases CSS para badges de estado

#### Computed Properties

- **filteredDocuments** - Filtra documentos según búsqueda y fechas

## Flujo de Trabajo

### Escenario 1: Guardar Factura en Espera
1. Vendedor crea una factura en POS
2. Agrega productos y cliente
3. Hace clic en "GUARDAR"
4. Se guarda como "Operación en Espera" con número automático
5. El carrito se limpia

### Escenario 2: Guardar Cotización
1. Vendedor cambia documento a "COTIZACION"
2. Agrega productos y cliente
3. Hace clic en "GUARDAR"
4. Sistema pregunta: ¿Guardar como Cotización o como Operación en Espera?
5. Vendedor selecciona la opción deseada
6. Se guarda con número automático correspondiente
7. El carrito se limpia

### Escenario 3: Importar Operación en Espera
1. Vendedor hace clic en "IMPORTAR DOCUMENTO"
2. Selecciona "Operación en Espera"
3. Se abre modal con lista de operaciones guardadas
4. Puede buscar por número o cliente
5. Puede filtrar por fechas
6. Hace clic en el ícono de ojo para ver detalles
7. Selecciona con radio button la operación deseada
8. Hace clic en "Importar Documento"
9. El documento se carga en el POS con:
   - Cliente
   - Productos con cantidades y precios
   - Bodega
   - Vendedor
10. Puede proceder a hacer "COBRO RÁPIDO" o "COBRO DETALLADO"

### Escenario 4: Importar Cotización
1. Vendedor hace clic en "IMPORTAR DOCUMENTO"
2. Selecciona "Cotización"
3. Se abre modal con lista de cotizaciones guardadas
4. Proceso similar al de Operaciones en Espera
5. Al importar, puede convertir la cotización en factura

## Archivos Modificados/Creados

### Backend
1. ✅ `backend/database/create-pending-documents-tables.sql` - NUEVO
2. ✅ `backend/src/controllers/pending-invoices.controller.js` - NUEVO
3. ✅ `backend/src/controllers/quotes.controller.js` - NUEVO
4. ✅ `backend/src/routes/pending-invoices.routes.js` - NUEVO
5. ✅ `backend/src/routes/quotes.routes.js` - NUEVO
6. ✅ `backend/src/routes/index.js` - MODIFICADO (registra nuevas rutas)

### Frontend
1. ✅ `template/src/views/pages/pos/pos-invoice.vue` - MODIFICADO
   - Agregado botón de importación con dropdown
   - Agregado modal de importación
   - Agregados 9 nuevos métodos
   - Agregada computed property filteredDocuments
   - Agregadas 6 propiedades de data
   - Agregados estilos CSS para botón morado

## Próximos Pasos (Opcional)

### Funcionalidades Adicionales Sugeridas:
1. **Impresión de Cotizaciones** - Generar PDF de cotizaciones
2. **Aprobación de Cotizaciones** - Workflow de aprobación
3. **Expiración de Operaciones** - Auto-eliminar operaciones vencidas
4. **Notificaciones** - Alertar cuando hay operaciones pendientes
5. **Dashboard** - Métricas de operaciones en espera y cotizaciones
6. **Importar desde Factura** - Duplicar facturas existentes
7. **Importar desde Nota de Entrega** - Cuando se implemente módulo de despacho
8. **Importar desde Pedido** - Cuando se implemente módulo de pedidos

## Validaciones Implementadas

### Backend:
- ✅ Autenticación requerida en todas las rutas
- ✅ Validación de existencia de documento antes de retornar
- ✅ Soft delete para no perder historial
- ✅ Logging de operaciones para auditoría

### Frontend:
- ✅ Botones deshabilitados cuando no hay productos
- ✅ Validación de documento seleccionado antes de importar
- ✅ Mensajes de error amigables con SweetAlert2
- ✅ Recalculación automática de totales al importar

## Compatibilidad

- ✅ MySQL/MariaDB
- ✅ Node.js
- ✅ Express.js
- ✅ Vue 3
- ✅ Bootstrap 5
- ✅ SweetAlert2
- ✅ Tabler Icons

## Estado Final

**🎉 MÓDULO 100% COMPLETADO Y FUNCIONAL**

Todas las funcionalidades solicitadas han sido implementadas exitosamente:
- ✅ Base de datos creada
- ✅ Backend API completo
- ✅ Frontend completamente funcional
- ✅ Guardar como Operación en Espera
- ✅ Guardar como Cotización
- ✅ Importar Operaciones en Espera
- ✅ Importar Cotizaciones
- ✅ Búsqueda y filtros
- ✅ Vista previa de documentos

---

**Fecha de Implementación**: 2025-11-18
**Desarrollador**: Claude Code
**Sistema**: ProsperPOS - Punto de Venta
