// ===================================================================
// PROSPERPOS - SISTEMA DE LOGGING
// ===================================================================

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// ===================================================================
// CONFIGURACIÓN DE DIRECTORIOS
// ===================================================================

const logsDir = path.join(__dirname, '../../logs');

// Crear directorio de logs si no existe
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ===================================================================
// FORMATOS PERSONALIZADOS
// ===================================================================

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // Agregar metadata si existe
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    
    return msg;
  })
);

// ===================================================================
// CONFIGURACIÓN DE TRANSPORTES
// ===================================================================

const transports = [];

// Consola (siempre activo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  transports.push(
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || 'debug',
      format: consoleFormat
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      level: 'info',
      format: consoleFormat
    })
  );
}

// Archivos (si está habilitado)
if (process.env.LOG_TO_FILE === 'true') {
  // Log general
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      level: 'info',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );

  // Log de errores
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );

  // Log de debugging (solo en desarrollo)
  if (process.env.DEBUG_LOG === 'true') {
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'debug.log'),
        level: 'debug',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 3
      })
    );
  }
}

// ===================================================================
// CREAR LOGGER
// ===================================================================

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false
});

// ===================================================================
// FUNCIONES AUXILIARES
// ===================================================================

/**
 * Log de actividad de usuario
 */
logger.userActivity = (userId, action, details = {}) => {
  logger.info('User Activity', {
    userId,
    action,
    details,
    timestamp: new Date().toISOString(),
    type: 'USER_ACTIVITY'
  });
};

/**
 * Log de transacciones SQL
 */
logger.sqlQuery = (sql, params = [], duration = 0) => {
  if (process.env.LOG_SQL === 'true') {
    logger.debug('SQL Query', {
      sql: sql.replace(/\s+/g, ' ').trim(),
      params,
      duration: `${duration}ms`,
      type: 'SQL_QUERY'
    });
  }
};

/**
 * Log de errores de API
 */
logger.apiError = (method, url, error, userId = null) => {
  logger.error('API Error', {
    method,
    url,
    error: error.message,
    stack: error.stack,
    userId,
    timestamp: new Date().toISOString(),
    type: 'API_ERROR'
  });
};

/**
 * Log de autenticación
 */
logger.auth = (action, userId = null, details = {}) => {
  logger.info('Authentication', {
    action, // 'LOGIN', 'LOGOUT', 'TOKEN_REFRESH', 'LOGIN_FAILED'
    userId,
    details,
    timestamp: new Date().toISOString(),
    type: 'AUTH'
  });
};

/**
 * Log de operaciones de negocio
 */
logger.business = (operation, details = {}) => {
  logger.info('Business Operation', {
    operation, // 'SALE_CREATED', 'INVENTORY_UPDATED', 'PAYMENT_PROCESSED'
    details,
    timestamp: new Date().toISOString(),
    type: 'BUSINESS'
  });
};

/**
 * Log de performance
 */
logger.performance = (operation, duration, details = {}) => {
  const level = duration > 1000 ? 'warn' : 'info';
  
  logger[level]('Performance', {
    operation,
    duration: `${duration}ms`,
    details,
    timestamp: new Date().toISOString(),
    type: 'PERFORMANCE'
  });
};

/**
 * Log de seguridad
 */
logger.security = (event, details = {}) => {
  logger.warn('Security Event', {
    event, // 'RATE_LIMIT_EXCEEDED', 'INVALID_TOKEN', 'SUSPICIOUS_ACTIVITY'
    details,
    timestamp: new Date().toISOString(),
    type: 'SECURITY'
  });
};

// ===================================================================
// MANEJO DE ERRORES DEL LOGGER
// ===================================================================

logger.on('error', (error) => {
  console.error('Logger error:', error);
});

// ===================================================================
// FUNCIÓN DE LIMPIEZA DE LOGS
// ===================================================================

/**
 * Limpiar logs antiguos
 */
function cleanOldLogs() {
  try {
    const files = fs.readdirSync(logsDir);
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 días

    files.forEach(file => {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        logger.info(`Old log file removed: ${file}`);
      }
    });
  } catch (error) {
    logger.error('Error cleaning old logs:', error);
  }
}

// Limpiar logs cada 24 horas
if (process.env.NODE_ENV === 'production') {
  setInterval(cleanOldLogs, 24 * 60 * 60 * 1000);
}

// ===================================================================
// EXPORTAR LOGGER
// ===================================================================

module.exports = logger;