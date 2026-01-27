# MANUAL TÉCNICO - ProsperPOS

**Sistema de Punto de Venta con Facturación Electrónica**

**Versión:** 1.0
**Fecha:** Diciembre 2025
**Desarrollado para:** Honduras (Cumplimiento SAR)

---

## TABLA DE CONTENIDOS

1. [Introducción](#1-introducción)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Backend - API REST](#3-backend---api-rest)
4. [Frontend - Template Administrativo](#4-frontend---template-administrativo)
5. [Base de Datos](#5-base-de-datos)
6. [Módulos Funcionales](#6-módulos-funcionales)
7. [Seguridad y Autenticación](#7-seguridad-y-autenticación)
8. [Integraciones](#8-integraciones)
9. [Configuración y Despliegue](#9-configuración-y-despliegue)
10. [API Reference](#10-api-reference)
11. [Mantenimiento y Soporte](#11-mantenimiento-y-soporte)

---

## 1. INTRODUCCIÓN

<!-- IMAGEN SUGERIDA: Logo de ProsperPOS o captura del dashboard principal -->

### 1.1 Descripción General

ProsperPOS es un sistema integral de punto de venta (POS) diseñado específicamente para el mercado hondureño, con cumplimiento total de las regulaciones del Servicio de Administración de Rentas (SAR). El sistema incluye:

- **Sistema POS completo** con interfaz rápida y eficiente
- **Gestión de inventario multi-almacén** con trazabilidad completa
- **Facturación electrónica** conforme a normativas SAR Honduras
- **Sistema de reportes** completo para toma de decisiones
- **Gestión de compras y proveedores**
- **Sistema de recursos humanos** básico
- **Multi-sucursal** con transferencias entre almacenes

### 1.2 Alcance del Sistema

El sistema cubre los siguientes procesos de negocio:

1. **Ventas:** POS, facturación, cotizaciones, devoluciones
2. **Inventario:** Productos, categorías, marcas, stock, ajustes, inventario físico
3. **Compras:** Órdenes de compra, recepción, devoluciones, libro de compras
4. **Clientes y Proveedores:** CRM básico, estados de cuenta
5. **Finanzas:** Cuentas bancarias, flujo de caja, utilidades
6. **Reportes:** Libro de ventas, libro de compras, reportes de inventario
7. **RRHH:** Empleados, departamentos, posiciones
8. **Logística:** Envíos, vehículos, sucursales

### 1.3 Stack Tecnológico

<!-- IMAGEN SUGERIDA: Diagrama con los logos de las tecnologías utilizadas -->

#### Backend
- **Runtime:** Node.js v16+
- **Framework:** Express.js v4.21+
- **Base de datos:** MySQL 8.0+
- **ORM:** MySQL2 (native driver)
- **Autenticación:** JWT + Refresh Tokens
- **Logs:** Winston con rotación diaria
- **Documentos:** PDFKit, ExcelJS
- **OCR:** Tesseract.js
- **Cola de trabajos:** Bull + Redis
- **Email:** Nodemailer
- **Cloud Storage:** Google Cloud Storage
- **Procesamiento de imágenes:** Sharp
- **Códigos de barra:** JsBarcode (generación en frontend)

#### Frontend (Admin)
- **Framework:** Vue 3.5+ (Composition API)
- **Build:** Vite 6.3+
- **Router:** Vue Router 4.5+
- **Estado:** Pinia/Vuex
- **UI:** Bootstrap 5.3+, Ant Design Vue 4.2+
- **Validación:** VeeValidate + Yup
- **Gráficos:** ApexCharts, Chart.js
- **Iconos:** Bootstrap Icons, FontAwesome, Material Icons
- **Códigos de barra:** JsBarcode
- **Generación PDF:** jsPDF

---

## 2. ARQUITECTURA DEL SISTEMA

<!-- IMAGEN SUGERIDA: Diagrama completo de arquitectura del sistema -->

### 2.1 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTACIÓN                            │
├──────────────────────────────────────────────────────────────┤
│              Admin Template (Vue 3 + Vite)                   │
│                    Port: 3001                                │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API REST - BACKEND                        │
│                    (Express.js)                              │
│                    Port: 3000                                │
├─────────────────────────────────────────────────────────────┤
│  Controllers (50+) │ Services (38+) │ Middlewares           │
│  Routes (54+)      │ Models (32+)   │ Utils                 │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┼───────────┬───────────────┐
                │           │           │               │
                ▼           ▼           ▼               ▼
         ┌──────────┐ ┌─────────┐ ┌─────────┐  ┌──────────────┐
         │  MySQL   │ │  Redis  │ │  Local  │  │ Google Cloud │
         │ Database │ │  Cache  │ │ Storage │  │   Storage    │
         └──────────┘ └─────────┘ └─────────┘  └──────────────┘
                                                │ São Paulo, BR│
                                                │ Images Bucket│
                                                └──────────────┘
```

### 2.2 Flujo de Datos

<!-- IMAGEN SUGERIDA: Diagrama de flujo de datos desde el cliente hasta la base de datos -->

1. **Cliente → Servidor:**
   - El usuario interactúa con la interfaz Vue
   - Las peticiones HTTP se envían a la API REST
   - Los middlewares validan autenticación y permisos
   - Los controladores procesan la lógica de negocio
   - Los servicios interactúan con la base de datos
   - Se retorna la respuesta al cliente

2. **Servidor → Base de Datos:**
   - Los modelos definen la estructura de datos
   - Las consultas SQL se ejecutan mediante MySQL2
   - Las transacciones garantizan la integridad
   - Los triggers mantienen la consistencia

### 2.3 Estructura de Directorios

```
ProsperPOS/
├── backend/                    # API REST Node.js
│   ├── config/                # Configuración de la aplicación
│   ├── database/              # Migraciones y seeds
│   ├── src/
│   │   ├── controllers/       # Lógica de negocio (50+ archivos)
│   │   ├── models/            # Modelos de datos (32+ archivos)
│   │   ├── services/          # Servicios (38+ archivos)
│   │   ├── routes/            # Definición de rutas (54+ archivos)
│   │   ├── middleware/        # Middlewares de Express
│   │   └── utils/             # Utilidades comunes
│   ├── uploads/               # Archivos subidos
│   ├── logs/                  # Logs de la aplicación
│   ├── server.js              # Punto de entrada
│   └── app.js                 # Configuración de Express
│
├── template/                   # Frontend administrativo Vue 3
│   ├── src/
│   │   ├── api/               # Configuración API
│   │   ├── assets/            # Recursos estáticos
│   │   ├── components/        # Componentes Vue (73+ modales)
│   │   ├── router/            # Configuración de rutas (757+ líneas)
│   │   ├── services/          # Capa de servicios API
│   │   ├── stores/            # Estado global (Pinia)
│   │   ├── utils/             # Funciones auxiliares
│   │   └── views/             # Páginas y layouts
│   │       ├── layouts/       # Layouts (header, sidebar, etc.)
│   │       └── pages/         # Páginas de la aplicación
│   ├── public/                # Archivos públicos
│   └── vite.config.js         # Configuración Vite
│
└── docs/                       # Documentación del proyecto
    ├── DICCIONARIO_DATOS_PROSPERPOS.md
    ├── ARCHITECTURE_SUMMARY.txt
    └── [40+ archivos de documentación]
```

---

## 3. BACKEND - API REST

### 3.1 Estructura del Backend

#### 3.1.1 Punto de Entrada (server.js)

**Ubicación:** `backend/server.js`

**Funciones principales:**
1. Inicialización de la base de datos
2. Ejecución automática de migraciones
3. Inicio del servidor Express
4. Manejo de errores no capturados
5. Gestión de señales de apagado

#### 3.1.2 Configuración de Express (app.js)

**Ubicación:** `backend/app.js`

**Middlewares configurados:**
- `helmet` - Seguridad HTTP
- `cors` - Cross-Origin Resource Sharing
- `compression` - Compresión GZIP
- `express.json()` - Parseo JSON
- `morgan` - Logs HTTP
- Rate limiting personalizado
- Middleware de autenticación
- Middleware de manejo de errores

#### 3.1.3 Configuración (config/app.config.js)

**Ubicación:** `backend/config/app.config.js`

**Variables de configuración:**
```javascript
{
  env: process.env.NODE_ENV,
  port: process.env.PORT || 3000,
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expire: process.env.JWT_EXPIRE || '24h',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d'
  },
  cors: {
    origin: process.env.FRONTEND_URL
  },
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
  }
}
```

### 3.2 Capa de Controladores

**Ubicación:** `backend/src/controllers/`

**Total de controladores:** 50+

#### Controladores Principales:

##### 3.2.1 auth.controller.js
- `login()` - Autenticación de usuarios
- `register()` - Registro de nuevos usuarios
- `refreshToken()` - Renovación de tokens JWT
- `logout()` - Cierre de sesión
- `forgotPassword()` - Recuperación de contraseña
- `resetPassword()` - Restablecimiento de contraseña
- `changePassword()` - Cambio de contraseña

##### 3.2.2 pos.controller.js
- `getProducts()` - Búsqueda rápida de productos para POS
- `createSale()` - Creación de venta
- `getSaleById()` - Consulta de venta
- `printInvoice()` - Impresión de factura
- `saveDraft()` - Guardar borrador de venta
- `getDrafts()` - Obtener borradores

##### 3.2.3 product.controller.js
- `getAllProducts()` - Listar productos con filtros
- `getProductById()` - Obtener producto por ID
- `createProduct()` - Crear producto
- `updateProduct()` - Actualizar producto
- `deleteProduct()` - Eliminar producto (soft delete)
- `bulkImport()` - Importación masiva desde Excel
- `exportProducts()` - Exportación a Excel/PDF
- `checkBarcode()` - Validar código de barras único
- `getProductsByCategory()` - Productos por categoría
- `getLowStock()` - Productos con bajo stock

##### 3.2.4 customer.controller.js
- `getAllCustomers()` - Listar clientes
- `getCustomerById()` - Consultar cliente
- `createCustomer()` - Crear cliente
- `updateCustomer()` - Actualizar cliente
- `deleteCustomer()` - Eliminar cliente
- `getCustomerStatement()` - Estado de cuenta
- `importCustomers()` - Importación masiva

##### 3.2.5 billing.controller.js
- `generateInvoice()` - Generar factura electrónica
- `validateResolution()` - Validar resolución SAR
- `getAvailableConsecutive()` - Obtener consecutivo disponible
- `checkCAI()` - Validar CAI vigente
- `generateElectronicReport()` - Reporte electrónico SAR

##### 3.2.6 dashboard.controller.js
- `getDashboardStats()` - Estadísticas del dashboard
- `getSalesChart()` - Gráfico de ventas
- `getTopProducts()` - Productos más vendidos
- `getTopCustomers()` - Mejores clientes
- `getLowStockAlert()` - Alertas de stock bajo
- `getRecentTransactions()` - Transacciones recientes

##### 3.2.7 inventory-adjustment.controller.js
- `getAdjustments()` - Listar ajustes de inventario
- `createAdjustment()` - Crear ajuste
- `approveAdjustment()` - Aprobar ajuste
- `cancelAdjustment()` - Cancelar ajuste
- `getAdjustmentReport()` - Reporte de ajustes

##### 3.2.8 physical-inventory.controller.js
- `startInventoryCount()` - Iniciar conteo físico
- `saveCount()` - Guardar conteo
- `processInventory()` - Procesar inventario
- `getDiscrepancies()` - Obtener diferencias
- `generateReport()` - Generar reporte

##### 3.2.9 upload.controller.js
**Descripción:** Controlador especializado para subida de archivos a Google Cloud Storage

**Endpoints:**
- `uploadProductImage()` - Subir imagen principal de producto
  - POST `/api/v1/upload/product`
  - Body: `multipart/form-data` con campos `file`, `productId`, `imageType`
- `uploadProductGallery()` - Subir galería de imágenes
  - POST `/api/v1/upload/product/gallery`
  - Body: `multipart/form-data` con campo `files[]`, `productId`
- `uploadCategoryImage()` - Subir imagen de categoría
  - POST `/api/v1/upload/category`
  - Body: `multipart/form-data` con campos `file`, `categoryId`
- `deleteProductImage()` - Eliminar imagen de producto
  - DELETE `/api/v1/upload/product/:id/:type`
- `listProductImages()` - Listar todas las imágenes de un producto
  - GET `/api/v1/upload/product/:id/images`
- `getSignedUrl()` - Generar URL firmada temporal
  - POST `/api/v1/upload/signed-url`
  - Body: `{ filePath, expiresIn }`

**Características:**
- Validación de tipos de archivo (JPEG, PNG, GIF)
- Límite de tamaño (10MB por defecto)
- Optimización automática con Sharp
- Integración con Google Cloud Storage
- Manejo de errores robusto

##### 3.2.10 barcode.controller.js
**Descripción:** Controlador para generación de códigos de barra de productos

**Endpoints:**
- `getProductsForBarcodes()` - Obtener productos para códigos de barra
  - GET `/api/v1/barcodes/products`
  - Query params: `category_id`, `subcategory_id`, `product_id`, `branch_id`
- `generateBarcodePDF()` - Generar PDF con códigos (implementado en frontend)
  - POST `/api/v1/barcodes/generate-pdf`
  - Body: `{ products[], labelSize, showName, showPrice, showSKU, showCategory }`
- `getCategories()` - Listar categorías para filtros
  - GET `/api/v1/barcodes/categories`
- `getSubcategories()` - Listar subcategorías para filtros
  - GET `/api/v1/barcodes/subcategories`
  - Query params: `category_id`

**Características:**
- Filtros avanzados por categoría, subcategoría, producto
- Datos completos para generación de etiquetas
- Soporte para múltiples productos
- Integración con sistema de inventario

### 3.3 Capa de Servicios

**Ubicación:** `backend/src/services/`

**Total de servicios:** 38+

Los servicios contienen la lógica de negocio y las operaciones de base de datos.

#### Ejemplo: auth.service.js

```javascript
class AuthService {
  async login(email, password) {
    // 1. Validar credenciales
    // 2. Verificar intentos de login
    // 3. Generar tokens JWT
    // 4. Actualizar último acceso
    // 5. Retornar usuario y tokens
  }

  async refreshToken(refreshToken) {
    // 1. Validar refresh token
    // 2. Verificar en base de datos
    // 3. Generar nuevos tokens
    // 4. Actualizar registro
  }

  async validateToken(token) {
    // 1. Decodificar JWT
    // 2. Verificar firma
    // 3. Validar expiración
    // 4. Cargar permisos del usuario
  }
}
```

#### Ejemplo: product.service.js

```javascript
class ProductService {
  async getAllProducts(filters, pagination) {
    // 1. Construir query con filtros
    // 2. Aplicar joins con categorías, marcas, unidades
    // 3. Aplicar paginación
    // 4. Incluir stock actual
    // 5. Retornar resultados
  }

  async createProduct(productData) {
    // 1. Validar datos
    // 2. Verificar código de barras único
    // 3. Procesar imagen
    // 4. Insertar en base de datos
    // 5. Crear registro de auditoría
  }

  async updateStock(productId, warehouseId, quantity, type) {
    // 1. Iniciar transacción
    // 2. Actualizar tabla stock
    // 3. Crear registro en stock_cargo_descargo
    // 4. Commit transacción
  }
}
```

#### Ejemplo: barcode.service.js

```javascript
class BarcodeService {
  async getProductsForBarcodes(filters) {
    // 1. Construir query con filtros (categoría, subcategoría, producto)
    // 2. JOIN con categorías, subcategorías, marcas
    // 3. Seleccionar productos con código válido
    // 4. Formatear datos para códigos de barra
    // 5. Retornar array de productos
  }

  async getCategories() {
    // 1. Consultar categorías activas
    // 2. Ordenar alfabéticamente
    // 3. Formatear para selector
  }

  async getSubcategories(categoryId) {
    // 1. Consultar subcategorías (opcionalmente filtradas)
    // 2. JOIN con categoría padre
    // 3. Retornar lista formateada
  }
}
```

**Nota:** La generación del PDF con códigos de barra se realiza en el frontend usando `jsbarcode` y `jsPDF` para mayor flexibilidad y menor carga en el servidor.

### 3.4 Capa de Modelos

**Ubicación:** `backend/src/models/`

**Total de modelos:** 32+

Los modelos definen la estructura y operaciones CRUD básicas.

#### Ejemplo: product.model.js

```javascript
class ProductModel {
  static tableName = 'products';

  static async findAll(filters = {}) {
    // SELECT con joins y filtros
  }

  static async findById(id) {
    // SELECT por ID con datos relacionados
  }

  static async create(data) {
    // INSERT con datos de auditoría
  }

  static async update(id, data) {
    // UPDATE con updated_by y updated_at
  }

  static async softDelete(id, deletedBy) {
    // UPDATE deleted_at en lugar de DELETE
  }

  static async restore(id) {
    // UPDATE deleted_at = NULL
  }
}
```

### 3.5 Sistema de Rutas

**Ubicación:** `backend/src/routes/`

**Total de archivos de rutas:** 54+

#### Estructura de Rutas (routes/index.js)

```javascript
const express = require('express');
const router = express.Router();

// Rutas públicas
router.use('/auth', require('./auth.routes'));

// Rutas protegidas (requieren autenticación)
router.use('/users', auth, require('./users.routes'));
router.use('/products', auth, require('./products.routes'));
router.use('/customers', auth, require('./customers.routes'));
router.use('/sales', auth, require('./sales.routes'));
router.use('/purchases', auth, require('./purchases.routes'));
router.use('/pos', auth, require('./pos.routes'));
router.use('/dashboard', auth, require('./dashboard.routes'));
router.use('/reports', auth, require('./reports.routes'));
// ... (47+ rutas más)

module.exports = router;
```

#### Ejemplo: products.routes.js

```javascript
const router = require('express').Router();
const productController = require('../controllers/product.controller');
const { checkPermission } = require('../middleware/permission.middleware');
const upload = require('../middleware/upload.middleware');

// GET /api/v1/products - Listar productos
router.get('/',
  checkPermission('products.view'),
  productController.getAllProducts
);

// GET /api/v1/products/:id - Obtener producto
router.get('/:id',
  checkPermission('products.view'),
  productController.getProductById
);

// POST /api/v1/products - Crear producto
router.post('/',
  checkPermission('products.create'),
  upload.single('image'),
  productController.createProduct
);

// PUT /api/v1/products/:id - Actualizar producto
router.put('/:id',
  checkPermission('products.update'),
  upload.single('image'),
  productController.updateProduct
);

// DELETE /api/v1/products/:id - Eliminar producto
router.delete('/:id',
  checkPermission('products.delete'),
  productController.deleteProduct
);

// POST /api/v1/products/bulk-import - Importación masiva
router.post('/bulk-import',
  checkPermission('products.import'),
  upload.single('file'),
  productController.bulkImport
);

module.exports = router;
```

### 3.6 Middlewares

**Ubicación:** `backend/src/middleware/`

#### 3.6.1 auth.middleware.js

```javascript
// Validación de JWT y carga de usuario
async function authenticate(req, res, next) {
  // 1. Extraer token del header Authorization
  // 2. Verificar firma y expiración
  // 3. Cargar datos del usuario
  // 4. Adjuntar req.user
  // 5. Continuar al siguiente middleware
}
```

#### 3.6.2 permission.middleware.js

```javascript
// Verificación de permisos basada en roles
function checkPermission(permission) {
  return async (req, res, next) => {
    // 1. Obtener permisos del usuario
    // 2. Verificar si tiene el permiso requerido
    // 3. Permitir o denegar acceso
  }
}
```

#### 3.6.3 validation.middleware.js

```javascript
// Validación de datos de entrada
function validateRequest(schema) {
  return (req, res, next) => {
    // 1. Validar req.body contra schema (Joi/Yup)
    // 2. Retornar errores de validación
    // 3. Continuar si válido
  }
}
```

#### 3.6.4 error.middleware.js

```javascript
// Manejo centralizado de errores
function errorHandler(err, req, res, next) {
  // 1. Loguear error con Winston
  // 2. Determinar código de estado
  // 3. Formatear mensaje de error
  // 4. Retornar respuesta JSON estandarizada
}
```

#### 3.6.5 rate-limit.middleware.js

```javascript
// Límite de peticiones por IP
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 peticiones
  message: 'Demasiadas peticiones desde esta IP'
});
```

### 3.7 Utilidades

**Ubicación:** `backend/src/utils/`

#### 3.7.1 database.js
- Conexión a MySQL
- Pool de conexiones
- Manejo de transacciones
- Query helpers

#### 3.7.2 logger.js
- Winston logger configurado
- Rotación de logs diaria
- Niveles: error, warn, info, debug
- Formato JSON para producción

#### 3.7.3 response.js
- Formatos de respuesta estandarizados
- `success()`, `error()`, `paginated()`

#### 3.7.4 errors.js
- Clases de error personalizadas
- `ValidationError`, `AuthenticationError`, `NotFoundError`

#### 3.7.5 google-cloud-storage.js
**Descripción:** Servicio de integración con Google Cloud Storage para almacenamiento de imágenes en la nube.

**Clase principal:** `GoogleCloudStorageService`

**Métodos disponibles:**

```javascript
class GoogleCloudStorageService {
  // Subir archivo genérico
  async uploadFile(fileBuffer, fileName, folder, metadata)

  // Subir imagen de producto
  async uploadProductImage(fileBuffer, productId, type, options)

  // Subir imagen de categoría
  async uploadCategoryImage(fileBuffer, categoryId, options)

  // Eliminar archivo
  async deleteFile(fileUrl)

  // Eliminar imagen de producto
  async deleteProductImage(productId, type)

  // Obtener URL firmada temporal
  async getSignedUrl(filePath, expiresIn)

  // Listar archivos en una carpeta
  async listFiles(folder, options)

  // Verificar si archivo existe
  async fileExists(filePath)

  // Copiar archivo
  async copyFile(sourcePath, destinationPath)

  // Mover archivo
  async moveFile(sourcePath, destinationPath)
}
```

**Configuración requerida (.env):**
```env
GCP_PROJECT_ID=prosperpos-prod
GCS_BUCKET_NAME=prosperpos-images
GCS_KEYFILE_PATH=./prosperpos-credentials.json
IMAGE_BASE_URL=https://storage.googleapis.com/prosperpos-images
```

**Características:**
- Almacenamiento en la nube (São Paulo, Brasil)
- URLs públicas para imágenes
- Organización por carpetas (products, categories, invoices)
- Optimización automática de imágenes con Sharp
- Nombres de archivo sanitizados
- Metadata personalizable
- Singleton pattern para eficiencia

**Ejemplo de uso:**
```javascript
const { getInstance } = require('./utils/google-cloud-storage');

const gcs = getInstance();

// Subir imagen de producto
const result = await gcs.uploadProductImage(
  fileBuffer,
  productId,
  'main',
  { extension: 'jpg', contentType: 'image/jpeg' }
);

console.log('URL:', result.url);
// https://storage.googleapis.com/prosperpos-images/products/product_123_main.jpg
```

---

## 4. FRONTEND - TEMPLATE ADMINISTRATIVO

<!-- IMAGEN SUGERIDA: Captura del dashboard principal del sistema -->

### 4.1 Estructura del Template

**Framework:** Vue 3.5+ con Composition API
**Build Tool:** Vite 6.3+
**Puerto:** 3001

### 4.2 Arquitectura de Componentes

#### 4.2.1 Layouts

**Ubicación:** `template/src/views/layouts/`

**Layouts disponibles:**

1. **layouts-header.vue**
   - Barra de navegación superior
   - Menú de usuario
   - Notificaciones
   - Búsqueda rápida

2. **layouts-sidebar.vue**
   - Menú lateral de navegación
   - Iconos y categorías
   - Navegación jerárquica
   - Expansión/contracción

3. **pos-header.vue**
   - Header especializado para POS
   - Atajos de teclado
   - Búsqueda rápida de productos

4. **horizontal-header.vue**
   - Layout alternativo horizontal

<!-- IMAGEN SUGERIDA: Captura del layout principal mostrando header y sidebar -->

#### 4.2.2 Componentes Globales

**Ubicación:** `template/src/components/`

**Total de modales:** 73+

**Categorías de componentes:**
- **Breadcrumb:** Navegación de migas de pan
- **Modales:** 73+ modales para operaciones CRUD
- **Contadores:** Widgets de estadísticas
- **Tablas:** Componentes de tabla reutilizables
- **Formularios:** Componentes de formulario

### 4.3 Sistema de Rutas

**Ubicación:** `template/src/router/index.js`

**Tamaño:** 757+ líneas de código

#### Estructura de Rutas:

```javascript
const routes = [
  // Rutas públicas
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/pages/authentication/login.vue')
  },

  // Rutas protegidas
  {
    path: '/',
    component: () => import('@/views/layouts/main-layout.vue'),
    meta: { requiresAuth: true },
    children: [
      // Dashboard
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/pages/dashboard/index.vue')
      },

      // Inventario
      {
        path: '/inventory/products',
        name: 'ProductList',
        component: () => import('@/views/pages/inventory/products/list.vue'),
        meta: { permission: 'products.view' }
      },

      // Ventas
      {
        path: '/pos',
        name: 'POS',
        component: () => import('@/views/pages/sales/pos.vue'),
        meta: { permission: 'sales.create' }
      },

      // ... (100+ rutas más)
    ]
  }
];
```

#### Guards de Navegación:

```javascript
router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters['auth/isAuthenticated'];
  const userPermissions = store.getters['auth/permissions'];

  // Verificar autenticación
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next('/login');
  }

  // Verificar permisos
  if (to.meta.permission) {
    const hasPermission = userPermissions.includes(to.meta.permission);
    if (!hasPermission) {
      return next('/unauthorized');
    }
  }

  next();
});
```

### 4.4 Gestión de Estado (Stores)

**Ubicación:** `template/src/stores/`

**Framework:** Pinia

#### 4.4.1 auth.js (Store de Autenticación)

```javascript
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token'),
    refreshToken: localStorage.getItem('refreshToken'),
    permissions: []
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    hasPermission: (state) => (permission) => {
      return state.permissions.includes(permission);
    }
  },

  actions: {
    async login(credentials) {
      const response = await api.post('/auth/login', credentials);
      this.user = response.data.user;
      this.token = response.data.token;
      this.refreshToken = response.data.refreshToken;
      this.permissions = response.data.permissions;

      localStorage.setItem('token', this.token);
      localStorage.setItem('refreshToken', this.refreshToken);
    },

    async logout() {
      await api.post('/auth/logout');
      this.user = null;
      this.token = null;
      this.refreshToken = null;
      this.permissions = [];

      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  }
});
```

### 4.5 Capa de Servicios API

**Ubicación:** `template/src/services/`

#### 4.5.1 Configuración de Axios (api/config.js)

```javascript
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor de peticiones
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuestas
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const authStore = useAuthStore();

    // Manejo de token expirado
    if (error.response?.status === 401) {
      try {
        await authStore.refreshAccessToken();
        // Reintentar petición original
        return api.request(error.config);
      } catch (refreshError) {
        authStore.logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### 4.6 Páginas Principales

#### 4.6.1 Dashboard

**Ubicación:** `template/src/views/pages/dashboard/index.vue`

<!-- IMAGEN SUGERIDA: Captura completa del dashboard con gráficos y estadísticas -->

**Características:**
- Resumen de ventas del día/mes/año
- Gráficos de tendencias
- Productos más vendidos
- Alertas de stock bajo
- Ventas por vendedor
- Estado de facturación

#### 4.6.2 POS (Punto de Venta)

**Ubicación:** `template/src/views/pages/sales/pos.vue`

<!-- IMAGEN SUGERIDA: Captura de la interfaz del POS con productos y carrito -->

**Características:**
- Búsqueda rápida de productos (por nombre, código, barras)
- Carrito de compra en tiempo real
- Cálculo automático de impuestos
- Múltiples métodos de pago
- Descuentos por producto o total
- Selección de cliente
- Impresión de factura
- Guardado de borradores

**Interfaz del POS:**
```vue
<template>
  <div class="pos-container">
    <!-- Panel izquierdo: Productos -->
    <div class="products-panel">
      <div class="search-box">
        <input
          v-model="searchQuery"
          @input="searchProducts"
          placeholder="Buscar producto (Nombre, Código, Barras)"
          autofocus
        />
      </div>

      <div class="product-grid">
        <ProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
          @click="addToCart(product)"
        />
      </div>
    </div>

    <!-- Panel derecho: Carrito -->
    <div class="cart-panel">
      <div class="customer-select">
        <a-select
          v-model="selectedCustomer"
          placeholder="Seleccionar cliente"
          show-search
          :options="customers"
        />
      </div>

      <div class="cart-items">
        <CartItem
          v-for="item in cartItems"
          :key="item.id"
          :item="item"
          @update-quantity="updateQuantity"
          @remove="removeFromCart"
        />
      </div>

      <div class="cart-totals">
        <div class="total">
          <span>Total:</span>
          <span>{{ formatCurrency(total) }}</span>
        </div>
      </div>

      <div class="action-buttons">
        <a-button
          type="primary"
          @click="processSale"
          size="large"
        >
          Procesar Venta (F9)
        </a-button>
      </div>
    </div>
  </div>
</template>
```

#### 4.6.3 Lista de Productos

**Ubicación:** `template/src/views/pages/inventory/products/list.vue`

<!-- IMAGEN SUGERIDA: Captura de la tabla de productos con filtros -->

**Características:**
- Tabla con paginación
- Búsqueda y filtros avanzados
- Exportación a Excel/PDF
- Importación masiva desde Excel
- Acciones CRUD inline
- Vista de grid/lista alternativa

#### 4.6.4 Reportes

**Sales Book (Libro de Ventas)**

**Ubicación:** `template/src/views/pages/reports/sales-book.vue`

<!-- IMAGEN SUGERIDA: Captura del reporte de libro de ventas -->

**Características:**
- Filtros por fecha, vendedor, cliente
- Totales por método de pago
- Exportación a Excel/PDF
- Vista previa de impresión
- Cumplimiento SAR Honduras

---

## 5. BASE DE DATOS

<!-- IMAGEN SUGERIDA: Diagrama ER de las tablas principales -->

### 5.1 Información General

- **DBMS:** MySQL 8.0+
- **Nombre:** prosperpos
- **Charset:** utf8mb4
- **Collation:** utf8mb4_unicode_ci
- **Total de Tablas:** 60+
- **Total de Vistas:** 5

### 5.2 Migraciones Automáticas

**Ubicación:** `backend/database/migrations/`

El sistema ejecuta migraciones automáticamente al iniciar:

1. Verifica la existencia de la base de datos
2. Crea tablas si no existen
3. Aplica migraciones pendientes
4. Crea índices y claves foráneas
5. Ejecuta triggers y procedimientos almacenados

### 5.3 Esquema de Tablas Principales

#### 5.3.1 Seguridad y Autenticación

**users**
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  phone VARCHAR(20),
  avatar VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_email (email),
  INDEX idx_username (username)
);
```

**roles**
```sql
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255),
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**permissions**
```sql
CREATE TABLE permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  description VARCHAR(255),
  module VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5.3.2 Productos e Inventario

**products**
```sql
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  barcode VARCHAR(100) UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id INT,
  subcategory_id INT,
  brand_id INT,
  unit_id INT NOT NULL,
  cost_price DECIMAL(15,2) DEFAULT 0,
  sale_price DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 15.00,
  min_stock INT DEFAULT 0,
  max_stock INT DEFAULT 0,
  image VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT,
  updated_by INT,
  deleted_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (unit_id) REFERENCES units(id),
  INDEX idx_code (code),
  INDEX idx_barcode (barcode),
  INDEX idx_name (name)
);
```

**stock**
```sql
CREATE TABLE stock (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  quantity DECIMAL(15,3) DEFAULT 0,
  reserved_quantity DECIMAL(15,3) DEFAULT 0,
  available_quantity DECIMAL(15,3) GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  last_movement_date DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_product_warehouse (product_id, warehouse_id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);
```

**stock_cargo_descargo**
```sql
CREATE TABLE stock_cargo_descargo (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  reference_type ENUM('sale', 'purchase', 'adjustment', 'transfer', 'return') NOT NULL,
  reference_id INT,
  quantity DECIMAL(15,3) NOT NULL,
  unit_cost DECIMAL(15,2),
  total_cost DECIMAL(15,2),
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  INDEX idx_product (product_id),
  INDEX idx_reference (reference_type, reference_id)
);
```

#### 5.3.3 Ventas

**sales**
```sql
CREATE TABLE sales (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_number VARCHAR(50) UNIQUE,
  customer_id INT,
  warehouse_id INT NOT NULL,
  sale_date DATETIME NOT NULL,
  payment_method ENUM('cash', 'card', 'transfer', 'credit') NOT NULL,
  payment_status ENUM('paid', 'pending', 'partial') DEFAULT 'paid',
  subtotal DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  cash_received DECIMAL(15,2),
  change_returned DECIMAL(15,2),
  notes TEXT,
  status ENUM('completed', 'cancelled', 'draft') DEFAULT 'completed',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  INDEX idx_invoice (invoice_number),
  INDEX idx_date (sale_date)
);
```

**sale_items**
```sql
CREATE TABLE sale_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity DECIMAL(15,3) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 15.00,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  subtotal DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) NOT NULL,
  total DECIMAL(15,2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

#### 5.3.4 Facturación Electrónica (SAR Honduras)

**resolutions**
```sql
CREATE TABLE resolutions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  resolution_number VARCHAR(50) UNIQUE NOT NULL,
  cai VARCHAR(100) UNIQUE NOT NULL,
  start_range BIGINT NOT NULL,
  end_range BIGINT NOT NULL,
  current_number BIGINT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cai (cai),
  INDEX idx_active (is_active)
);
```

### 5.4 Vistas de Base de Datos

**v_product_stock**
```sql
CREATE VIEW v_product_stock AS
SELECT
  p.id AS product_id,
  p.code,
  p.name,
  p.barcode,
  c.name AS category,
  b.name AS brand,
  w.id AS warehouse_id,
  w.name AS warehouse_name,
  COALESCE(s.quantity, 0) AS quantity,
  COALESCE(s.available_quantity, 0) AS available_quantity,
  p.min_stock,
  p.cost_price,
  p.sale_price
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id
CROSS JOIN warehouses w
LEFT JOIN stock s ON p.id = s.product_id AND w.id = s.warehouse_id
WHERE p.deleted_at IS NULL;
```

### 5.5 Triggers

**trg_update_stock_after_sale**
```sql
DELIMITER $$
CREATE TRIGGER trg_update_stock_after_sale
AFTER INSERT ON sale_items
FOR EACH ROW
BEGIN
  -- Actualizar stock
  UPDATE stock
  SET quantity = quantity - NEW.quantity,
      last_movement_date = NOW()
  WHERE product_id = NEW.product_id
    AND warehouse_id = (SELECT warehouse_id FROM sales WHERE id = NEW.sale_id);

  -- Registrar cargo/descargo
  INSERT INTO stock_cargo_descargo (
    product_id, warehouse_id, reference_type, reference_id, quantity
  )
  SELECT
    NEW.product_id,
    s.warehouse_id,
    'sale',
    NEW.sale_id,
    -NEW.quantity
  FROM sales s
  WHERE s.id = NEW.sale_id;
END$$
DELIMITER ;
```

---

## 6. MÓDULOS FUNCIONALES

### 6.1 Módulo de Inventario

<!-- IMAGEN SUGERIDA: Captura del módulo de inventario mostrando productos -->

#### Funcionalidades:
- Gestión de productos (CRUD completo)
- Categorías y subcategorías
- Marcas
- Unidades de medida
- Control de stock por almacén
- Alertas de stock mínimo
- Importación/exportación masiva
- Código de barras automático

#### Endpoints:
- `GET /api/v1/products` - Listar productos
- `POST /api/v1/products` - Crear producto
- `PUT /api/v1/products/:id` - Actualizar producto
- `DELETE /api/v1/products/:id` - Eliminar producto
- `GET /api/v1/products/low-stock` - Productos con stock bajo
- `POST /api/v1/products/bulk-import` - Importación masiva

### 6.2 Módulo de Ventas (POS)

<!-- IMAGEN SUGERIDA: Interfaz del POS en acción -->

#### Funcionalidades:
- Interfaz rápida de venta
- Búsqueda de productos por nombre/código/barras
- Carrito de compras en tiempo real
- Múltiples métodos de pago
- Descuentos por producto o total
- Guardado de borradores
- Impresión de facturas
- Facturación electrónica (SAR)

#### Endpoints:
- `POST /api/v1/pos/sale` - Crear venta
- `GET /api/v1/pos/products` - Buscar productos
- `POST /api/v1/pos/draft` - Guardar borrador
- `GET /api/v1/pos/drafts` - Obtener borradores

### 6.3 Módulo de Compras

#### Funcionalidades:
- Órdenes de compra
- Recepción de mercancía
- Devoluciones a proveedores
- Libro de compras
- Estados de cuenta con proveedores
- OCR de facturas
- Importación automática

#### Endpoints:
- `GET /api/v1/purchases` - Listar compras
- `POST /api/v1/purchases` - Crear compra
- `PUT /api/v1/purchases/:id` - Actualizar compra
- `POST /api/v1/purchases/ocr` - Escanear factura
- `GET /api/v1/purchase-book` - Libro de compras

### 6.4 Módulo de Facturación Electrónica

<!-- IMAGEN SUGERIDA: Ejemplo de factura electrónica generada -->

#### Funcionalidades:
- Gestión de resoluciones SAR
- Control de CAI
- Numeración correlativa automática
- Validación de rangos
- Generación de reportes SAR
- Cumplimiento legal Honduras

#### Endpoints:
- `GET /api/v1/resolutions` - Listar resoluciones
- `POST /api/v1/resolutions` - Crear resolución
- `GET /api/v1/resolutions/active` - Resolución activa
- `GET /api/v1/billing/next-number` - Siguiente número
- `POST /api/v1/billing/validate-cai` - Validar CAI

### 6.5 Módulo de Reportes

<!-- IMAGEN SUGERIDA: Ejemplo de reporte de ventas o libro de ventas -->

#### Reportes Disponibles:

**Libro de Ventas**
- Filtros por fecha, vendedor, cliente
- Totales por método de pago
- Exportación Excel/PDF
- Cumplimiento SAR

**Libro de Compras**
- Filtros por fecha, proveedor
- Totales de impuestos
- Exportación Excel/PDF

**Estado de Resultados (P&L)**
- Ingresos vs gastos
- Utilidad bruta y neta
- Comparativos por período

**Inventario Físico**
- Conteo vs sistema
- Diferencias (faltantes/sobrantes)
- Valorización

**Productos Vendidos**
- Análisis por producto
- Cantidades y totales
- Ranking de ventas

**Historial de Existencias**
- Movimientos por producto
- Entradas y salidas
- Saldos por fecha

### 6.6 Módulo de Ajustes de Inventario

#### Funcionalidades:
- Ajustes de entrada/salida
- Motivos configurables
- Aprobación de ajustes
- Trazabilidad completa
- Reportes de ajustes

#### Endpoints:
- `GET /api/v1/inventory-adjustments` - Listar ajustes
- `POST /api/v1/inventory-adjustments` - Crear ajuste
- `PUT /api/v1/inventory-adjustments/:id/approve` - Aprobar
- `DELETE /api/v1/inventory-adjustments/:id` - Cancelar

### 6.7 Módulo de Inventario Físico

#### Funcionalidades:
- Crear conteo físico
- Captura de cantidades por producto
- Comparación con sistema
- Generación de ajustes automáticos
- Reportes de diferencias

#### Endpoints:
- `GET /api/v1/physical-inventory` - Listar inventarios
- `POST /api/v1/physical-inventory` - Crear inventario
- `PUT /api/v1/physical-inventory/:id/count` - Guardar conteo
- `POST /api/v1/physical-inventory/:id/process` - Procesar
- `GET /api/v1/physical-inventory/:id/report` - Reporte

### 6.8 Módulo de Generación de Códigos de Barra

<!-- IMAGEN SUGERIDA: Captura de la interfaz de generación de códigos de barra con filtros y preview -->

#### Funcionalidades:
- Generación de códigos de barra para etiquetas de productos
- Filtros avanzados por categoría, subcategoría, producto y sucursal
- Selección múltiple de productos
- Personalización de etiquetas:
  - Tamaño de etiqueta (pequeña, mediana, grande)
  - Mostrar/ocultar nombre del producto
  - Mostrar/ocultar precio de venta
  - Mostrar/ocultar SKU/código
  - Mostrar/ocultar categoría
- Preview en tiempo real de las etiquetas
- Generación de PDF para impresión
- Soporte para diferentes formatos de código de barras (CODE128, EAN13, UPC)

#### Arquitectura:
El módulo tiene un diseño híbrido:
- **Backend:** Proporciona los datos de productos mediante API REST
- **Frontend:** Genera los códigos de barra y PDF usando bibliotecas JavaScript

**Ventajas de este enfoque:**
- Menor carga en el servidor
- Mayor flexibilidad en personalización
- Preview instantáneo sin peticiones al servidor
- Generación rápida de PDFs

#### Endpoints API:

```javascript
// Obtener productos para códigos de barra
GET /api/v1/barcodes/products
Query params: {
  category_id: number,
  subcategory_id: number,
  product_id: number,
  branch_id: number
}

Response: {
  success: true,
  data: [
    {
      id: 123,
      name: "Producto Ejemplo",
      sku: "PROD-001",
      code: "7501234567890",
      price: 150.00,
      category_name: "Electrónica",
      subcategory_name: "Smartphones",
      brand_name: "Samsung"
    }
  ]
}

// Obtener categorías
GET /api/v1/barcodes/categories

// Obtener subcategorías (opcionalmente filtradas)
GET /api/v1/barcodes/subcategories?category_id=5
```

#### Flujo de trabajo:

```
Usuario accede al módulo de códigos de barra
         ↓
Selecciona filtros (categoría, subcategoría, etc.)
         ↓
Frontend consulta API: GET /api/barcodes/products
         ↓
Backend retorna lista de productos con datos completos
         ↓
Usuario selecciona productos de la lista
         ↓
Usuario configura opciones de etiqueta
         ↓
JsBarcode genera códigos de barra en <canvas>
         ↓
Usuario ve preview en tiempo real
         ↓
Usuario hace clic en "Generar PDF"
         ↓
jsPDF crea documento con todas las etiquetas
         ↓
PDF se descarga automáticamente
         ↓
Usuario puede imprimir las etiquetas
```

#### Tecnologías frontend utilizadas:

**JsBarcode:**
```javascript
import JsBarcode from 'jsbarcode';

// Generar código de barra
JsBarcode('#barcode', productCode, {
  format: 'CODE128',
  width: 2,
  height: 50,
  displayValue: true,
  fontSize: 12,
  margin: 10
});
```

**jsPDF:**
```javascript
import jsPDF from 'jspdf';

// Crear PDF con etiquetas
const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4'
});

// Agregar etiquetas al PDF
doc.addImage(barcodeCanvas, 'PNG', x, y, width, height);
doc.save('codigos-barra.pdf');
```

#### Formatos de etiqueta soportados:

**Pequeña (40mm x 25mm):**
- Código de barra
- SKU
- Ideal para productos pequeños

**Mediana (50mm x 30mm):**
- Código de barra
- Nombre del producto (truncado)
- Precio
- Uso general

**Grande (70mm x 40mm):**
- Código de barra
- Nombre completo del producto
- Precio
- SKU
- Categoría
- Ideal para productos de alto valor

#### Casos de uso:

1. **Ingreso de nuevos productos:**
   - Generar códigos para todos los productos sin etiqueta
   - Filtrar por categoría recién creada
   - Imprimir en hojas adhesivas

2. **Reemplazo de etiquetas:**
   - Seleccionar productos específicos
   - Generar nuevas etiquetas
   - Imprimir solo las necesarias

3. **Inventario físico:**
   - Generar códigos para toda una categoría
   - Facilitar el conteo con escáner
   - Etiquetas con información completa

4. **Promociones:**
   - Etiquetas grandes con precio destacado
   - Incluir nombre y categoría
   - Cambio rápido de precios

#### Características técnicas:

✅ **Código de barra estándar:** CODE128, EAN13, UPC-A
✅ **Múltiples productos:** Hasta 1000 etiquetas por PDF
✅ **Calidad de impresión:** 300 DPI
✅ **Formatos de papel:** A4, Carta, etiquetas adhesivas
✅ **Distribución automática:** Columnas y filas optimizadas
✅ **Vista previa:** Antes de generar el PDF
✅ **Personalización:** Colores, fuentes, tamaños

---

## 7. SEGURIDAD Y AUTENTICACIÓN

<!-- IMAGEN SUGERIDA: Diagrama del flujo de autenticación JWT -->

### 7.1 Autenticación JWT

#### Flujo de Autenticación:

1. **Login:**
   ```
   POST /api/v1/auth/login
   Body: { email, password }
   Response: { user, token, refreshToken }
   ```

2. **Uso del Token:**
   ```
   Headers: { Authorization: "Bearer <token>" }
   ```

3. **Refresh Token:**
   ```
   POST /api/v1/auth/refresh
   Body: { refreshToken }
   Response: { token, refreshToken }
   ```

4. **Logout:**
   ```
   POST /api/v1/auth/logout
   Headers: { Authorization: "Bearer <token>" }
   ```

### 7.2 Sistema de Roles y Permisos (RBAC)

<!-- IMAGEN SUGERIDA: Diagrama de roles y permisos -->

#### Roles Predefinidos:

**Super Administrador**
- Acceso total al sistema
- Gestión de usuarios y roles
- Configuración del sistema

**Administrador**
- Gestión de inventario
- Configuración de precios
- Reportes completos

**Vendedor**
- Acceso al POS
- Consulta de productos
- Creación de ventas

**Almacenista**
- Gestión de inventario
- Recepción de compras
- Ajustes de stock

#### Permisos por Módulo:

**Productos:**
- `products.view` - Ver productos
- `products.create` - Crear productos
- `products.update` - Actualizar productos
- `products.delete` - Eliminar productos
- `products.import` - Importar productos
- `products.export` - Exportar productos

**Ventas:**
- `sales.view` - Ver ventas
- `sales.create` - Crear ventas
- `sales.cancel` - Cancelar ventas
- `sales.print` - Reimprimir facturas

**Reportes:**
- `reports.sales` - Reportes de ventas
- `reports.purchases` - Reportes de compras
- `reports.inventory` - Reportes de inventario
- `reports.financial` - Reportes financieros

### 7.3 Medidas de Seguridad

#### Backend:
- **Helmet.js** - Headers HTTP seguros
- **CORS** - Control de orígenes
- **Rate Limiting** - Límite de peticiones
- **SQL Injection Protection** - Queries parametrizadas
- **XSS Protection** - Sanitización de entrada
- **Password Hashing** - Bcrypt
- **Input Validation** - Express-validator, Joi

#### Frontend:
- **Vue Router Guards** - Protección de rutas
- **Token Storage** - LocalStorage con expiración
- **Auto-refresh de tokens** - Interceptores Axios
- **HTTPS Only** - En producción

### 7.4 Auditoría

Todas las tablas incluyen campos de auditoría:
- `created_by` - Usuario que creó el registro
- `updated_by` - Usuario que actualizó
- `deleted_by` - Usuario que eliminó
- `created_at` - Fecha de creación
- `updated_at` - Fecha de actualización
- `deleted_at` - Soft delete

---

## 8. INTEGRACIONES

### 8.1 Integración OCR (Tesseract.js)

<!-- IMAGEN SUGERIDA: Ejemplo de factura siendo escaneada y datos extraídos -->

#### Funcionalidad:
- Escaneo de facturas de compra
- Extracción automática de datos
- Creación de compras desde imágenes/PDFs

#### Endpoint:
```javascript
POST /api/v1/purchases/ocr-scan
Content-Type: multipart/form-data
Body: { file: <image/pdf> }

Response: {
  supplier_name: "Proveedor XYZ",
  invoice_number: "001-001-01-12345678",
  date: "2025-12-18",
  items: [
    { name: "Producto A", quantity: 10, price: 50.00 }
  ],
  total: 1006.25
}
```

### 8.2 Exportación a Excel/PDF

#### Bibliotecas:
- **ExcelJS** - Generación de archivos Excel
- **PDFKit** - Generación de PDFs
- **jsPDF** - PDFs en el frontend
- **html2pdf.js** - Conversión HTML a PDF

#### Ejemplo:
```javascript
// Backend - Exportación a Excel
const ExcelJS = require('exceljs');

async function exportProductsToExcel(products) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Productos');

  worksheet.columns = [
    { header: 'Código', key: 'code', width: 15 },
    { header: 'Nombre', key: 'name', width: 30 },
    { header: 'Precio', key: 'price', width: 12 }
  ];

  worksheet.addRows(products);

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
```

### 8.3 Integración con Google Cloud Storage

<!-- IMAGEN SUGERIDA: Diagrama de flujo de subida de imágenes a Google Cloud Storage -->

#### Descripción:
ProsperPOS utiliza Google Cloud Storage como sistema de almacenamiento en la nube para imágenes de productos, categorías y otros archivos multimedia. Esto permite:
- Escalabilidad ilimitada
- URLs públicas accesibles desde cualquier lugar
- Reducción de carga en el servidor principal
- Backup automático en la nube
- CDN integrado para mejor rendimiento global

#### Configuración:

**Variables de entorno requeridas:**
```env
# Google Cloud Project
GCP_PROJECT_ID=prosperpos-prod
GCP_PROJECT_NUMBER=246931242894
GCP_LOCATION=northamerica-south1

# Google Cloud Storage
GCS_BUCKET_NAME=prosperpos-images
GCS_KEYFILE_PATH=./prosperpos-credentials.json
IMAGE_BASE_URL=https://storage.googleapis.com/prosperpos-images
```

**Región:** São Paulo, Brasil (`northamerica-south1`)
- Excelente latencia para América Latina
- Precios competitivos
- Ideal para México, Centroamérica y Sudamérica

#### Estructura de carpetas en el bucket:

```
prosperpos-images/
├── products/
│   ├── product_1_main.jpg
│   ├── product_1_thumb.jpg
│   ├── product_2_main.jpg
│   └── ...
├── categories/
│   ├── category_1.jpg
│   └── ...
└── invoices/
    └── ...
```

#### Flujo de subida de archivos:

```
Usuario sube imagen en Frontend
         ↓
FormData enviado a /api/v1/upload/product
         ↓
Multer procesa archivo en memoria
         ↓
Sharp optimiza la imagen (resize, compress)
         ↓
GoogleCloudStorageService.uploadProductImage()
         ↓
Imagen subida a gs://prosperpos-images/products/
         ↓
URL pública generada
         ↓
URL guardada en BD (tabla products, campo image)
         ↓
Respuesta al frontend con URL
```

#### Endpoints disponibles:

```javascript
// Subir imagen de producto
POST /api/v1/upload/product
Content-Type: multipart/form-data
Body: { file, productId, imageType: 'main'|'thumb'|'gallery' }

Response: {
  success: true,
  data: {
    url: "https://storage.googleapis.com/prosperpos-images/products/product_123_main.jpg",
    destination: "products/product_123_main.jpg",
    bucket: "prosperpos-images"
  }
}

// Eliminar imagen de producto
DELETE /api/v1/upload/product/:productId/:imageType

// Listar todas las imágenes de un producto
GET /api/v1/upload/product/:productId/images

// Generar URL firmada temporal (acceso privado)
POST /api/v1/upload/signed-url
Body: { filePath, expiresIn: 60 }
```

#### Optimización de imágenes:

Todas las imágenes son procesadas con **Sharp** antes de subirlas:
```javascript
const sharp = require('sharp');

// Redimensionar y optimizar
const optimizedBuffer = await sharp(fileBuffer)
  .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
  .jpeg({ quality: 85 })
  .toBuffer();
```

#### Costos estimados:

**Primeros 3 meses:** GRATIS con $300 USD de crédito

**Después del período gratuito:**
| Concepto | Uso mensual | Costo |
|----------|-------------|-------|
| Almacenamiento | 100 GB | $2.00 |
| Transferencia | 500 GB | $40.00 |
| Operaciones | 100,000 | $0.50 |
| **TOTAL** | | **~$42/mes** |

Con Cloud CDN: **~$35/mes**

#### Seguridad:

- **Credenciales:** Archivo JSON protegido en `.gitignore`
- **Bucket público:** Configurado con Uniform Access Control
- **URLs públicas:** Sin autenticación para imágenes de productos
- **URLs firmadas:** Disponibles para archivos privados (expiración configurable)

#### Scripts de utilidad:

```bash
# Probar conexión a GCS
npm run gcs:test

# Migrar imágenes locales existentes a GCS
npm run gcs:migrate

# Probar subida de imagen
node backend/scripts/test-gcs-upload.js
```

#### Ventajas sobre almacenamiento local:

✅ **Escalabilidad:** Sin límites de almacenamiento
✅ **Disponibilidad:** 99.95% SLA garantizado
✅ **Rendimiento:** CDN global integrado
✅ **Backup:** Redundancia automática
✅ **Costos:** Pago por uso, sin infraestructura
✅ **Seguridad:** Encriptación en reposo y tránsito

### 8.4 Sistema de Logging (Winston)

#### Configuración:
```javascript
const winston = require('winston');
require('winston-daily-rotate-file');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d'
    })
  ]
});
```

---

## 9. CONFIGURACIÓN Y DESPLIEGUE

### 9.1 Requisitos del Sistema

#### Hardware Mínimo:
- **CPU:** 2 cores
- **RAM:** 4GB
- **Disco:** 20GB SSD
- **Red:** 10 Mbps

#### Hardware Recomendado (Producción):
- **CPU:** 4+ cores
- **RAM:** 8GB+
- **Disco:** 50GB+ SSD
- **Red:** 100 Mbps

#### Software:
- **OS:** Windows 10+, Linux (Ubuntu 20.04+), macOS 11+
- **Node.js:** v16.x o superior
- **MySQL:** 8.0 o superior
- **Redis:** 6.0+ (opcional)
- **Nginx:** 1.20+ (producción)

### 9.2 Instalación Paso a Paso

#### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/prosperpos.git
cd prosperpos
```

#### 2. Configurar Backend

```bash
cd backend
npm install
```

Crear archivo `.env`:
```env
NODE_ENV=production
PORT=3000

# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=prosperpos

# JWT
JWT_SECRET=tu_clave_secreta_segura
JWT_EXPIRE=24h

# URLs
FRONTEND_URL=http://localhost:3001
```

#### 3. Configurar Template

```bash
cd template
npm install
```

Crear archivo `.env`:
```env
VITE_API_URL=http://localhost:3000/api/v1
```

### 9.3 Ejecución en Desarrollo

#### Backend:
```bash
cd backend
npm run dev
# Servidor en http://localhost:3000
```

#### Frontend:
```bash
cd template
npm run dev
# Aplicación en http://localhost:3001
```

### 9.4 Despliegue en Producción

<!-- IMAGEN SUGERIDA: Diagrama de arquitectura de producción con Nginx, PM2, MySQL -->

#### 1. Build del Frontend

```bash
cd template
npm run build
# Genera carpeta dist/
```

#### 2. PM2 para Node.js

```bash
npm install -g pm2

cd backend
pm2 start server.js --name prosperpos-api

pm2 save
pm2 startup
```

#### 3. Configuración Nginx

```nginx
server {
    listen 80;
    server_name api.tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

### 9.5 Backup y Restauración

#### Script de Backup

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p prosperpos | gzip > backup_$DATE.sql.gz
```

#### Restauración

```bash
gunzip < backup.sql.gz | mysql -u root -p prosperpos
```

---

## 10. API REFERENCE

### 10.1 Autenticación

#### POST /api/v1/auth/login
**Descripción:** Iniciar sesión

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "permissions": ["products.view", "sales.create"]
  }
}
```

### 10.2 Productos

#### GET /api/v1/products
**Descripción:** Listar productos
**Permiso:** `products.view`

**Query Parameters:**
- `page` (int): Número de página
- `limit` (int): Registros por página
- `search` (string): Búsqueda
- `category_id` (int): Filtrar por categoría

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "code": "PROD-001",
        "name": "Producto Ejemplo",
        "sale_price": 75.00,
        "stock": 100
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "pages": 8
    }
  }
}
```

#### POST /api/v1/products
**Descripción:** Crear producto
**Permiso:** `products.create`

**Request Body:**
```json
{
  "code": "PROD-002",
  "name": "Nuevo Producto",
  "category_id": 5,
  "cost_price": 45.00,
  "sale_price": 70.00
}
```

### 10.3 Ventas (POS)

#### POST /api/v1/pos/sale
**Descripción:** Crear venta
**Permiso:** `sales.create`

**Request Body:**
```json
{
  "customer_id": 5,
  "warehouse_id": 1,
  "payment_method": "cash",
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": 75.00
    }
  ],
  "total": 284.70
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "sale_id": 123,
    "invoice_number": "001-001-01-00000123",
    "total": 284.70
  }
}
```

### 10.4 Códigos de Error

| Código | Significado |
|--------|-------------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 11. MANTENIMIENTO Y SOPORTE

### 11.1 Tareas de Mantenimiento

#### Diarias:
- ✅ Verificar logs de errores
- ✅ Monitorear recursos (CPU, RAM)
- ✅ Revisar backup automático

#### Semanales:
- ✅ Revisar rendimiento de BD
- ✅ Analizar logs
- ✅ Verificar espacio en disco

#### Mensuales:
- ✅ Optimizar tablas
- ✅ Limpiar logs antiguos
- ✅ Actualizar dependencias
- ✅ Prueba de backups

### 11.2 Optimización de Base de Datos

```sql
-- Optimizar tablas
OPTIMIZE TABLE products;
OPTIMIZE TABLE sales;
OPTIMIZE TABLE stock;

