// ===================================================================
// PROSPERPOS - CLASES DE ERROR PERSONALIZADAS
// ===================================================================

class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class AuthError extends AppError {
  constructor(message) {
    super(message, 401, 'AUTH_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflicto con el estado actual del recurso') {
    super(message, 409, 'CONFLICT');
  }
}

// ===================================================================
// FUNCIONES AUXILIARES PARA CREAR ERRORES
// ===================================================================

const createAppError = (message, statusCode = 500) => new AppError(message, statusCode);
const createValidationError = (message, errors = []) => new ValidationError(message, errors);
const createAuthError = (message) => new AuthError(message);
const createNotFoundError = (message) => new NotFoundError(message);
const createConflictError = (message) => new ConflictError(message);

// ===================================================================
// EXPORTAR CLASES Y FUNCIONES
// ===================================================================

module.exports = {
  AppError,
  ValidationError,
  AuthError,
  NotFoundError,
  ConflictError,
  createAppError,
  createValidationError,
  createAuthError,
  createNotFoundError,
  createConflictError
};