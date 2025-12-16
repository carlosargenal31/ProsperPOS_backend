// ===================================================================
// PROSPERPOS - MIDDLEWARE DE AUTENTICACIÓN E-COMMERCE
// ===================================================================

const jwt = require('jsonwebtoken');
const { logError } = require('../utils/logger');

/**
 * Middleware para verificar token JWT de clientes web
 */
const verifyCustomerToken = (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    const token = authHeader.substring(7); // Remover 'Bearer '

    // Verificar token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'prosperpos-secret-key'
    );

    // Verificar que es un token de cliente web
    if (decoded.type !== 'web_customer') {
      return res.status(403).json({
        success: false,
        message: 'Token inválido para esta operación'
      });
    }

    // Agregar información del cliente a la request
    req.customer = {
      id: decoded.id,
      email: decoded.email
    };

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    logError('Error in verifyCustomerToken:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al verificar token'
    });
  }
};

/**
 * Middleware opcional de autenticación (no falla si no hay token)
 */
const optionalCustomerAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No hay token, continuar sin autenticar
      req.customer = null;
      return next();
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'prosperpos-secret-key'
    );

    if (decoded.type === 'web_customer') {
      req.customer = {
        id: decoded.id,
        email: decoded.email
      };
    } else {
      req.customer = null;
    }

    next();

  } catch (error) {
    // Si hay error, simplemente continuar sin autenticar
    req.customer = null;
    next();
  }
};

module.exports = {
  verifyCustomerToken,
  optionalCustomerAuth
};
