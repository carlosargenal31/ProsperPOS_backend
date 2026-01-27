# MANUAL TÉCNICO COMPLETO - ProsperPOS

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
5. [Frontend - Cliente E-Commerce](#5-frontend---cliente-e-commerce)
6. [Base de Datos](#6-base-de-datos)
7. [Módulos Funcionales](#7-módulos-funcionales)
8. [Seguridad y Autenticación](#8-seguridad-y-autenticación)
9. [Integraciones](#9-integraciones)
10. [Configuración y Despliegue](#10-configuración-y-despliegue)
11. [API Reference](#11-api-reference)
12. [Mantenimiento y Soporte](#12-mantenimiento-y-soporte)

---

## 1. INTRODUCCIÓN

### 1.1 Descripción General

ProsperPOS es un sistema integral de punto de venta (POS) diseñado específicamente para el mercado hondureño, con cumplimiento total de las regulaciones del Servicio de Administración de Rentas (SAR). El sistema incluye:

- **Sistema POS completo** con interfaz rápida y eficiente
- **Gestión de inventario multi-almacén** con trazabilidad completa
- **Facturación electrónica** conforme a normativas SAR Honduras
- **E-commerce integrado** con carrito de compras y gestión de pedidos
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
7. **E-commerce:** Tienda en línea, carrito, pedidos
8. **RRHH:** Empleados, departamentos, posiciones
9. **Logística:** Envíos, vehículos, sucursales

### 1.3 Stack Tecnológico

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

#### Frontend (Admin)
- **Framework:** Vue 3.5+ (Composition API)
- **Build:** Vite 6.3+
- **Router:** Vue Router 4.5+
- **Estado:** Pinia/Vuex
- **UI:** Bootstrap 5.3+, Ant Design Vue 4.2+
- **Validación:** VeeValidate + Yup
- **Gráficos:** ApexCharts, Chart.js
- **Iconos:** Bootstrap Icons, FontAwesome, Material Icons

#### Frontend (E-commerce)
- **Framework:** Nuxt 3.8+
- **Estilos:** Tailwind CSS 3.3+
- **Estado:** Pinia
- **i18n:** Soporte multi-idioma
- **Modo:** SSR (Server-Side Rendering)

---

## 2. ARQUITECTURA DEL SISTEMA

### 2.1 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTACIÓN                            │
├──────────────────────┬──────────────────────────────────────┤
│  Admin Template      │  E-commerce Client                   │
│  (Vue 3 + Vite)      │  (Nuxt 3)                            │
│  Port: 3001          │  Port: 3001                          │
└──────────────────────┴──────────────────────────────────────┘
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
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
         ┌──────────┐ ┌─────────┐ ┌─────────┐
         │  MySQL   │ │  Redis  │ │  Files  │
         │ Database │ │  Cache  │ │ Storage │
         └──────────┘ └─────────┘ └─────────┘
```

### 2.2 Flujo de Datos

1. **Cliente → Servidor:**
   - El usuario interactúa con la interfaz (Vue/Nuxt)
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
├── client/                     # E-commerce Nuxt 3
│   ├── assets/                # Recursos CSS
│   ├── components/            # Componentes Nuxt
│   ├── layouts/               # Layouts de Nuxt
│   ├── pages/                 # Páginas (file-based routing)
│   ├── middleware/            # Middlewares de ruta
│   ├── plugins/               # Plugins de Nuxt
│   ├── services/              # Servicios API
│   ├── store/                 # Stores de Pinia
│   ├── public/                # Archivos estáticos
│   ├── nuxt.config.js         # Configuración Nuxt
│   └── tailwind.config.js     # Configuración Tailwind
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

```javascript
// Funciones principales:
// 1. Inicialización de la base de datos
// 2. Ejecución automática de migraciones
// 3. Inicio del servidor Express
// 4. Manejo de errores no capturados
// 5. Gestión de señales de apagado
```

#### 3.1.2 Configuración de Express (app.js)

**Ubicación:** `backend/app.js`

Configuración de middlewares:
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

Variables de configuración:
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

Total de controladores: **50+**

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

### 3.3 Capa de Servicios

**Ubicación:** `backend/src/services/`

Total de servicios: **38+**

Los servicios contienen la lógica de negocio y las operaciones de base de datos:

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

### 3.4 Capa de Modelos

**Ubicación:** `backend/src/models/`

Total de modelos: **32+**

Los modelos definen la estructura y operaciones CRUD básicas:

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

Total de archivos de rutas: **54+**

#### Estructura de Rutas (routes/index.js)

```javascript
const express = require('express');
const router = express.Router();

// Rutas públicas
router.use('/auth', require('./auth.routes'));
router.use('/ecommerce', require('./ecommerce.routes'));

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

---

## 4. FRONTEND - TEMPLATE ADMINISTRATIVO

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

#### 4.2.2 Componentes Globales

**Ubicación:** `template/src/components/`

**Total de modales:** 73+

Categorías de componentes:
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
      {
        path: '/inventory/products/create',
        name: 'ProductCreate',
        component: () => import('@/views/pages/inventory/products/create.vue'),
        meta: { permission: 'products.create' }
      },
      {
        path: '/inventory/categories',
        name: 'Categories',
        component: () => import('@/views/pages/inventory/categories.vue')
      },

      // Ventas
      {
        path: '/pos',
        name: 'POS',
        component: () => import('@/views/pages/sales/pos.vue'),
        meta: { permission: 'sales.create' }
      },
      {
        path: '/sales/list',
        name: 'SalesList',
        component: () => import('@/views/pages/sales/list.vue')
      },
      {
        path: '/sales/invoices',
        name: 'Invoices',
        component: () => import('@/views/pages/sales/invoices.vue')
      },

      // Compras
      {
        path: '/purchases/list',
        name: 'PurchasesList',
        component: () => import('@/views/pages/purchases/list.vue')
      },
      {
        path: '/purchases/create',
        name: 'PurchaseCreate',
        component: () => import('@/views/pages/purchases/create.vue')
      },

      // Personas
      {
        path: '/people/customers',
        name: 'Customers',
        component: () => import('@/views/pages/people/customers.vue')
      },
      {
        path: '/people/suppliers',
        name: 'Suppliers',
        component: () => import('@/views/pages/people/suppliers.vue')
      },

      // Reportes
      {
        path: '/reports/sales-book',
        name: 'SalesBook',
        component: () => import('@/views/pages/reports/sales-book.vue')
      },
      {
        path: '/reports/purchase-book',
        name: 'PurchaseBook',
        component: () => import('@/views/pages/reports/purchase-book.vue')
      },
      {
        path: '/reports/profit-loss',
        name: 'ProfitLoss',
        component: () => import('@/views/pages/reports/profit-loss.vue')
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
    },

    async refreshAccessToken() {
      const response = await api.post('/auth/refresh', {
        refreshToken: this.refreshToken
      });
      this.token = response.data.token;
      localStorage.setItem('token', this.token);
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

#### 4.5.2 Servicios por Módulo

**product.service.js**
```javascript
import api from '@/api/config';

export default {
  getAll(params) {
    return api.get('/products', { params });
  },

  getById(id) {
    return api.get(`/products/${id}`);
  },

  create(data) {
    return api.post('/products', data);
  },

  update(id, data) {
    return api.put(`/products/${id}`, data);
  },

  delete(id) {
    return api.delete(`/products/${id}`);
  },

  bulkImport(file) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/products/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  exportToExcel(params) {
    return api.get('/products/export/excel', {
      params,
      responseType: 'blob'
    });
  }
};
```

### 4.6 Páginas Principales

#### 4.6.1 Dashboard

**Ubicación:** `template/src/views/pages/dashboard/index.vue`

**Características:**
- Resumen de ventas del día/mes/año
- Gráficos de tendencias
- Productos más vendidos
- Alertas de stock bajo
- Ventas por vendedor
- Estado de facturación

**Componentes:**
```vue
<template>
  <div class="dashboard">
    <!-- Estadísticas principales -->
    <div class="stats-row">
      <StatCard
        title="Ventas Hoy"
        :value="todaySales"
        icon="currency-dollar"
        color="primary"
      />
      <StatCard
        title="Ventas Mes"
        :value="monthSales"
        icon="chart-bar"
        color="success"
      />
      <StatCard
        title="Clientes"
        :value="customerCount"
        icon="users"
        color="info"
      />
      <StatCard
        title="Productos"
        :value="productCount"
        icon="box"
        color="warning"
      />
    </div>

    <!-- Gráficos -->
    <div class="charts-row">
      <SalesChart :data="salesChartData" />
      <TopProductsChart :data="topProducts" />
    </div>

    <!-- Tablas de datos -->
    <div class="tables-row">
      <RecentTransactions :transactions="recentTransactions" />
      <LowStockAlert :products="lowStockProducts" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import dashboardService from '@/services/dashboard.service';

const todaySales = ref(0);
const monthSales = ref(0);
const salesChartData = ref([]);
const topProducts = ref([]);

onMounted(async () => {
  await loadDashboardData();
});

async function loadDashboardData() {
  const response = await dashboardService.getStats();
  todaySales.value = response.data.todaySales;
  monthSales.value = response.data.monthSales;
  salesChartData.value = response.data.salesChart;
  topProducts.value = response.data.topProducts;
}
</script>
```

#### 4.6.2 POS (Punto de Venta)

**Ubicación:** `template/src/views/pages/sales/pos.vue`

**Características:**
- Búsqueda rápida de productos (por nombre, código, barras)
- Carrito de compra en tiempo real
- Cálculo automático de impuestos
- Múltiples métodos de pago
- Descuentos por producto o total
- Selección de cliente
- Impresión de factura
- Guardado de borradores

**Interfaz:**
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
          @apply-discount="applyDiscount"
        />
      </div>

      <div class="cart-totals">
        <div class="subtotal">
          <span>Subtotal:</span>
          <span>{{ formatCurrency(subtotal) }}</span>
        </div>
        <div class="tax">
          <span>Impuesto (15%):</span>
          <span>{{ formatCurrency(tax) }}</span>
        </div>
        <div class="discount" v-if="totalDiscount > 0">
          <span>Descuento:</span>
          <span>-{{ formatCurrency(totalDiscount) }}</span>
        </div>
        <div class="total">
          <span>Total:</span>
          <span>{{ formatCurrency(total) }}</span>
        </div>
      </div>

      <div class="payment-section">
        <a-radio-group v-model="paymentMethod">
          <a-radio value="cash">Efectivo</a-radio>
          <a-radio value="card">Tarjeta</a-radio>
          <a-radio value="transfer">Transferencia</a-radio>
        </a-radio-group>

        <div class="cash-input" v-if="paymentMethod === 'cash'">
          <input
            v-model.number="cashReceived"
            type="number"
            placeholder="Efectivo recibido"
          />
          <div class="change">
            Cambio: {{ formatCurrency(change) }}
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <a-button @click="saveDraft" size="large">
          Guardar Borrador
        </a-button>
        <a-button
          type="primary"
          @click="processSale"
          :disabled="!canProcessSale"
          size="large"
        >
          Procesar Venta (F9)
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import posService from '@/services/pos.service';

const cartItems = ref([]);
const selectedCustomer = ref(null);
const paymentMethod = ref('cash');
const cashReceived = ref(0);

const subtotal = computed(() => {
  return cartItems.value.reduce((sum, item) =>
    sum + (item.price * item.quantity), 0
  );
});

const tax = computed(() => subtotal.value * 0.15);
const total = computed(() => subtotal.value + tax.value - totalDiscount.value);
const change = computed(() => Math.max(0, cashReceived.value - total.value));

async function processSale() {
  const saleData = {
    customer_id: selectedCustomer.value,
    items: cartItems.value,
    payment_method: paymentMethod.value,
    subtotal: subtotal.value,
    tax: tax.value,
    total: total.value,
    cash_received: cashReceived.value,
    change: change.value
  };

  const response = await posService.createSale(saleData);

  // Imprimir factura
  await printInvoice(response.data.invoice_id);

  // Limpiar carrito
  resetCart();
}

// Atajos de teclado
onMounted(() => {
  window.addEventListener('keydown', handleKeyPress);
});

function handleKeyPress(e) {
  if (e.key === 'F9') {
    e.preventDefault();
    processSale();
  }
}
</script>
```

#### 4.6.3 Lista de Productos

**Ubicación:** `template/src/views/pages/inventory/products/list.vue`

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

- Filtros por fecha, vendedor, cliente
- Totales por método de pago
- Exportación a Excel/PDF
- Vista previa de impresión
- Cumplimiento SAR Honduras

---

## 5. FRONTEND - CLIENTE E-COMMERCE

### 5.1 Estructura del Cliente Nuxt

**Framework:** Nuxt 3.8+
**Estilos:** Tailwind CSS 3.3+
**Puerto:** 3001

### 5.2 Páginas Principales

#### 5.2.1 Home (index.vue)
- Banner principal
- Productos destacados
- Categorías populares
- Ofertas especiales

#### 5.2.2 Catálogo de Productos
- Grid de productos
- Filtros por categoría, precio, marca
- Ordenamiento
- Paginación

#### 5.2.3 Detalle de Producto
- Galería de imágenes
- Descripción completa
- Precio y disponibilidad
- Botón añadir al carrito
- Productos relacionados

#### 5.2.4 Carrito de Compras
- Lista de productos
- Actualización de cantidades
- Cálculo de totales
- Botón finalizar compra

#### 5.2.5 Checkout
- Formulario de envío
- Selección de método de pago
- Resumen de pedido
- Confirmación

### 5.3 Autenticación de Clientes

**Ubicación:** `client/pages/auth/`

- **login.vue** - Inicio de sesión
- **register.vue** - Registro de clientes
- **forgot-password.vue** - Recuperación de contraseña

### 5.4 API Integration

**Ubicación:** `client/services/ecommerce.service.js`

```javascript
export default {
  async getProducts(params) {
    return await $fetch('/api/v1/ecommerce/products', { params });
  },

  async getProductById(id) {
    return await $fetch(`/api/v1/ecommerce/products/${id}`);
  },

  async addToCart(productId, quantity) {
    return await $fetch('/api/v1/ecommerce/cart', {
      method: 'POST',
      body: { product_id: productId, quantity }
    });
  },

  async checkout(orderData) {
    return await $fetch('/api/v1/ecommerce/orders', {
      method: 'POST',
      body: orderData
    });
  }
};
```

---

## 6. BASE DE DATOS

### 6.1 Información General

- **DBMS:** MySQL 8.0+
- **Nombre:** prosperpos
- **Charset:** utf8mb4
- **Collation:** utf8mb4_unicode_ci
- **Total de Tablas:** 60+
- **Total de Vistas:** 5

### 6.2 Migraciones Automáticas

**Ubicación:** `backend/database/migrations/`

El sistema ejecuta migraciones automáticamente al iniciar:

1. Verifica la existencia de la base de datos
2. Crea tablas si no existen
3. Aplica migraciones pendientes
4. Crea índices y claves foráneas
5. Ejecuta triggers y procedimientos almacenados

### 6.3 Esquema de Tablas

#### 6.3.1 Seguridad y Autenticación

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

**role_permissions**
```sql
CREATE TABLE role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);
```

**users_roles**
```sql
CREATE TABLE users_roles (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
```

**refresh_tokens**
```sql
CREATE TABLE refresh_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user (user_id)
);
```

#### 6.3.2 Productos e Inventario

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
  FOREIGN KEY (subcategory_id) REFERENCES subcategories(id),
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (unit_id) REFERENCES units(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id),
  FOREIGN KEY (deleted_by) REFERENCES users(id),
  INDEX idx_code (code),
  INDEX idx_barcode (barcode),
  INDEX idx_name (name),
  INDEX idx_category (category_id)
);
```

**categories**
```sql
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  description VARCHAR(255),
  image VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
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
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  INDEX idx_product (product_id),
  INDEX idx_warehouse (warehouse_id)
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
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_product (product_id),
  INDEX idx_warehouse (warehouse_id),
  INDEX idx_reference (reference_type, reference_id),
  INDEX idx_created_at (created_at)
);
```

**physical_inventory**
```sql
CREATE TABLE physical_inventory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  warehouse_id INT NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  status ENUM('borrador', 'procesado', 'cancelado') DEFAULT 'borrador',
  count_date DATE NOT NULL,
  notes TEXT,
  created_by INT,
  processed_by INT,
  processed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (processed_by) REFERENCES users(id),
  INDEX idx_warehouse (warehouse_id),
  INDEX idx_status (status),
  INDEX idx_code (code)
);
```

**inventory_adjustments**
```sql
CREATE TABLE inventory_adjustments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  warehouse_id INT NOT NULL,
  adjustment_type ENUM('entrada', 'salida') NOT NULL,
  reason VARCHAR(255) NOT NULL,
  status ENUM('borrador', 'aprobado', 'cancelado') DEFAULT 'borrador',
  total_value DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_by INT,
  approved_by INT,
  approved_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  INDEX idx_warehouse (warehouse_id),
  INDEX idx_status (status),
  INDEX idx_type (adjustment_type)
);
```

#### 6.3.3 Ventas

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
  cancelled_by INT,
  cancelled_at DATETIME,
  cancellation_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (cancelled_by) REFERENCES users(id),
  INDEX idx_invoice (invoice_number),
  INDEX idx_customer (customer_id),
  INDEX idx_date (sale_date),
  INDEX idx_status (status)
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
  discount_amount DECIMAL(15,2) DEFAULT 0,
  subtotal DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) NOT NULL,
  total DECIMAL(15,2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_sale (sale_id),
  INDEX idx_product (product_id)
);
```

**invoices**
```sql
CREATE TABLE invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sale_id INT NOT NULL,
  resolution_id INT,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  cai VARCHAR(100),
  issue_date DATE NOT NULL,
  due_date DATE,
  subtotal DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) NOT NULL,
  total DECIMAL(15,2) NOT NULL,
  status ENUM('valid', 'cancelled', 'annulled') DEFAULT 'valid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales(id),
  FOREIGN KEY (resolution_id) REFERENCES resolutions(id),
  INDEX idx_invoice_number (invoice_number),
  INDEX idx_cai (cai),
  INDEX idx_issue_date (issue_date)
);
```

#### 6.3.4 Compras

**purchases**
```sql
CREATE TABLE purchases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  purchase_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  purchase_date DATE NOT NULL,
  payment_method ENUM('cash', 'card', 'transfer', 'credit') NOT NULL,
  payment_status ENUM('paid', 'pending', 'partial') DEFAULT 'pending',
  subtotal DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  notes TEXT,
  status ENUM('completed', 'cancelled', 'draft') DEFAULT 'draft',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_purchase_number (purchase_number),
  INDEX idx_supplier (supplier_id),
  INDEX idx_date (purchase_date)
);
```

**purchase_items**
```sql
CREATE TABLE purchase_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  purchase_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity DECIMAL(15,3) NOT NULL,
  unit_cost DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 15.00,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  subtotal DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) NOT NULL,
  total DECIMAL(15,2) NOT NULL,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_purchase (purchase_id),
  INDEX idx_product (product_id)
);
```

#### 6.3.5 Facturación Electrónica (SAR Honduras)

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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cai (cai),
  INDEX idx_active (is_active)
);
```

**consecutives**
```sql
CREATE TABLE consecutives (
  id INT PRIMARY KEY AUTO_INCREMENT,
  document_type ENUM('sale', 'purchase', 'quote', 'adjustment') NOT NULL,
  prefix VARCHAR(10),
  current_number INT NOT NULL DEFAULT 1,
  padding_length INT DEFAULT 6,
  UNIQUE KEY uk_document_type (document_type)
);
```

#### 6.3.6 E-Commerce

**web_customers**
```sql
CREATE TABLE web_customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires DATETIME,
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);
```

**web_orders**
```sql
CREATE TABLE web_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT NOT NULL,
  address_id INT,
  status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  subtotal DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) NOT NULL,
  shipping_cost DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  payment_method VARCHAR(50),
  payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES web_customers(id),
  FOREIGN KEY (address_id) REFERENCES customer_addresses(id),
  INDEX idx_order_number (order_number),
  INDEX idx_customer (customer_id),
  INDEX idx_status (status)
);
```

**shopping_cart**
```sql
CREATE TABLE shopping_cart (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_customer_product (customer_id, product_id),
  FOREIGN KEY (customer_id) REFERENCES web_customers(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### 6.4 Vistas de Base de Datos

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
  COALESCE(s.reserved_quantity, 0) AS reserved_quantity,
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

**v_sales_summary**
```sql
CREATE VIEW v_sales_summary AS
SELECT
  s.id,
  s.invoice_number,
  s.sale_date,
  c.name AS customer_name,
  u.username AS seller,
  w.name AS warehouse,
  s.payment_method,
  s.subtotal,
  s.tax_amount,
  s.discount_amount,
  s.total,
  s.status
FROM sales s
LEFT JOIN customers c ON s.customer_id = c.id
LEFT JOIN users u ON s.created_by = u.id
LEFT JOIN warehouses w ON s.warehouse_id = w.id
WHERE s.deleted_at IS NULL;
```

### 6.5 Triggers

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
    product_id, warehouse_id, reference_type, reference_id,
    quantity, unit_cost, total_cost
  )
  SELECT
    NEW.product_id,
    s.warehouse_id,
    'sale',
    NEW.sale_id,
    -NEW.quantity,
    p.cost_price,
    p.cost_price * NEW.quantity
  FROM sales s
  JOIN products p ON p.id = NEW.product_id
  WHERE s.id = NEW.sale_id;
END$$
DELIMITER ;
```

**trg_update_stock_after_purchase**
```sql
DELIMITER $$
CREATE TRIGGER trg_update_stock_after_purchase
AFTER INSERT ON purchase_items
FOR EACH ROW
BEGIN
  -- Actualizar stock
  INSERT INTO stock (product_id, warehouse_id, quantity, last_movement_date)
  SELECT NEW.product_id, p.warehouse_id, NEW.quantity, NOW()
  FROM purchases p
  WHERE p.id = NEW.purchase_id
  ON DUPLICATE KEY UPDATE
    quantity = quantity + NEW.quantity,
    last_movement_date = NOW();

  -- Registrar cargo/descargo
  INSERT INTO stock_cargo_descargo (
    product_id, warehouse_id, reference_type, reference_id,
    quantity, unit_cost, total_cost
  )
  SELECT
    NEW.product_id,
    p.warehouse_id,
    'purchase',
    NEW.purchase_id,
    NEW.quantity,
    NEW.unit_cost,
    NEW.total
  FROM purchases p
  WHERE p.id = NEW.purchase_id;
END$$
DELIMITER ;
```

### 6.6 Índices Importantes

Para optimización de rendimiento, se recomiendan los siguientes índices:

```sql
-- Productos
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_name ON products(name);

-- Ventas
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_status ON sales(status);

-- Stock
CREATE INDEX idx_stock_product_warehouse ON stock(product_id, warehouse_id);
CREATE INDEX idx_stock_quantity ON stock(quantity);

-- Cargo/Descargo
CREATE INDEX idx_cargo_descargo_product ON stock_cargo_descargo(product_id);
CREATE INDEX idx_cargo_descargo_date ON stock_cargo_descargo(created_at);
```

---

## 7. MÓDULOS FUNCIONALES

### 7.1 Módulo de Inventario

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
- `GET /api/v1/products/export` - Exportación

### 7.2 Módulo de Ventas (POS)

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
- `GET /api/v1/pos/products` - Buscar productos para POS
- `POST /api/v1/pos/draft` - Guardar borrador
- `GET /api/v1/pos/drafts` - Obtener borradores
- `DELETE /api/v1/pos/draft/:id` - Eliminar borrador

### 7.3 Módulo de Compras

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

### 7.4 Módulo de Facturación Electrónica

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
- `GET /api/v1/billing/next-number` - Siguiente número disponible
- `POST /api/v1/billing/validate-cai` - Validar CAI

### 7.5 Módulo de Reportes

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

#### Endpoints:
- `GET /api/v1/reports/sales-book` - Libro de ventas
- `GET /api/v1/reports/purchase-book` - Libro de compras
- `GET /api/v1/reports/profit-loss` - Estado de resultados
- `GET /api/v1/reports/stock-history` - Historial de stock
- `GET /api/v1/reports/sold-items` - Productos vendidos

### 7.6 Módulo de Ajustes de Inventario

#### Funcionalidades:
- Ajustes de entrada/salida
- Motivos configurables
- Aprobación de ajustes
- Trazabilidad completa
- Reportes de ajustes

#### Endpoints:
- `GET /api/v1/inventory-adjustments` - Listar ajustes
- `POST /api/v1/inventory-adjustments` - Crear ajuste
- `PUT /api/v1/inventory-adjustments/:id/approve` - Aprobar ajuste
- `DELETE /api/v1/inventory-adjustments/:id` - Cancelar ajuste

### 7.7 Módulo de Inventario Físico

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
- `POST /api/v1/physical-inventory/:id/process` - Procesar inventario
- `GET /api/v1/physical-inventory/:id/report` - Reporte de diferencias

### 7.8 Módulo de E-Commerce

#### Funcionalidades:
- Catálogo de productos público
- Carrito de compras persistente
- Checkout
- Gestión de pedidos
- Integración con WhatsApp
- Favoritos/Wishlist

#### Endpoints:
- `GET /api/v1/ecommerce/products` - Catálogo público
- `POST /api/v1/ecommerce/cart` - Añadir al carrito
- `GET /api/v1/ecommerce/cart` - Ver carrito
- `POST /api/v1/ecommerce/orders` - Crear pedido
- `GET /api/v1/ecommerce/orders/:id` - Consultar pedido

---

## 8. SEGURIDAD Y AUTENTICACIÓN

### 8.1 Autenticación JWT

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

### 8.2 Sistema de Roles y Permisos (RBAC)

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

**Compras:**
- `purchases.view` - Ver compras
- `purchases.create` - Crear compras
- `purchases.cancel` - Cancelar compras

**Reportes:**
- `reports.sales` - Reportes de ventas
- `reports.purchases` - Reportes de compras
- `reports.inventory` - Reportes de inventario
- `reports.financial` - Reportes financieros

### 8.3 Medidas de Seguridad

#### Backend:
- **Helmet.js** - Headers HTTP seguros
- **CORS** - Control de orígenes
- **Rate Limiting** - Límite de peticiones
- **SQL Injection Protection** - Queries parametrizadas
- **XSS Protection** - Sanitización de entrada
- **CSRF Protection** - Tokens anti-CSRF
- **Password Hashing** - Bcrypt
- **Input Validation** - Express-validator, Joi

#### Frontend:
- **Vue Router Guards** - Protección de rutas
- **Token Storage** - LocalStorage con expiración
- **Auto-refresh de tokens** - Interceptores Axios
- **Sanitización de HTML** - DOMPurify
- **HTTPS Only** - En producción

### 8.4 Auditoría

Todas las tablas incluyen campos de auditoría:
- `created_by` - Usuario que creó el registro
- `updated_by` - Usuario que actualizó el registro
- `deleted_by` - Usuario que eliminó el registro
- `created_at` - Fecha de creación
- `updated_at` - Fecha de última actualización
- `deleted_at` - Fecha de eliminación (soft delete)

### 8.5 Soft Delete

El sistema implementa soft delete en lugar de eliminación física:
- Los registros no se eliminan de la base de datos
- Se marca `deleted_at` con la fecha de eliminación
- Las consultas filtran automáticamente registros eliminados
- Posibilidad de restaurar registros

---

## 9. INTEGRACIONES

### 9.1 Integración con WhatsApp

#### Funcionalidad:
- Envío de pedidos desde e-commerce a WhatsApp
- Formato automático de mensajes
- Links directos de WhatsApp

#### Implementación:
```javascript
function generateWhatsAppLink(order) {
  const phone = '504XXXXXXXX';
  const message = `
    *Nuevo Pedido #${order.order_number}*

    Cliente: ${order.customer_name}

    Productos:
    ${order.items.map(item =>
      `- ${item.product_name} x${item.quantity} = ${formatCurrency(item.total)}`
    ).join('\n')}

    Total: ${formatCurrency(order.total)}
  `;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
```

### 9.2 Integración OCR (Tesseract.js)

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
    { name: "Producto A", quantity: 10, price: 50.00 },
    { name: "Producto B", quantity: 5, price: 75.00 }
  ],
  subtotal: 875.00,
  tax: 131.25,
  total: 1006.25
}
```

### 9.3 Exportación a Excel/PDF

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
    { header: 'Categoría', key: 'category', width: 20 },
    { header: 'Precio', key: 'price', width: 12 }
  ];

  worksheet.addRows(products);

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
```

