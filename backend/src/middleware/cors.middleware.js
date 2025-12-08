// ===================================================================
// PROSPERPOS - MIDDLEWARE CORS
// ===================================================================

const cors = require('cors');
const logger = require('../utils/logger');

// ===================================================================
// CONFIGURACIÓN CORS
// ===================================================================

const corsOptions = {
  // Orígenes permitidos
  origin: (origin, callback) => {
    // Lista de orígenes permitidos
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:8080',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173', // Vite
      'http://localhost:8081',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ];

    // En desarrollo, permitir peticiones sin origin (Postman, apps móviles)
    if (process.env.NODE_ENV === 'development' && !origin) {
      return callback(null, true);
    }

    // En producción, agregar dominios específicos
    if (process.env.NODE_ENV === 'production') {
      const productionOrigins = process.env.PRODUCTION_ORIGINS?.split(',') || [];
      allowedOrigins.push(...productionOrigins);
    }

    // Verificar si el origen está permitido
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      logger.warn(`CORS: Origen no permitido: ${origin}`);
      callback(new Error('No permitido por política CORS'));
    }
  },

  // Métodos HTTP permitidos
  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
  ],

  // Headers permitidos
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Request-ID',
    'X-API-Key',
    'X-Client-Version'
  ],

  // Headers expuestos al cliente
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page',
    'X-Rate-Limit-Limit',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset'
  ],

  // Permitir cookies
  credentials: true,

  // Caché de preflight (en segundos)
  maxAge: process.env.NODE_ENV === 'production' ? 86400 : 3600, // 24h en prod, 1h en dev

  // Manejar preflight
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// ===================================================================
// MIDDLEWARE PERSONALIZADO
// ===================================================================

const corsMiddleware = (req, res, next) => {
  // Aplicar CORS básico
  cors(corsOptions)(req, res, (err) => {
    if (err) {
      logger.error('Error CORS:', err);
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado por política CORS',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }

    // Headers adicionales de seguridad
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    
    // Header personalizado para identificar la API
    res.header('X-API-Version', process.env.API_VERSION || '1.0.0');
    res.header('X-Powered-By', 'ProsperPOS');

    // Log de requests CORS en desarrollo
    if (process.env.NODE_ENV === 'development' && req.method === 'OPTIONS') {
      logger.info(`CORS Preflight: ${req.method} ${req.originalUrl}`, {
        origin: req.headers.origin,
        requestHeaders: req.headers['access-control-request-headers']
      });
    }

    next();
  });
};

// ===================================================================
// CONFIGURACIÓN ESPECÍFICA PARA DIFERENTES ENTORNOS
// ===================================================================

const developmentCors = {
  ...corsOptions,
  origin: true, // Permitir todos los orígenes en desarrollo
  credentials: true
};

const productionCors = {
  ...corsOptions,
  origin: corsOptions.origin, // Usar la función de validación estricta
  credentials: true
};

// ===================================================================
// FUNCIONES AUXILIARES
// ===================================================================

const isDevelopment = () => process.env.NODE_ENV === 'development';

const getCorsConfig = () => {
  return isDevelopment() ? developmentCors : productionCors;
};

const logCorsInfo = () => {
  const config = getCorsConfig();
  logger.info('Configuración CORS inicializada:', {
    environment: process.env.NODE_ENV,
    allowCredentials: config.credentials,
    methods: config.methods.join(', '),
    maxAge: config.maxAge
  });
};

// ===================================================================
// EXPORTACIONES
// ===================================================================

module.exports = corsMiddleware;

// Exportar también las configuraciones para testing
module.exports.corsOptions = corsOptions;
module.exports.getCorsConfig = getCorsConfig;
module.exports.logCorsInfo = logCorsInfo;