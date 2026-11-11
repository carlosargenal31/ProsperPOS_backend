// ===================================================================
// PROSPERPOS - MIDDLEWARE DE AUTENTICACIÓN (CORREGIDO)
// ===================================================================

const jwt = require('jsonwebtoken');
const db = require('../utils/database');
const logger = require('../utils/logger');
const { sendErrorResponse } = require('../utils/response');

// ===================================================================
// MIDDLEWARE DE AUTENTICACIÓN JWT
// ===================================================================

/**
 * Verificar token JWT y cargar usuario
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (logger.security) {
        logger.security('MISSING_TOKEN', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.originalUrl
        });
      }
      
      return sendErrorResponse(res, 401, 'Token de acceso requerido');
    }

    const token = authHeader.substring(7); // Remover 'Bearer '

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'prosperpos_secret_key');
    
    // Buscar usuario en la base de datos
    const userQuery = `
      SELECT
        u.id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.is_active,
        u.store_id,
        s.name as store_name,
        GROUP_CONCAT(DISTINCT r.slug) as roles,
        GROUP_CONCAT(DISTINCT p.name) as permissions
      FROM users u
      LEFT JOIN stores s ON u.store_id = s.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = ? AND u.is_active = true
      GROUP BY u.id
    `;

    const users = await db.query(userQuery, [decoded.userId || decoded.id]);

    if (users.length === 0) {
      if (logger.security) {
        logger.security('INVALID_USER', {
          userId: decoded.userId || decoded.id,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }
      
      return sendErrorResponse(res, 401, 'Usuario no válido o inactivo');
    }

    const user = users[0];
    
    // Preparar datos del usuario
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      fullName: `${user.first_name} ${user.last_name}`,
      store_id: user.store_id, // Mantener snake_case para compatibilidad
      storeId: user.store_id,
      storeName: user.store_name,
      roles: user.roles ? user.roles.split(',') : [],
      permissions: user.permissions ? user.permissions.split(',') : []
    };

    // Verificar expiración del token
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      if (logger.security) {
        logger.security('EXPIRED_TOKEN', {
          userId: user.id,
          ip: req.ip
        });
      }
      
      return sendErrorResponse(res, 401, 'Token expirado');
    }

    // Log de actividad exitosa
    if (logger.userActivity) {
      logger.userActivity(user.id, 'API_ACCESS', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip
      });
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      if (logger.security) {
        logger.security('INVALID_TOKEN', {
          error: error.message,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }
      
      return sendErrorResponse(res, 401, 'Token inválido');
    }
    
    if (error.name === 'TokenExpiredError') {
      if (logger.security) {
        logger.security('EXPIRED_TOKEN', {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }
      
      return sendErrorResponse(res, 401, 'Token expirado');
    }

    logger.error('Error en middleware de autenticación:', error);
    return sendErrorResponse(res, 500, 'Error interno del servidor');
  }
};

// ===================================================================
// MIDDLEWARE DE AUTORIZACIÓN POR PERMISOS
// ===================================================================

/**
 * Verificar si el usuario tiene un permiso específico
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendErrorResponse(res, 401, 'Usuario no autenticado');
    }

    // Si es super admin, permitir todo
    if (req.user.roles && (req.user.roles.includes('super_admin') || req.user.roles.includes('admin'))) {
      return next();
    }

    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      if (logger.security) {
        logger.security('PERMISSION_DENIED', {
          userId: req.user.id,
          requiredPermission: permission,
          userPermissions: req.user.permissions,
          url: req.originalUrl
        });
      }
      
      return sendErrorResponse(res, 403, `Permiso requerido: ${permission}`);
    }

    next();
  };
};

/**
 * Verificar si el usuario tiene al menos uno de los permisos especificados
 */
const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendErrorResponse(res, 401, 'Usuario no autenticado');
    }

    // Si es super admin, permitir todo
    if (req.user.roles && (req.user.roles.includes('super_admin') || req.user.roles.includes('admin'))) {
      return next();
    }

    const hasPermission = permissions.some(permission => 
      req.user.permissions && req.user.permissions.includes(permission)
    );

    if (!hasPermission) {
      if (logger.security) {
        logger.security('PERMISSION_DENIED', {
          userId: req.user.id,
          requiredPermissions: permissions,
          userPermissions: req.user.permissions,
          url: req.originalUrl
        });
      }
      
      return sendErrorResponse(res, 403, 'No tienes permisos suficientes');
    }

    next();
  };
};

/**
 * Verificar si el usuario tiene un rol específico
 */
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendErrorResponse(res, 401, 'Usuario no autenticado');
    }

    if (!req.user.roles || !req.user.roles.includes(role)) {
      if (logger.security) {
        logger.security('ROLE_DENIED', {
          userId: req.user.id,
          requiredRole: role,
          userRoles: req.user.roles,
          url: req.originalUrl
        });
      }
      
      return sendErrorResponse(res, 403, `Rol requerido: ${role}`);
    }

    next();
  };
};

/**
 * Verificar si el usuario pertenece a la misma tienda o es administrador
 */
const requireSameStoreOrAdmin = (req, res, next) => {
  if (!req.user) {
    return sendErrorResponse(res, 401, 'Usuario no autenticado');
  }

  // Los administradores pueden acceder a cualquier tienda
  if (req.user.roles && (req.user.roles.includes('admin') || req.user.roles.includes('super_admin'))) {
    return next();
  }

  // Verificar si el recurso pertenece a la misma tienda
  const resourceStoreId = req.params.storeId || req.body.store_id || req.query.store_id;
  
  if (resourceStoreId && parseInt(resourceStoreId) !== req.user.storeId) {
    if (logger.security) {
      logger.security('STORE_ACCESS_DENIED', {
        userId: req.user.id,
        userStoreId: req.user.storeId,
        requestedStoreId: resourceStoreId,
        url: req.originalUrl
      });
    }
    
    return sendErrorResponse(res, 403, 'Acceso denegado: tienda diferente');
  }

  next();
};

/**
 * Middleware opcional de autenticación (no falla si no hay token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    // Usar el middleware normal de autenticación
    await authenticateToken(req, res, next);
  } catch (error) {
    // En caso de error, continuar sin autenticación
    next();
  }
};

// ===================================================================
// EXPORTAR MIDDLEWARES (NOMBRES CORREGIDOS)
// ===================================================================

module.exports = {
  authenticateToken,    // Cambiar de authMiddleware a authenticateToken
  authMiddleware: authenticateToken, // Mantener alias por compatibilidad
  requirePermission,
  requireAnyPermission,
  requireRole,
  requireSameStoreOrAdmin,
  optionalAuth
};