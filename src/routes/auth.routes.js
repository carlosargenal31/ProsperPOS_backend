// ===================================================================
// PROSPERPOS - RUTAS DE AUTENTICACIÓN
// ===================================================================

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { validateLogin, validateRegister, validateChangePassword } = require('../middleware/validation.middleware');

// ===================================================================
// RUTAS PÚBLICAS (Sin autenticación)
// ===================================================================

/**
 * @route   POST /api/v1/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post('/login', validateLogin, AuthController.login);

/**
 * @route   POST /api/v1/auth/google
 * @desc    Iniciar sesión con Google OAuth (ID Token)
 * @access  Public
 */
router.post('/google', AuthController.googleLogin);

/**
 * @route   POST /api/v1/auth/google-oauth
 * @desc    Iniciar sesión con Google OAuth (Access Token)
 * @access  Public
 */
router.post('/google-oauth', AuthController.googleOAuthLogin);

/**
 * @route   POST /api/v1/auth/register
 * @desc    Registrar nuevo usuario (solo si está habilitado)
 * @access  Public (puede ser restringido)
 */
router.post('/register', validateRegister, AuthController.register);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Solicitar reseteo de contraseña
 * @access  Public
 */
router.post('/forgot-password', AuthController.forgotPassword);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Resetear contraseña con token
 * @access  Public
 */
router.post('/reset-password', AuthController.resetPassword);

/**
 * @route   POST /api/v1/auth/verify-token
 * @desc    Verificar si un token es válido
 * @access  Public
 */
router.post('/verify-token', AuthController.verifyToken);

// ===================================================================
// RUTAS PROTEGIDAS (Requieren autenticación)
// ===================================================================

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Cerrar sesión
 * @access  Private
 */
router.post('/logout', authenticateToken, AuthController.logout);

/**
 * @route   POST /api/v1/auth/logout-all
 * @desc    Cerrar todas las sesiones del usuario
 * @access  Private
 */
router.post('/logout-all', authenticateToken, AuthController.logoutAll);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Obtener información del usuario autenticado
 * @access  Private
 */
router.get('/me', authenticateToken, AuthController.getCurrentUser);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Actualizar perfil del usuario
 * @access  Private
 */
router.put('/profile', authenticateToken, AuthController.updateProfile);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Cambiar contraseña
 * @access  Private
 */
router.post('/change-password', authenticateToken, validateChangePassword, AuthController.changePassword);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refrescar token de acceso
 * @access  Private
 */
router.post('/refresh', authenticateToken, AuthController.refreshToken);

/**
 * @route   GET /api/v1/auth/sessions
 * @desc    Obtener sesiones activas del usuario
 * @access  Private
 */
router.get('/sessions', authenticateToken, AuthController.getActiveSessions);

/**
 * @route   DELETE /api/v1/auth/sessions/:sessionId
 * @desc    Cerrar una sesión específica
 * @access  Private
 */
router.delete('/sessions/:sessionId', authenticateToken, AuthController.closeSession);

/**
 * @route   GET /api/v1/auth/permissions
 * @desc    Obtener permisos del usuario actual
 * @access  Private
 */
router.get('/permissions', authenticateToken, AuthController.getUserPermissions);

// ===================================================================
// RUTAS DE DESARROLLO (Solo en desarrollo)
// ===================================================================

if (process.env.NODE_ENV === 'development') {
  /**
   * @route   POST /api/v1/auth/dev-token
   * @desc    Generar token de prueba para desarrollo
   * @access  Development only
   */
  router.post('/dev-token', AuthController.generateDevToken);
}

module.exports = router;