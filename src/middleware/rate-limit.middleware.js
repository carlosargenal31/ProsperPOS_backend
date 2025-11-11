// ===================================================================
// PROSPERPOS - MIDDLEWARE DE RATE LIMITING
// ===================================================================

const logger = require('../utils/logger');

// Almacenamiento en memoria para rate limiting (en producción usar Redis)
const requestCounts = new Map();

// ===================================================================
// FUNCIONES AUXILIARES
// ===================================================================

/**
 * Limpiar contadores antiguos cada 5 minutos
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.resetTime > 0) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Obtener identificador único del cliente
 */
function getClientId(req) {
  // Usar IP + User-Agent como identificador
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'unknown';
  return `${ip}:${userAgent}`;
}

/**
 * Middleware genérico de rate limiting
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutos por defecto
    max = 100, // 100 requests por ventana
    message = 'Demasiadas solicitudes, intenta más tarde',
    statusCode = 429,
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return (req, res, next) => {
    const clientId = getClientId(req);
    const key = `${clientId}:${req.path}`;
    const now = Date.now();

    // Obtener o crear contador
    let clientData = requestCounts.get(key);
    
    if (!clientData || now > clientData.resetTime) {
      // Crear nuevo contador
      clientData = {
        count: 0,
        resetTime: now + windowMs
      };
      requestCounts.set(key, clientData);
    }

    // Incrementar contador
    clientData.count++;

    // Verificar límite
    if (clientData.count > max) {
      logger.security('RATE_LIMIT_EXCEEDED', {
        clientId,
        path: req.path,
        count: clientData.count,
        max
      });

      return res.status(statusCode).json({
        success: false,
        message,
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      });
    }

    // Headers informativos
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - clientData.count));
    res.setHeader('X-RateLimit-Reset', new Date(clientData.resetTime).toISOString());

    // Continuar
    next();
  };
}

// ===================================================================
// LIMITADORES PREDEFINIDOS
// ===================================================================

/**
 * Rate limiter para login
 * Máximo 5 intentos cada 15 minutos
 */
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Demasiados intentos de inicio de sesión. Intenta en 15 minutos'
});

/**
 * Rate limiter para registro
 * Máximo 3 registros por hora
 */
const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Demasiados registros desde esta dirección. Intenta en 1 hora'
});

/**
 * Rate limiter para APIs generales
 * Máximo 100 requests cada 15 minutos
 */
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas solicitudes. Intenta más tarde'
});

/**
 * Rate limiter estricto para operaciones sensibles
 * Máximo 10 requests cada 15 minutos
 */
const strictLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Demasiadas solicitudes para esta operación. Intenta más tarde'
});

/**
 * Rate limiter para subida de archivos
 * Máximo 20 uploads por hora
 */
const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Demasiadas subidas de archivos. Intenta en 1 hora'
});

/**
 * Rate limiter para cambio de contraseña
 * Máximo 3 cambios por hora
 */
const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Demasiados intentos de cambio de contraseña. Intenta en 1 hora'
});

/**
 * Rate limiter para solicitud de reseteo de contraseña
 * Máximo 3 solicitudes por hora
 */
const forgotPasswordLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Demasiadas solicitudes de reseteo. Intenta en 1 hora'
});

// ===================================================================
// EXPORTAR
// ===================================================================

module.exports = {
  // Función para crear limitadores personalizados
  createRateLimiter,
  
  // Limitadores predefinidos
  login: loginLimiter,
  register: registerLimiter,
  api: apiLimiter,
  generalRateLimit: apiLimiter, // Alias para app.js
  strict: strictLimiter,
  upload: uploadLimiter,
  passwordReset: passwordResetLimiter,
  forgotPassword: forgotPasswordLimiter
};