### 9.4 Sistema de Logging (Winston)

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
    }),
    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d'
    })
  ]
});

// Uso
logger.info('User logged in', { userId: 123 });
logger.error('Database error', { error: err.message });
```

### 9.5 Cola de Trabajos (Bull + Redis)

#### Casos de Uso:
- Envío de emails
- Generación de reportes pesados
- Procesamiento de importaciones masivas
- Sincronización de datos

#### Ejemplo:
```javascript
const Queue = require('bull');

const emailQueue = new Queue('email', {
  redis: {
    host: 'localhost',
    port: 6379
  }
});

// Agregar trabajo
emailQueue.add({
  to: 'customer@example.com',
  subject: 'Confirmación de pedido',
  template: 'order-confirmation',
  data: { order }
});

// Procesar trabajos
emailQueue.process(async (job) => {
  const { to, subject, template, data } = job.data;
  await sendEmail(to, subject, template, data);
});
```

---

## 10. CONFIGURACIÓN Y DESPLIEGUE

### 10.1 Requisitos del Sistema

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
- **Redis:** 6.0+ (opcional, para caching)
- **Nginx:** 1.20+ (producción)

### 10.2 Instalación Paso a Paso

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
JWT_SECRET=tu_clave_secreta_segura_aqui
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# URLs
FRONTEND_URL=http://localhost:3001
API_URL=http://localhost:3000

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_password_app

# Redis (opcional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Archivos
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/

# SAR Honduras
COMPANY_NAME=Tu Empresa
COMPANY_RTN=01019999999999
COMPANY_ADDRESS=Tu Dirección
```

