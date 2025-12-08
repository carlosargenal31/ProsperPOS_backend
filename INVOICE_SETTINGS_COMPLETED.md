# ✅ Configuración de Facturas - Completado

## 📋 Resumen

Se ha integrado exitosamente el módulo de configuración de facturas en la sección de **Ajustes del Sitio Web**, siguiendo el mismo estilo y estructura de los ajustes de empresa existentes.

---

## 🎯 Componentes Creados

### 1. Frontend - Configuración de Factura
**Archivo**: `template/src/views/pages/settings/website-settings/invoice-settings.vue`

**Características**:
- ✅ Diseño idéntico a company-settings.vue
- ✅ Estructura con tabs/secciones organizadas
- ✅ Validación de formularios
- ✅ Notificaciones con SweetAlert2

**Campos Implementados**:

#### Información de la Empresa
- Razón Social (company_name) *
- Nombre Comercial (commercial_name)
- Tipo Doc. Identificación (id_type)
- CEDULA/RTN (company_rtn)
- SAR (sar)
- Tipo de Contribuyente (taxpayer_type)
- Tipo de Beneficiario (beneficiary_type)
- Representante (representative)
- Localización Global (global_location)

#### Información de Contacto
- Facebook (facebook)
- Instagram (instagram)
- X/Twitter (twitter)
- Email (company_email) *
- Teléfono (company_phone)
- WhatsApp (whatsapp)

#### Dirección
- País (country)
- Estado (state)
- Ciudad (city)
- Sector (sector)
- Dirección (company_address)

#### Configuración de Factura
- Periodo Desde (period_from)
- Periodo Hasta (period_to)
- Moneda (default_currency)
- Idioma (language)
- Sitio Web (company_website)
- Código Postal (postal_code)

#### Numeración de Facturas
- Prefijo de Factura (invoice_prefix) *
- Último Número (last_invoice_number)
- Longitud del Número (invoice_number_length)
- Prefijo Nota de Crédito (credit_note_prefix)

#### Logo de la Empresa
- Cargar Logo (company_logo_path)
- Ancho del Logo (logo_width)

#### Configuración Adicional
- Tasa de Impuesto (default_tax_rate)
- Términos de Pago (default_payment_terms)
- Mostrar Logo en Facturas (show_company_logo)
- Mostrar Desglose de Impuestos (show_tax_breakdown)
- Texto del Pie de Página (invoice_footer_text)
- Notas por Defecto (invoice_notes)

---

### 2. Frontend - Plantilla de Factura
**Archivo**: `template/src/views/pages/settings/website-settings/invoice-template.vue`

**Características**:
- ✅ 6 plantillas prediseñadas (Clásica, Moderna, Minimalista, Profesional, Elegante, Corporativa)
- ✅ Personalización de colores (primario y secundario)
- ✅ Selección de fuente tipográfica
- ✅ Opciones de visualización
- ✅ Campos personalizables de encabezado y pie
- ✅ Vista previa de plantilla

---

## 🗄️ Base de Datos

### Columnas Agregadas a `billing_settings`
```sql
- commercial_name VARCHAR(255)
- id_type VARCHAR(50)
- sar VARCHAR(255)
- taxpayer_type VARCHAR(50)
- beneficiary_type VARCHAR(50)
- representative VARCHAR(255)
- global_location VARCHAR(255)
- facebook VARCHAR(255)
- instagram VARCHAR(255)
- twitter VARCHAR(255)
- whatsapp VARCHAR(20)
- country VARCHAR(100)
- state VARCHAR(100)
- city VARCHAR(100)
- sector VARCHAR(100)
- period_from DATE
- period_to DATE
- language VARCHAR(10) DEFAULT 'es'
- postal_code VARCHAR(20)
- logo_width INT DEFAULT 150
- company_logo_path VARCHAR(500)
```

**Script de Migración**: `backend/add-invoice-columns.js`
- ✅ Verifica si las columnas existen antes de agregarlas
- ✅ Ejecutado exitosamente
- ✅ Todas las columnas creadas

---

## 🔧 Backend

### Servicio Actualizado
**Archivo**: `backend/src/services/billing.service.js`

**Métodos**:
- `getSettings()` - Obtener configuración (ya existía)
- `updateSettings(settingsData)` - Actualizar configuración (actualizado)

**Campos Permitidos** (actualizados):
```javascript
const allowedFields = [
  'company_name', 'commercial_name', 'company_rtn', 'company_address',
  'company_phone', 'company_email', 'company_logo', 'company_website',
  'invoice_prefix', 'credit_note_prefix', 'default_payment_terms',
  'default_tax_rate', 'default_currency', 'enable_auto_email',
  'email_subject', 'email_body', 'show_company_logo', 'show_tax_breakdown',
  'invoice_footer_text', 'invoice_notes', 'id_type', 'sar', 'taxpayer_type',
  'beneficiary_type', 'representative', 'global_location', 'facebook',
  'instagram', 'twitter', 'whatsapp', 'country', 'state', 'city',
  'sector', 'period_from', 'period_to', 'language', 'postal_code',
  'logo_width', 'company_logo_path', 'invoice_number_length'
];
```

