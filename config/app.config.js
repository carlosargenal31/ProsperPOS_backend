// ===================================================================
// PROSPERPOS - CONFIGURACIÓN DE LA APLICACIÓN
// ===================================================================

require('dotenv').config();

// ===================================================================
// CONFIGURACIÓN GENERAL
// ===================================================================

const config = {
  // Información de la aplicación
  app: {
    name: 'ProsperPOS',
    version: '1.0.0',
    description: 'Sistema de Punto de Venta con Facturación Electrónica',
    author: 'ProsperPOS Team',
    environment: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 3000,
    timezone: process.env.TZ || 'America/Tegucigalpa'
  },

  // URLs y dominios
  urls: {
    frontend: process.env.FRONTEND_URL || 'http://localhost:8080',
    api: process.env.API_URL || 'http://localhost:3000/api',
    docs: process.env.DOCS_URL || 'http://localhost:3000/api/docs'
  },

  // Base de datos
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prosperpos',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    charset: 'utf8mb4'
  },

  // Configuración JWT
  jwt: {
    secret: process.env.JWT_SECRET || '4321',
    expiresIn: process.env.JWT_EXPIRE || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
    issuer: 'ProsperPOS',
    audience: 'prosperpos-users'
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    authMaxRequests: 5,
    uploadMaxRequests: 10
  },

  // Configuración de archivos
  files: {
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: process.env.MAX_FILE_SIZE || '5MB',
    allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    allowedSpreadsheetTypes: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv']
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    toFile: process.env.LOG_TO_FILE === 'true',
    debugLog: process.env.DEBUG_LOG === 'true',
    sqlLog: process.env.LOG_SQL === 'true',
    maxSize: '20m',
    maxFiles: '14d',
    datePattern: 'YYYY-MM-DD'
  },

  // Email (SMTP)
  email: {
    enabled: process.env.SMTP_HOST ? true : false,
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'noreply@prosperpos.com',
    fromName: process.env.SMTP_FROM_NAME || 'ProsperPOS'
  },

  // Redis (para colas y cache)
  redis: {
    enabled: process.env.REDIS_URL ? true : false,
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 0
  },

  // Configuración específica de Honduras
  honduras: {
    currency: process.env.DEFAULT_CURRENCY || 'HNL',
    taxRate: parseFloat(process.env.DEFAULT_TAX_RATE) || 0.15,
    companyRTN: process.env.COMPANY_RTN || '00000000000000',
    fiscalYear: {
      start: '01-01',
      end: '12-31'
    },
    workingHours: {
      start: '08:00',
      end: '18:00'
    }
  },

  // Features flags
  features: {
    enableAudit: process.env.ENABLE_AUDIT === 'true',
    enableBackup: process.env.ENABLE_BACKUP === 'true',
    enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
    enableReports: true,
    enableMultiStore: false, // Para futuras versiones
    enableEcommerce: false // Para fase 2
  },

  // Configuración de seguridad
  security: {
    bcryptRounds: 12,
    sessionTimeout: 30 * 60 * 1000, // 30 minutos
    maxLoginAttempts: 5,
    lockoutTime: 15 * 60 * 1000, // 15 minutos
    passwordMinLength: 8,
    requirePasswordComplexity: true
  },

  // Configuración de reportes
  reports: {
    defaultDateRange: 30, // días
    maxExportRows: 10000,
    cacheTtl: 5 * 60, // 5 minutos
    supportedFormats: ['pdf', 'xlsx', 'csv']
  },

  // Configuración de POS
  pos: {
    maxCartItems: 100,
    sessionTimeout: 60 * 60 * 1000, // 1 hora
    allowNegativeStock: false,
    requireCustomerForSale: false,
    defaultPaymentMethod: 'cash',
    printReceiptByDefault: true
  },

  // Configuración de inventario
  inventory: {
    lowStockThreshold: 10,
    enableStockMovements: true,
    enableBarcodeGeneration: true,
    barcodePrefix: 'POS',
    enableExpirationDates: true
  }
};

// ===================================================================
// VALIDACIONES
// ===================================================================

const validateConfig = () => {
  const errors = [];

  // Validar JWT secret en producción
  if (config.app.environment === 'production' && 
      config.jwt.secret === 'prosperpos_default_secret_change_in_production') {
    errors.push('JWT_SECRET debe cambiarse en producción');
  }

  // Validar configuración de base de datos
  if (!config.database.host || !config.database.user || !config.database.database) {
    errors.push('Configuración de base de datos incompleta');
  }

  // Validar configuración de email si está habilitada
  if (config.email.enabled && (!config.email.host || !config.email.user)) {
    errors.push('Configuración de email incompleta');
  }

  // Validar RTN de Honduras
  if (config.honduras.companyRTN.length !== 14) {
    errors.push('RTN de empresa debe tener 14 dígitos');
  }

  return errors;
};

// ===================================================================
// FUNCIONES AUXILIARES
// ===================================================================

const isDevelopment = () => config.app.environment === 'development';
const isProduction = () => config.app.environment === 'production';
const isTesting = () => config.app.environment === 'test';

const getConfigSummary = () => {
  return {
    app: config.app.name,
    version: config.app.version,
    environment: config.app.environment,
    database: `${config.database.host}:${config.database.port}/${config.database.database}`,
    features: Object.entries(config.features)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature),
    security: {
      jwtExpires: config.jwt.expiresIn,
      rateLimitWindow: config.rateLimit.windowMs / 1000 / 60 + ' min',
      rateLimitMax: config.rateLimit.maxRequests
    }
  };
};

// ===================================================================
// CONFIGURACIÓN POR ENTORNO
// ===================================================================

const getEnvironmentConfig = () => {
  const envConfigs = {
    development: {
      logging: { ...config.logging, level: 'debug', debugLog: true },
      security: { ...config.security, bcryptRounds: 4 }, // Más rápido en dev
      rateLimit: { ...config.rateLimit, maxRequests: 1000 } // Más permisivo
    },
    test: {
      database: { ...config.database, database: config.database.database + '_test' },
      logging: { ...config.logging, level: 'error' },
      jwt: { ...config.jwt, expiresIn: '1h' },
      features: { ...config.features, enableAudit: false }
    },
    production: {
      logging: { ...config.logging, toFile: true },
      security: { ...config.security, bcryptRounds: 12 },
      features: { ...config.features, enableAudit: true, enableBackup: true }
    }
  };

  return {
    ...config,
    ...envConfigs[config.app.environment] || {}
  };
};

// ===================================================================
// EXPORTACIONES
// ===================================================================

module.exports = {
  ...getEnvironmentConfig(),
  validate: validateConfig,
  isDevelopment,
  isProduction,
  isTesting,
  getSummary: getConfigSummary
};