#### 3. Configurar Base de Datos

```bash
# Crear base de datos
mysql -u root -p
CREATE DATABASE prosperpos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# Las migraciones se ejecutan automáticamente al iniciar
npm run dev
```

#### 4. Configurar Template (Frontend Admin)

```bash
cd template
npm install
```

Crear archivo `.env`:
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=ProsperPOS
VITE_APP_VERSION=1.0.0
```

#### 5. Configurar Cliente E-Commerce (Opcional)

```bash
cd client
npm install
```

Crear archivo `.env`:
```env
NUXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NUXT_PUBLIC_SITE_NAME=Mi Tienda
```

### 10.3 Ejecución en Desarrollo

#### Backend:
```bash
cd backend
npm run dev
# Servidor corriendo en http://localhost:3000
```

#### Frontend Admin:
```bash
cd template
npm run dev
# Aplicación corriendo en http://localhost:3001
```

#### Cliente E-Commerce:
```bash
cd client
npm run dev
# Aplicación corriendo en http://localhost:3001
```

### 10.4 Despliegue en Producción

#### 1. Build del Frontend

```bash
# Template
cd template
npm run build
# Genera carpeta dist/

# Cliente
cd client
npm run build
# Genera carpeta .output/
```

#### 2. Configuración de Nginx

```nginx
# /etc/nginx/sites-available/prosperpos

