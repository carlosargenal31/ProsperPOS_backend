// ===================================================================
// PROSPERPOS - UTILIDADES DE RESPUESTA
// ===================================================================

const logger = require('./logger');

// ===================================================================
// RESPUESTAS DE ÉXITO
// ===================================================================

/**
 * Respuesta de éxito estándar
 */
const sendSuccessResponse = (res, data = null, message = 'Operación exitosa', statusCode = 200) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Respuesta de éxito con paginación
 */
const sendPaginatedResponse = (res, data, pagination, message = 'Datos obtenidos exitosamente') => {
  const response = {
    success: true,
    message,
    data,
    pagination: {
      currentPage: pagination.page || 1,
      perPage: pagination.limit || 10,
      totalRecords: pagination.total || 0,
      totalPages: Math.ceil((pagination.total || 0) / (pagination.limit || 10)),
      hasNextPage: (pagination.page || 1) < Math.ceil((pagination.total || 0) / (pagination.limit || 10)),
      hasPrevPage: (pagination.page || 1) > 1
    },
    timestamp: new Date().toISOString()
  };

  // Agregar headers de paginación
  res.set({
    'X-Total-Count': pagination.total || 0,
    'X-Page-Count': Math.ceil((pagination.total || 0) / (pagination.limit || 10)),
    'X-Current-Page': pagination.page || 1,
    'X-Per-Page': pagination.limit || 10
  });

  return res.status(200).json(response);
};

/**
 * Respuesta de creación exitosa
 */
const sendCreatedResponse = (res, data, message = 'Recurso creado exitosamente') => {
  return sendSuccessResponse(res, data, message, 201);
};

/**
 * Respuesta de actualización exitosa
 */
const sendUpdatedResponse = (res, data = null, message = 'Recurso actualizado exitosamente') => {
  return sendSuccessResponse(res, data, message, 200);
};

/**
 * Respuesta de eliminación exitosa
 */
const sendDeletedResponse = (res, message = 'Recurso eliminado exitosamente') => {
  return sendSuccessResponse(res, null, message, 200);
};

// ===================================================================
// RESPUESTAS DE ERROR
// ===================================================================

/**
 * Respuesta de error estándar
 */
const sendErrorResponse = (res, statusCode = 500, message = 'Error interno del servidor', errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errors) {
    response.errors = errors;
  }

  // Log del error dependiendo del tipo
  if (statusCode >= 500) {
    logger.error('Server Error Response', {
      statusCode,
      message,
      errors
    });
  } else if (statusCode >= 400) {
    logger.warn('Client Error Response', {
      statusCode,
      message,
      errors
    });
  }

  return res.status(statusCode).json(response);
};

/**
 * Respuesta de error de validación
 */
const sendValidationErrorResponse = (res, errors, message = 'Errores de validación') => {
  return sendErrorResponse(res, 400, message, errors);
};

/**
 * Respuesta de error de autenticación
 */
const sendAuthErrorResponse = (res, message = 'No autorizado') => {
  return sendErrorResponse(res, 401, message);
};

/**
 * Respuesta de error de autorización
 */
const sendForbiddenResponse = (res, message = 'Acceso denegado') => {
  return sendErrorResponse(res, 403, message);
};

/**
 * Respuesta de recurso no encontrado
 */
const sendNotFoundResponse = (res, message = 'Recurso no encontrado') => {
  return sendErrorResponse(res, 404, message);
};

/**
 * Respuesta de conflicto
 */
const sendConflictResponse = (res, message = 'Conflicto con el estado actual del recurso') => {
  return sendErrorResponse(res, 409, message);
};

/**
 * Respuesta de error de rate limit
 */
const sendRateLimitResponse = (res, message = 'Demasiadas solicitudes') => {
  return sendErrorResponse(res, 429, message);
};

// ===================================================================
// UTILIDADES ADICIONALES
// ===================================================================

/**
 * Formatear errores de validación de Joi
 */
const formatJoiErrors = (joiError) => {
  return joiError.details.map(detail => ({
    field: detail.path.join('.'),
    message: detail.message,
    value: detail.context?.value
  }));
};

/**
 * Formatear errores de validación de express-validator
 */
const formatExpressValidatorErrors = (errors) => {
  return errors.map(error => ({
    field: error.param,
    message: error.msg,
    value: error.value,
    location: error.location
  }));
};

/**
 * Respuesta de error de base de datos
 */
const sendDatabaseErrorResponse = (res, error) => {
  logger.error('Database Error', {
    error: error.message,
    code: error.code,
    errno: error.errno,
    sqlState: error.sqlState,
    sqlMessage: error.sqlMessage
  });

  // Errores específicos de MySQL
  switch (error.code) {
    case 'ER_DUP_ENTRY':
      return sendConflictResponse(res, 'El registro ya existe');
    
    case 'ER_NO_REFERENCED_ROW_2':
      return sendValidationErrorResponse(res, null, 'Referencia inválida a otro registro');
    
    case 'ER_ROW_IS_REFERENCED_2':
      return sendConflictResponse(res, 'No se puede eliminar: existen registros relacionados');
    
    case 'ER_BAD_NULL_ERROR':
      return sendValidationErrorResponse(res, null, 'Campo requerido faltante');
    
    case 'ER_DATA_TOO_LONG':
      return sendValidationErrorResponse(res, null, 'Datos demasiado largos para el campo');
    
    case 'ECONNREFUSED':
      return sendErrorResponse(res, 503, 'Servicio de base de datos no disponible');
    
    default:
      return sendErrorResponse(res, 500, 'Error de base de datos');
  }
};

/**
 * Wrapper para manejo de errores async
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Generar ID de request único
 */
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Middleware para agregar ID de request
 */
const addRequestId = (req, res, next) => {
  req.requestId = generateRequestId();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

// ===================================================================
// EXPORTAR FUNCIONES
// ===================================================================
/**
 * Crear respuesta estándar
 */
const createResponse = (success, message, data = null) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return response;
};

module.exports = {
  // Respuestas de éxito
  createResponse,
  sendSuccessResponse,
  sendPaginatedResponse,
  sendCreatedResponse,
  sendUpdatedResponse,
  sendDeletedResponse,
  
  // Respuestas de error
  sendErrorResponse,
  sendValidationErrorResponse,
  sendAuthErrorResponse,
  sendForbiddenResponse,
  sendNotFoundResponse,
  sendConflictResponse,
  sendRateLimitResponse,
  sendDatabaseErrorResponse,
  
  // Utilidades
  formatJoiErrors,
  formatExpressValidatorErrors,
  asyncHandler,
  addRequestId,
  generateRequestId
};