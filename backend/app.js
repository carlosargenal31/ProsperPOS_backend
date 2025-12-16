// ===================================================================
// PROSPERPOS - APLICACIÓN EXPRESS PRINCIPAL (CON MIGRACIONES AUTOMÁTICAS)
// ===================================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Utilidades
const logger = require('./src/utils/logger');
const { createResponse } = require('./src/utils/response');
const DatabaseMigrator = require('./src/utils/database-migrator');

// Middlewares
const rateLimitMiddleware = require('./src/middleware/rate-limit.middleware');

// Rutas principales
const routes = require('./src/routes');

// ===================================================================
// CREAR APLICACIÓN EXPRESS
// ===================================================================

const app = express();

// ===================================================================
// INICIALIZACIÓN DE BASE DE DATOS
// ===================================================================

async function initializeDatabase() {
  try {
    logger.info('🚀 Iniciando ProsperPOS Backend...');
    
    // Verificar conexión a base de datos
    const connected = await DatabaseMigrator.checkConnection();
    if (!connected) {
      throw new Error('No se pudo conectar a la base de datos');
    }

    // Ejecutar migraciones automáticas
    await DatabaseMigrator.runMigrations();
    
    logger.info('📊 Base de datos inicializada correctamente');
    return true;
    
  } catch (error) {
    logger.error('💥 Error al inicializar base de datos:', error);
    
    // En desarrollo, intentar continuar
    if (process.env.NODE_ENV === 'development') {
      logger.warn('⚠️ Continuando en modo desarrollo sin base de datos');
      return false;
    }
    
    // En producción, salir del proceso
    process.exit(1);
  }
}

// ===================================================================
// CONFIGURACIÓN GLOBAL
// ===================================================================

// Trust proxy (para reverse proxies como nginx)
app.set('trust proxy', 1);

// Configurar directorio de vistas (si usamos templates)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs'); // Opcional: para páginas de error

// ===================================================================
// MIDDLEWARES DE SEGURIDAD
// ===================================================================

// Helmet para seguridad básica
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false // Para permitir uploads
}));

// CORS básico
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting - usando el middleware importado
app.use(rateLimitMiddleware.api);

// ===================================================================
// MIDDLEWARES DE UTILIDADES
// ===================================================================

// Compresión
app.use(compression());

// Parseo de JSON
app.use(express.json({ 
  limit: process.env.MAX_JSON_SIZE || '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json(createResponse(false, 'JSON inválido', null));
      throw new Error('JSON inválido');
    }
  }
}));

// Parseo de URL encoded
app.use(express.urlencoded({ 
  extended: true, 
  limit: process.env.MAX_URL_SIZE || '10mb' 
}));

// Archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/docs', express.static(path.join(__dirname, 'docs')));

// ===================================================================
// LOGGING
// ===================================================================

// Morgan para logging HTTP
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Middleware para logging de requests
app.use((req, res, next) => {
  req.startTime = Date.now();
  
  // Log de request
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.headers['x-request-id'] || 'no-id'
  });
  
  next();
});

// ===================================================================
// RUTAS PRINCIPALES
// ===================================================================

// Health check (incluye estado de base de datos)
app.get('/health', async (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  // Verificar estado de base de datos
  let dbStatus = 'unknown';
  try {
    const dbConnected = await DatabaseMigrator.checkConnection();
    dbStatus = dbConnected ? 'connected' : 'disconnected';
  } catch (error) {
    dbStatus = 'error';
  }
  
  res.json(createResponse(true, 'Servidor funcionando correctamente', {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 60)} minutos`,
    database: dbStatus,
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`
    },
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  }));
});

// Información básica de la API
app.get('/api', (req, res) => {
  res.json(createResponse(true, 'ProsperPOS API', {
    name: 'ProsperPOS Backend API',
    version: '1.0.0',
    description: 'Sistema de Punto de Venta con Facturación Electrónica',
    documentation: `${req.protocol}://${req.get('host')}/api/docs`,
    features: [
      'Autenticación JWT',
      'Gestión de productos e inventario',
      'Sistema POS completo',
      'Facturación electrónica',
      'Gestión de clientes y proveedores',
      'Reportes y analíticas',
      'Migraciones automáticas de BD'
    ],
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      products: '/api/v1/products',
      inventory: '/api/v1/inventory',
      customers: '/api/v1/customers',
      suppliers: '/api/v1/suppliers',
      categories: '/api/v1/categories',
      pos: '/api/v1/pos'
    },
    database_initialized: true
  }));
});

// Endpoint para forzar re-migración (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.post('/api/migrate', async (req, res) => {
    try {
      await DatabaseMigrator.runMigrations();
      res.json(createResponse(true, 'Migraciones ejecutadas exitosamente'));
    } catch (error) {
      logger.error('Error en migración manual:', error);
      res.status(500).json(createResponse(false, 'Error en migración', error.message));
    }
  });
}

// Rutas de la API
app.use('/api', routes);

// ===================================================================
// MANEJO DE RUTAS NO ENCONTRADAS
// ===================================================================

app.use('*', (req, res) => {
  logger.warn(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json(createResponse(
    false, 
    'Ruta no encontrada', 
    {
      path: req.originalUrl,
      method: req.method,
      suggestion: 'Verifica la documentación de la API en /api',
      availableRoutes: [
        'GET /health - Estado del servidor',
        'GET /api - Información de la API',
        'POST /api/v1/auth/login - Iniciar sesión',
        'GET /api/v1/users - Listar usuarios',
        'GET /api/v1/products - Listar productos',
        'GET /api/v1/categories - Listar categorías',
        'GET /api/v1/customers - Listar clientes',
        'GET /api/v1/suppliers - Listar proveedores',
        'GET /api/v1/sales-book - Libro de Ventas (Sales Book)'
      ]
    }
  ));
});

// ===================================================================
// MIDDLEWARE DE MANEJO DE ERRORES (DEBE SER EL ÚLTIMO)
// ===================================================================

app.use((err, req, res, next) => {
  // Calcular tiempo de respuesta
  const responseTime = req.startTime ? Date.now() - req.startTime : 0;
  
  // Log detallado del error
  logger.error('Error no manejado:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query,
    responseTime: `${responseTime}ms`
  });
  
  // Respuesta según el entorno
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json(createResponse(
    false,
    err.message || 'Error interno del servidor',
    isDevelopment ? {
      stack: err.stack,
      details: err.details || null
    } : null
  ));
});

// ===================================================================
// FUNCIÓN DE INICIALIZACIÓN Y EXPORTACIÓN
// ===================================================================

// Función para inicializar la aplicación
async function initializeApp() {
  try {
    // Inicializar base de datos
    const dbInitialized = await initializeDatabase();
    
    if (dbInitialized) {
      logger.info('✅ Aplicación inicializada correctamente con base de datos');
    } else {
      logger.warn('⚠️ Aplicación inicializada sin base de datos');
    }
    
    return app;
    
  } catch (error) {
    logger.error('💥 Error al inicializar aplicación:', error);
    throw error;
  }
}

// Exportar tanto la app como la función de inicialización
module.exports = {
  app,
  initializeApp
};