# Backend API
server {
    listen 80;
    server_name api.tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend Admin
server {
    listen 80;
    server_name admin.tudominio.com;
    root /var/www/prosperpos/template/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# E-Commerce
server {
    listen 80;
    server_name www.tudominio.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 3. PM2 para Node.js

```bash
# Instalar PM2
npm install -g pm2

# Iniciar backend
cd backend
pm2 start server.js --name prosperpos-api

# Iniciar cliente Nuxt
cd client
pm2 start npm --name prosperpos-ecommerce -- start

# Ver procesos
pm2 list

# Ver logs
pm2 logs

# Guardar configuración
pm2 save
pm2 startup
```

#### 4. SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificados
sudo certbot --nginx -d api.tudominio.com
sudo certbot --nginx -d admin.tudominio.com
sudo certbot --nginx -d www.tudominio.com

# Renovación automática
sudo certbot renew --dry-run
```

### 10.5 Variables de Entorno - Producción

#### Backend (.env)
```env
NODE_ENV=production
PORT=3000
DB_HOST=tu_servidor_mysql
DB_USER=prosperpos_user
DB_PASSWORD=password_seguro
DB_NAME=prosperpos
JWT_SECRET=clave_ultra_secreta_256_bits
FRONTEND_URL=https://admin.tudominio.com
```

#### Frontend (.env)
```env
VITE_API_URL=https://api.tudominio.com/api/v1
```

### 10.6 Backup y Restauración

#### Script de Backup Automático

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/prosperpos"
DB_NAME="prosperpos"
DB_USER="root"
DB_PASS="tu_password"

# Backup de base de datos
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup de archivos subidos
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/prosperpos/backend/uploads

# Eliminar backups antiguos (más de 30 días)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completado: $DATE"
```

#### Cron para Backup Diario

```bash
# Editar crontab
crontab -e

# Agregar línea para backup diario a las 2 AM
0 2 * * * /path/to/backup.sh >> /var/log/prosperpos-backup.log 2>&1
```

#### Restauración

```bash
# Restaurar base de datos
gunzip < backup_file.sql.gz | mysql -u root -p prosperpos

# Restaurar archivos
tar -xzf uploads_backup.tar.gz -C /
```

### 10.7 Monitoreo

#### Logs de Aplicación

```bash
# Ver logs de PM2
pm2 logs prosperpos-api

# Ver logs de Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Logs de la aplicación
tail -f /var/www/prosperpos/backend/logs/combined.log
```

#### Monitoreo de Recursos

```bash
# PM2 Monitor
pm2 monit

# htop para recursos del sistema
htop
```

---

## 11. API REFERENCE

### 11.1 Autenticación

#### POST /api/v1/auth/login
**Descripción:** Iniciar sesión
**Autenticación:** No requerida

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
      "email": "admin@example.com",
      "first_name": "Admin",
      "last_name": "User",
      "roles": ["Super Administrador"]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "permissions": ["products.view", "products.create", ...]
  }
}
```

#### POST /api/v1/auth/refresh
**Descripción:** Renovar token de acceso

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 11.2 Productos

#### GET /api/v1/products
**Descripción:** Listar productos con filtros
**Autenticación:** Requerida
**Permiso:** `products.view`

**Query Parameters:**
- `page` (int): Número de página (default: 1)
- `limit` (int): Registros por página (default: 20)
- `search` (string): Búsqueda por nombre/código/barras
- `category_id` (int): Filtrar por categoría
- `brand_id` (int): Filtrar por marca
- `min_price` (decimal): Precio mínimo
- `max_price` (decimal): Precio máximo
- `low_stock` (boolean): Solo productos con stock bajo

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "code": "PROD-001",
        "barcode": "7501234567890",
        "name": "Producto Ejemplo",
        "description": "Descripción del producto",
        "category": "Categoría A",
        "brand": "Marca X",
        "unit": "Unidad",
        "cost_price": 50.00,
        "sale_price": 75.00,
        "tax_rate": 15.00,
        "stock": 100,
        "min_stock": 10,
        "image": "/uploads/products/imagen.jpg",
        "is_active": true
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "pages": 8
    }
  }
}
```

#### GET /api/v1/products/:id
**Descripción:** Obtener producto por ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "PROD-001",
    "name": "Producto Ejemplo",
    "stock_by_warehouse": [
      {
        "warehouse_id": 1,
        "warehouse_name": "Almacén Principal",
        "quantity": 80,
        "reserved": 5,
        "available": 75
      },
      {
        "warehouse_id": 2,
        "warehouse_name": "Sucursal Centro",
        "quantity": 20,
        "reserved": 0,
        "available": 20
      }
    ]
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
  "barcode": "7501234567891",
  "name": "Nuevo Producto",
  "description": "Descripción",
  "category_id": 5,
  "brand_id": 3,
  "unit_id": 1,
  "cost_price": 45.00,
  "sale_price": 70.00,
  "tax_rate": 15.00,
  "min_stock": 10,
  "max_stock": 200
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "code": "PROD-002",
    "message": "Producto creado exitosamente"
  }
}
```

#### PUT /api/v1/products/:id
**Descripción:** Actualizar producto
**Permiso:** `products.update`

#### DELETE /api/v1/products/:id
**Descripción:** Eliminar producto (soft delete)
**Permiso:** `products.delete`

### 11.3 Ventas (POS)

#### POST /api/v1/pos/sale
**Descripción:** Crear venta desde POS
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
      "unit_price": 75.00,
      "discount_percent": 0
    },
    {
      "product_id": 3,
      "quantity": 1,
      "unit_price": 120.00,
      "discount_percent": 10
    }
  ],
  "subtotal": 258.00,
  "tax_amount": 38.70,
  "discount_amount": 12.00,
  "total": 284.70,
  "cash_received": 300.00,
  "change_returned": 15.30,
  "notes": "Cliente frecuente"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "sale_id": 123,
    "invoice_number": "001-001-01-00000123",
    "total": 284.70,
    "change": 15.30,
    "print_url": "/api/v1/pos/print/123"
  }
}
```

