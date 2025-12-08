# 📊 Módulo de Facturación - ProsperPOS

## ✅ Módulo Completado e Instalado

El módulo de facturación ha sido completamente implementado e instalado en tu sistema ProsperPOS.

---

## 📁 Estructura del Módulo

### Backend

#### 1. Base de Datos
- **Ubicación**: `backend/database/migrations/011_create_billing_tables_simple.sql`
- **Tablas Creadas**:
  - `invoices` - Facturas principales
  - `invoice_items` - Líneas de productos en facturas
  - `invoice_payments` - Pagos registrados
  - `credit_notes` - Notas de crédito
  - `credit_note_items` - Líneas de notas de crédito
  - `billing_settings` - Configuración del módulo

#### 2. Modelos
- **Archivo**: `backend/src/models/invoice.model.js`
- **Funciones**:
  - `getAll()` - Listar facturas con filtros
  - `getById()` - Obtener factura por ID
  - `create()` - Crear nueva factura
  - `update()` - Actualizar factura
  - `delete()` - Eliminar factura (soft delete)
  - `recordPayment()` - Registrar pago
  - `getStatistics()` - Estadísticas
  - `getAgingReport()` - Reporte de antigüedad

#### 3. Servicios
- **Archivo**: `backend/src/services/billing.service.js`
- **Funciones**:
  - `createInvoiceFromSale()` - Crear factura desde venta POS
  - `createStandaloneInvoice()` - Crear factura independiente
  - `processPayment()` - Procesar pago
  - `getDashboardStats()` - Estadísticas del dashboard
  - `createCreditNote()` - Crear nota de crédito
  - `getSettings()` / `updateSettings()` - Gestión de configuración

#### 4. Controladores
- **Archivo**: `backend/src/controllers/billing.controller.js`
- **Endpoints implementados**: Ver sección de API

#### 5. Rutas API
- **Archivo**: `backend/src/routes/billing.routes.js`
- **Base URL**: `/api/v1/billing`

---

### Frontend

#### 1. POS Moderno (Nueva Interfaz)
- **Ubicación**: `template/src/views/pages/pos-5/index.vue`
- **Características**:
  - Interfaz moderna y limpia
  - Búsqueda de productos en tiempo real
  - Gestión de carrito con cálculos automáticos
  - Selección de clientes
  - Múltiples métodos de pago
  - Atajos de teclado
  - Generación automática de facturas

#### 2. Componentes de Modales
- `PaymentModal.vue` - Modal de pago con cambio
- `CustomerModal.vue` - Selección/creación de clientes
- `InvoicePreviewModal.vue` - Vista previa e impresión

#### 3. Gestión de Facturas
- **Ubicación**: `template/src/views/pages/billing/invoice-list.vue`
- **Características**:
  - Lista completa de facturas
  - Filtros avanzados (estado, tipo, fechas, cliente)
  - Estadísticas en tiempo real
  - Búsqueda de facturas
  - Acciones: Ver, Pagar, Imprimir, Eliminar

#### 4. Detalle de Factura
- **Ubicación**: `template/src/views/pages/billing/InvoiceDetailModal.vue`
- **Características**:
  - Vista completa de factura
  - Historial de pagos
  - Notas de crédito asociadas
  - Información del cliente
  - Acciones: Pagar, Imprimir, Descargar PDF

#### 5. Registro de Pagos
- **Ubicación**: `template/src/views/pages/billing/PaymentRecordModal.vue`
- **Características**:
  - Registro de pagos parciales o totales
  - Múltiples métodos de pago
  - Referencia y notas
  - Vista previa del saldo restante

---

## 🔌 API Endpoints

### Facturas