-- Analizar tablas
ANALYZE TABLE products;
ANALYZE TABLE sales;
```

### 11.3 Troubleshooting

#### Error de Conexión a BD

**Soluciones:**
1. Verificar MySQL: `sudo service mysql status`
2. Verificar credenciales en `.env`
3. Revisar permisos de usuario

#### Token JWT Expirado

**Soluciones:**
1. Frontend debe usar refresh token
2. Implementar interceptor Axios
3. Verificar configuración JWT

### 11.4 Seguridad

#### Checklist:

- [ ] Cambiar contraseñas por defecto
- [ ] Usar HTTPS en producción
- [ ] Actualizar dependencias
- [ ] Configurar firewall
- [ ] Implementar rate limiting
- [ ] Validar entradas de usuario
- [ ] Auditar logs regularmente

---

## APÉNDICES

### A. Comandos Útiles

```bash
# Backend
npm run dev          # Desarrollo
npm start            # Producción

# Frontend
npm run dev          # Desarrollo
npm run build        # Build

# PM2
pm2 start server.js
pm2 logs
pm2 restart all

# MySQL
mysqldump -u root -p prosperpos > backup.sql
mysql -u root -p prosperpos < backup.sql
```

### B. Glosario

- **CAI:** Código de Autorización de Impresión (SAR Honduras)
- **SAR:** Servicio de Administración de Rentas
- **POS:** Point of Sale
- **JWT:** JSON Web Token
- **RBAC:** Role-Based Access Control
- **OCR:** Optical Character Recognition

---

## LUGARES PARA AGREGAR IMÁGENES

### Sección 1 - Introducción
- **Página 1:** Logo de ProsperPOS (encabezado)
- **Página 2:** Captura del dashboard principal

### Sección 2 - Arquitectura
- **Página 3:** Diagrama completo de arquitectura del sistema
- **Página 4:** Diagrama de flujo de datos

### Sección 4 - Frontend
- **Página 5:** Captura del layout principal (header y sidebar)
- **Página 6:** Captura completa del dashboard con gráficos
- **Página 7:** Interfaz del POS con productos y carrito
- **Página 8:** Tabla de productos con filtros
- **Página 9:** Reporte de libro de ventas

### Sección 5 - Base de Datos
- **Página 10:** Diagrama ER de las tablas principales

### Sección 6 - Módulos
- **Página 11:** Captura del módulo de inventario
- **Página 12:** Interfaz del POS en acción
- **Página 13:** Ejemplo de factura electrónica
- **Página 14:** Ejemplo de reporte de ventas

### Sección 7 - Seguridad
- **Página 15:** Diagrama del flujo de autenticación JWT
- **Página 16:** Diagrama de roles y permisos

### Sección 8 - Integraciones
- **Página 17:** Ejemplo de factura escaneada con OCR

### Sección 9 - Despliegue
- **Página 18:** Diagrama de arquitectura de producción (Nginx, PM2, MySQL)

---

**Versión:** 1.0
**Fecha:** Diciembre 2025

*Fin del Manual Técnico*