### 11.4 Reportes

#### GET /api/v1/reports/sales-book
**Descripción:** Libro de ventas
**Permiso:** `reports.sales`

**Query Parameters:**
- `start_date` (date): Fecha inicial (YYYY-MM-DD)
- `end_date` (date): Fecha final (YYYY-MM-DD)
- `seller_id` (int): Filtrar por vendedor
- `customer_id` (int): Filtrar por cliente
- `payment_method` (string): Filtrar por método de pago
- `export` (string): Formato de exportación (excel, pdf)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sales": [
      {
        "invoice_number": "001-001-01-00000120",
        "date": "2025-12-18",
        "customer": "Cliente XYZ",
        "seller": "Juan Pérez",
        "payment_method": "cash",
        "subtotal": 500.00,
        "tax": 75.00,
        "total": 575.00
      }
    ],
    "totals": {
      "count": 50,
      "subtotal": 25000.00,
      "tax": 3750.00,
      "total": 28750.00,
      "by_payment_method": {
        "cash": 15000.00,
        "card": 10000.00,
        "transfer": 3750.00
      }
    }
  }
}
```

### 11.5 Inventario Físico

#### POST /api/v1/physical-inventory
**Descripción:** Crear inventario físico

**Request Body:**
```json
{
  "warehouse_id": 1,
  "count_date": "2025-12-18",
  "notes": "Conteo mensual",
  "items": [
    {
      "product_id": 1,
      "system_quantity": 100,
      "counted_quantity": 98
    },
    {
      "product_id": 2,
      "system_quantity": 50,
      "counted_quantity": 52
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "code": "INV-2025-001",
    "status": "borrador",
    "discrepancies": [
      {
        "product_id": 1,
        "product_name": "Producto A",
        "difference": -2,
        "value": -100.00
      },
      {
        "product_id": 2,
        "product_name": "Producto B",
        "difference": 2,
        "value": 90.00
      }
    ],
    "total_value": -10.00
  }
}
```

### 11.6 Códigos de Error

| Código | Significado |
|--------|-------------|
| 200 | OK - Petición exitosa |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto (ej: código duplicado) |
| 422 | Unprocessable Entity - Errores de validación |
| 429 | Too Many Requests - Límite de peticiones excedido |
| 500 | Internal Server Error - Error del servidor |

**Formato de Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos de entrada inválidos",
    "details": [
      {
        "field": "email",
        "message": "El email es requerido"
      },
      {
        "field": "password",
        "message": "La contraseña debe tener al menos 8 caracteres"
      }
    ]
  }
}
```

---

## 12. MANTENIMIENTO Y SOPORTE

### 12.1 Tareas de Mantenimiento

#### Diarias:
- ✅ Verificar logs de errores
- ✅ Monitorear uso de recursos (CPU, RAM, Disco)
- ✅ Revisar backup automático

#### Semanales:
- ✅ Revisar rendimiento de la base de datos
- ✅ Analizar logs de acceso y errores
- ✅ Verificar espacio en disco
- ✅ Revisar seguridad y actualizaciones

#### Mensuales:
- ✅ Optimizar tablas de base de datos
- ✅ Limpiar logs antiguos
- ✅ Revisar y actualizar dependencias
- ✅ Análisis de seguridad
- ✅ Prueba de restauración de backups

### 12.2 Optimización de Base de Datos

```sql
-- Optimizar tablas
OPTIMIZE TABLE products;
OPTIMIZE TABLE sales;
OPTIMIZE TABLE stock;
OPTIMIZE TABLE stock_cargo_descargo;

-- Analizar tablas
ANALYZE TABLE products;
ANALYZE TABLE sales;

-- Ver tamaño de tablas
SELECT
  table_name AS 'Tabla',
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Tamaño (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'prosperpos'
ORDER BY (data_length + index_length) DESC;
```

### 12.3 Limpieza de Datos

```sql
-- Eliminar registros antiguos (más de 2 años)
DELETE FROM login_attempts WHERE created_at < DATE_SUB(NOW(), INTERVAL 2 YEAR);

-- Limpiar tokens expirados
DELETE FROM refresh_tokens WHERE expires_at < NOW();

-- Limpiar carritos abandonados (más de 30 días)
DELETE FROM shopping_cart
WHERE updated_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

### 12.4 Troubleshooting

#### Problema: Error de Conexión a Base de Datos

**Síntomas:**
- Error: "ECONNREFUSED" o "Cannot connect to MySQL"

**Soluciones:**
1. Verificar que MySQL esté corriendo: `sudo service mysql status`
2. Verificar credenciales en `.env`
3. Verificar permisos del usuario de BD
4. Revisar firewall y puertos

#### Problema: Token JWT Expirado

**Síntomas:**
- Error 401: "Token expired"

**Soluciones:**
1. Frontend debe capturar error y usar refresh token
2. Implementar interceptor en Axios para renovación automática
3. Verificar configuración de expiración en `.env`

#### Problema: Stock Negativo

**Síntomas:**
- Stock muestra valores negativos

**Soluciones:**
1. Revisar triggers de actualización de stock
2. Verificar transacciones de venta
3. Ejecutar query de corrección:

```sql
UPDATE stock
SET quantity = 0
WHERE quantity < 0;
```

#### Problema: Lentitud en Reportes

**Síntomas:**
- Reportes tardan mucho en cargar

**Soluciones:**
1. Optimizar queries con índices
2. Implementar paginación
3. Usar cache con Redis
4. Generar reportes en background con Bull

### 12.5 Actualizaciones

#### Actualizar Dependencias de Node.js

```bash
# Backend
cd backend
npm outdated
npm update
npm audit fix

# Frontend
cd template
npm outdated
npm update
npm audit fix
```

#### Actualizar Node.js

```bash
# Usando nvm
nvm install 18
nvm use 18
nvm alias default 18
```

### 12.6 Seguridad

#### Checklist de Seguridad:

- [ ] Cambiar contraseñas por defecto
- [ ] Usar HTTPS en producción
- [ ] Mantener dependencias actualizadas
- [ ] Configurar firewall correctamente
- [ ] Limitar acceso SSH
- [ ] Implementar rate limiting
- [ ] Validar todas las entradas de usuario
- [ ] Usar prepared statements
- [ ] Encriptar datos sensibles
- [ ] Auditar logs regularmente
- [ ] Implementar 2FA para administradores

### 12.7 Contacto y Soporte

**Documentación:**
- Manual de Usuario: `/docs/MANUAL_USUARIO.md`
- Diccionario de Datos: `/docs/DICCIONARIO_DATOS_PROSPERPOS.md`
- Guías de Módulos: `/docs/*.md`

**Reportar Bugs:**
- GitHub Issues (si aplica)
- Email de soporte

**Solicitar Funcionalidades:**
- Formulario de features
- Reuniones con equipo de desarrollo

---

## APÉNDICES

### A. Comandos Útiles

```bash
# Backend
npm run dev          # Desarrollo
npm start            # Producción
npm test             # Tests
npm run migrate      # Migraciones

# Frontend
npm run dev          # Desarrollo
npm run build        # Build producción
npm run preview      # Preview build

# Base de datos
mysqldump -u root -p prosperpos > backup.sql
mysql -u root -p prosperpos < backup.sql

# PM2
pm2 start server.js
pm2 restart all
pm2 stop all
pm2 logs
pm2 monit

# Nginx
sudo nginx -t                    # Test config
sudo systemctl restart nginx     # Reiniciar
sudo systemctl status nginx      # Estado
```

### B. Estructura de Archivos Clave

```
ProsperPOS/
├── backend/
│   ├── .env                     # Variables de entorno
│   ├── server.js                # Entrada del servidor
│   ├── app.js                   # Configuración Express
│   └── src/
│       ├── controllers/         # Lógica de negocio
│       ├── models/              # Modelos de datos
│       ├── services/            # Servicios
│       ├── routes/              # Rutas API
│       ├── middleware/          # Middlewares
│       └── utils/               # Utilidades
│
├── template/
│   ├── .env                     # Variables de entorno frontend
│   ├── vite.config.js           # Configuración Vite
│   └── src/
│       ├── main.js              # Entrada Vue
│       ├── App.vue              # Componente raíz
│       ├── router/              # Vue Router
│       ├── stores/              # Pinia stores
│       ├── services/            # Servicios API
│       ├── components/          # Componentes
│       └── views/               # Páginas
│
└── client/
    ├── nuxt.config.js           # Configuración Nuxt
    ├── pages/                   # Páginas (auto-routing)
    ├── components/              # Componentes
    ├── layouts/                 # Layouts
    └── services/                # Servicios API
```

### C. Glosario de Términos

- **CAI:** Código de Autorización de Impresión (SAR Honduras)
- **SAR:** Servicio de Administración de Rentas (Honduras)
- **RTN:** Registro Tributario Nacional
- **POS:** Point of Sale (Punto de Venta)
- **CRUD:** Create, Read, Update, Delete
- **JWT:** JSON Web Token
- **RBAC:** Role-Based Access Control
- **OCR:** Optical Character Recognition
- **API:** Application Programming Interface
- **REST:** Representational State Transfer
- **SSR:** Server-Side Rendering

---

## CONCLUSIÓN

Este manual técnico proporciona una visión completa del sistema ProsperPOS, cubriendo desde la arquitectura hasta el despliegue y mantenimiento. El sistema está diseñado con las mejores prácticas de desarrollo, seguridad y escalabilidad.

**Características Destacadas:**
- ✅ Arquitectura modular y escalable
- ✅ API REST bien documentada
- ✅ Seguridad robusta con JWT y RBAC
- ✅ Cumplimiento normativo SAR Honduras
- ✅ Sistema multi-almacén
- ✅ Trazabilidad completa de stock
- ✅ Reportes exhaustivos
- ✅ E-commerce integrado
- ✅ Fácil mantenimiento y actualización

**Versión del Manual:** 1.0
**Última Actualización:** Diciembre 2025
**Desarrollado por:** [Tu Empresa]

---

*Fin del Manual Técnico*