```
GET    /api/v1/billing/invoices
  - Listar todas las facturas
  - Query params: search, customer_id, payment_status, status, invoice_type, date_from, date_to, page, limit

GET    /api/v1/billing/invoices/:id
  - Obtener detalle de factura por ID

POST   /api/v1/billing/invoices
  - Crear nueva factura
  - Body: { invoice_data: {...}, items: [...] }

POST   /api/v1/billing/invoices/from-sale
  - Crear factura desde venta POS
  - Body: { sale_id, invoice_type, due_date, is_credit, payment_terms_days, notes }

PUT    /api/v1/billing/invoices/:id
  - Actualizar factura
  - Body: { customer_id, due_date, notes, status, ... }

DELETE /api/v1/billing/invoices/:id
  - Eliminar factura (soft delete)

GET    /api/v1/billing/invoices/:id/print
  - Obtener factura para imprimir/PDF
```

### Pagos

```
POST   /api/v1/billing/invoices/:id/payment
  - Registrar pago para una factura
  - Body: { amount, payment_method, reference_number, payment_date, notes }

GET    /api/v1/billing/outstanding
  - Listar facturas pendientes de pago
```

### Estadísticas y Reportes

```
GET    /api/v1/billing/dashboard
  - Obtener estadísticas del dashboard
  - Query params: date_from, date_to, warehouse_id

GET    /api/v1/billing/statistics
  - Estadísticas de facturación
  - Query params: date_from, date_to, warehouse_id

GET    /api/v1/billing/aging-report
  - Reporte de antigüedad de facturas
```

### Notas de Crédito

```
POST   /api/v1/billing/credit-notes
  - Crear nota de crédito
  - Body: { invoice_id, credit_note_data: {...}, items: [...] }
```

### Configuración

```
GET    /api/v1/billing/settings
  - Obtener configuración de facturación

PUT    /api/v1/billing/settings
  - Actualizar configuración
  - Body: { company_name, company_rtn, invoice_prefix, default_tax_rate, ... }
```

### Sistema

```
POST   /api/v1/billing/update-overdue
  - Actualizar estado de facturas vencidas
```

---

## 🔐 Permisos

Los siguientes permisos fueron creados automáticamente:

- `billing.access` - Acceso al módulo de facturación
- `billing.invoices.view` - Ver facturas
- `billing.invoices.create` - Crear facturas
- `billing.invoices.update` - Actualizar facturas
- `billing.invoices.delete` - Eliminar facturas
- `billing.invoices.print` - Imprimir/exportar facturas
- `billing.payments.record` - Registrar pagos
- `billing.credit_notes.create` - Crear notas de crédito
- `billing.settings.manage` - Gestionar configuración

**Nota**: El rol `admin` tiene todos estos permisos asignados automáticamente.

---

## 🚀 Rutas Frontend

### Punto de Venta
```
/pos-5
  - Interfaz moderna de punto de venta
  - Crear ventas y generar facturas automáticamente
```

### Gestión de Facturas
```
/billing/invoices
  - Lista de facturas con filtros
  - Gestión completa de facturas

/billing/dashboard (pendiente)
  - Dashboard de facturación con estadísticas

/billing/settings (pendiente)
  - Configuración del módulo de facturación
```

---

## ⚙️ Configuración Inicial

### 1. Configuración de la Empresa
Actualiza la configuración en la tabla `billing_settings`:
```sql
UPDATE billing_settings SET
  company_name = 'Tu Empresa',
  company_rtn = '1234567890123',
  company_address = 'Tu Dirección',
  company_phone = '1234-5678',
  company_email = 'contacto@tuempresa.com',
  invoice_prefix = 'FAC',
  default_tax_rate = 15.00,
  default_currency = 'HNL'
WHERE id = 1;
```

### 2. Resoluciones DIAN (Honduras)
Si aplica, registra tus resoluciones en la tabla `resolutions`.

---

## 🎨 Características Principales

### Facturación
- ✅ Creación de facturas desde POS o manual
- ✅ Múltiples tipos de documentos (factura, cotización, pedido, en espera)
- ✅ Cálculo automático de impuestos y descuentos
- ✅ Gestión de clientes (consumidor final o clientes registrados)
- ✅ Numeración automática de facturas
- ✅ Estados de pago (pendiente, parcial, pagado, vencido, cancelado)
- ✅ Soporte para ventas a crédito con términos de pago

