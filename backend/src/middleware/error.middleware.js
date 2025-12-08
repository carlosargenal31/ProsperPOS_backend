// ===================================================================
// PROSPERPOS - MIDDLEWARE DE MANEJO DE ERRORES
// ===================================================================

const logger = require('../utils/logger');

// ===================================================================
// CLASES DE ERRORES PERSONALIZADOS
// ===================================================================

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = null) {
    super(message, 400);
    this.errors = errors;
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 403);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'No autenticado') {
    super(message, 401);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflicto con el estado actual') {
    super(message, 409);
  }
}

// ===================================================================
// WRAPPER PARA FUNCIONES ASYNC
// ===================================================================

/**
 * Wrapper para manejar errores en funciones async
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ===================================================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ===================================================================

/**
 * Middleware global de manejo de errores
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log del error
  if (err.statusCode >= 500) {
    logger.error('Server Error:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      userId: req.user?.id
    });
  } else {
    logger.warn('Client Error:', {
      message: err.message,
      url: req.url,
      method: req.method,
      userId: req.user?.id
    });
  }

  // Errores de Mongoose/MongoDB
  if (err.name === 'CastError') {
    error = new ValidationError('ID inválido');
  }

  if (err.code === 11000) {
    error = new ConflictError('Registro duplicado');
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    error = new ValidationError('Datos inválidos', errors);
  }

  // Errores de JWT
  if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Token inválido');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expirado');
  }

  // Respuesta
  const response = {
    success: false,
    message: error.message || 'Error del servidor',
    timestamp: new Date().toISOString()
  };

  if (error.errors) {
    response.errors = error.errors;
  }

  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(error.statusCode || 500).json(response);
};

/**
 * Middleware para rutas no encontradas
 */
const notFound = (req, res, next) => {
  const error = new NotFoundError(`Ruta no encontrada: ${req.originalUrl}`);
  next(error);
};

// ===================================================================
// EXPORTAR
// ===================================================================

module.exports = {
  // Clases de error
  AppError,
  ValidationError,
  NotFoundError,
  AuthorizationError,
  AuthenticationError,
  ConflictError,
  
  // Middlewares
  catchAsync,
  errorHandler,
  notFound
};