### API Endpoints (existentes)
```
GET  /api/v1/billing/settings
  - Obtener configuración de facturación

PUT  /api/v1/billing/settings
  - Actualizar configuración de facturación
  - Body: { ...todos los campos mencionados arriba }
```

---

## 🎨 Rutas y Navegación

### Rutas Frontend Agregadas
**Archivo**: `template/src/router/index.js`

```javascript
{
  path: "/website-settings",
  name: "WebsiteSettings",
  component: () => import("@/views/pages/settings/website-settings/index.vue"),
  children: [
    {
      path: "invoice-settings",
      component: () => import('@/views/pages/settings/website-settings/invoice-settings.vue')
    },
    {
      path: "invoice-template",
      component: () => import('@/views/pages/settings/website-settings/invoice-template.vue')
    }
  ]
}
```

### Menú de Navegación Actualizado
**Archivo**: `template/src/assets/json/settings.json`

```json
{
  "icon": "airplay",
  "title": "Ajustes del Sitio Web",
  "page": "website-settings",
  "subMenu": [
    { "title": "Ajustes de Empresa", "routes": "/website-settings/company-settings" },
    { "title": "Localización", "routes": "/website-settings/localization-settings" },
    { "title": "Ajustes de Factura", "routes": "/website-settings/invoice-settings" },
    { "title": "Plantilla de Factura", "routes": "/website-settings/invoice-template" },
    { "title": "POS", "routes": "/app-settings/pos-settings" },
    { "title": "Resoluciones", "routes": "/financial-settings/resolution-settings" }
  ]
}
```

---

## 🚀 Cómo Usar

### 1. Acceder a la Configuración
1. Iniciar sesión en ProsperPOS
2. Ir a **Ajustes**
3. Seleccionar **Ajustes del Sitio Web**
4. Hacer clic en **Ajustes de Factura**

### 2. Configurar los Datos
- Completar todos los campos requeridos (marcados con *)
- Agregar información de contacto y redes sociales
- Configurar la numeración de facturas
- Subir el logo de la empresa
- Ajustar las opciones de visualización
- Hacer clic en **Guardar Cambios**

### 3. Personalizar Plantilla
1. Ir a **Plantilla de Factura**
2. Seleccionar una plantilla prediseñada
3. Personalizar colores y fuente
4. Configurar opciones de visualización
5. Agregar textos personalizados de encabezado y pie
6. Hacer clic en **Guardar Configuración**

---

## ✅ Estado del Proyecto

### Completado
- ✅ Base de datos actualizada con nuevos campos
- ✅ Backend actualizado para soportar nuevos campos
- ✅ Componente invoice-settings.vue creado con todos los campos
- ✅ Componente invoice-template.vue creado
- ✅ Rutas frontend configuradas
- ✅ Menú de navegación actualizado
- ✅ Diseño consistente con company-settings.vue

### Pendiente (según indicaciones del usuario)
- ⏳ Dashboard de facturación (pospuesto)
- ⏳ Mejoras al POS (por definir)

---

## 📝 Notas Técnicas

### Estilo y Diseño
- Utiliza Bootstrap 5 para el layout
- Diseño responsive con grid system
- Componentes consistentes con el resto del sistema
- Validaciones en frontend y backend

### Seguridad
- Rutas protegidas con autenticación JWT
- Permisos basados en roles (RBAC)
- Validación de datos en backend
- Sanitización de inputs

### Base de Datos
- Soft deletes para auditoría
- Timestamps automáticos
- Transacciones para integridad de datos
- Índices para performance

---

## 🎉 Resultado Final

El módulo de configuración de facturas está completamente integrado en la sección de **Ajustes del Sitio Web**, siguiendo exactamente el mismo estilo y estructura que los ajustes de empresa. Todos los campos solicitados en la imagen de referencia han sido implementados y están funcionales.

**Rutas de Acceso**:
- Configuración: `/website-settings/invoice-settings`
- Plantilla: `/website-settings/invoice-template`

**Fecha de Completado**: 11 de Noviembre, 2025
**Versión**: 1.0.0

---

## 🔗 Archivos Relacionados

### Frontend
- `template/src/views/pages/settings/website-settings/invoice-settings.vue`
- `template/src/views/pages/settings/website-settings/invoice-template.vue`
- `template/src/router/index.js`
- `template/src/assets/json/settings.json`

### Backend
- `backend/src/services/billing.service.js`
- `backend/src/controllers/billing.controller.js`
- `backend/add-invoice-columns.js` (script de migración)

### Base de Datos
- Tabla: `billing_settings`
- 21 nuevas columnas agregadas

---