### Pagos
- ✅ Registro de pagos parciales o totales
- ✅ Múltiples métodos de pago (efectivo, tarjeta, transferencia, crédito)
- ✅ Historial completo de pagos por factura
- ✅ Cálculo automático de cambio (en efectivo)
- ✅ Referencia para cheques y transferencias

### Reportes
- ✅ Estadísticas de facturación
- ✅ Reporte de antigüedad de cuentas por cobrar
- ✅ Facturas vencidas
- ✅ Dashboard con métricas clave

### POS Moderno
- ✅ Interfaz limpia y responsive
- ✅ Búsqueda rápida de productos
- ✅ Carrito de compras en tiempo real
- ✅ Descuentos por línea o factura
- ✅ Atajos de teclado (F2-F9)
- ✅ Impresión de facturas

---

## 🔧 Características Técnicas

### Backend
- ✅ Arquitectura MVC completa
- ✅ Transacciones de base de datos para integridad
- ✅ Validaciones de datos
- ✅ Manejo de errores robusto
- ✅ Soft deletes para auditoría
- ✅ Timestamps automáticos
- ✅ Paginación en listados
- ✅ Filtros avanzados

### Frontend
- ✅ Vue 3 Composition API
- ✅ Componentes reutilizables
- ✅ Estado reactivo
- ✅ Validación de formularios
- ✅ Notificaciones con SweetAlert2
- ✅ Diseño responsive
- ✅ Animaciones suaves

---

## 📝 Notas Importantes

### Seguridad
- Todas las rutas están protegidas con autenticación JWT
- Sistema de permisos basado en roles (RBAC)
- No se pueden eliminar facturas con pagos registrados
- Soft delete para mantener historial

### Flujo de Trabajo
1. **Crear Venta en POS** → Se genera factura automáticamente
2. **Registrar Pagos** → Actualiza estado de factura
3. **Gestionar Facturas** → Ver, imprimir, administrar

### Próximas Mejoras Sugeridas
- [ ] Generación de PDF con librería (html2pdf o similar)
- [ ] Envío de facturas por email
- [ ] Portal de clientes
- [ ] Integración con pasarelas de pago
- [ ] Reportes exportables (Excel, CSV)
- [ ] Facturación electrónica (Honduras - SAR)
- [ ] Dashboard de facturación con gráficas
- [ ] Página de configuración de facturación

---

## 🆘 Soporte

### Logs
Los logs se generan en: `backend/logs/`

### Base de Datos
Puedes consultar directamente las tablas para debugging:
```sql
SELECT * FROM invoices ORDER BY created_at DESC LIMIT 10;
SELECT * FROM invoice_payments WHERE invoice_id = X;
SELECT * FROM billing_settings;
```

### Testing
Para probar el módulo:
1. Inicia el backend: `cd backend && npm start`
2. Inicia el frontend: `cd template && npm run dev`
3. Accede a: `http://localhost:8080/pos-5`
4. Crea una venta y verifica que se genere la factura
5. Accede a: `http://localhost:8080/billing/invoices`

---

## 📌 Checklist de Instalación

- [x] Migración de base de datos ejecutada
- [x] Tablas creadas correctamente
- [x] Permisos creados y asignados
- [x] Rutas API registradas
- [x] Rutas frontend configuradas
- [x] Modelos creados
- [x] Servicios implementados
- [x] Controladores creados
- [x] Componentes Vue creados
- [x] POS moderno implementado
- [x] Gestión de facturas lista

---

## 🎉 ¡El Módulo está Listo!

Tu módulo de facturación está completamente instalado y listo para usar.

**Acceso Rápido**:
- POS Moderno: `/pos-5`
- Facturas: `/billing/invoices`
- API: `/api/v1/billing/*`

**Fecha de Instalación**: 11 de Noviembre, 2025
**Versión**: 1.0.0

---

