// ===================================================================
// PROSPERPOS - RUTAS DE USUARIOS (CORREGIDO)
// ===================================================================

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');

// ===================================================================
// MIDDLEWARE GLOBAL PARA TODAS LAS RUTAS
// ===================================================================

// Autenticación requerida para todas las rutas
router.use(authenticateToken);

// ===================================================================
// RUTAS PRINCIPALES
// ===================================================================

/**
 * @route   GET /api/v1/users/me
 * @desc    Obtener perfil del usuario actual
 * @access  Private
 */
router.get('/me', userController.getMyProfile);

/**
 * @route   PUT /api/v1/users/me
 * @desc    Actualizar perfil del usuario actual
 * @access  Private
 */
router.put('/me', userController.updateMyProfile);

/**
 * @route   GET /api/v1/users/stats
 * @desc    Obtener estadísticas de usuarios
 * @access  Private (view_user_stats permission)
 */
router.get('/stats', 
  requirePermission('users.read'),
  userController.getUserStats
);

/**
 * @route   GET /api/v1/users
 * @desc    Listar usuarios con filtros y paginación
 * @access  Private (view_users permission)
 */
router.get('/', 
  requirePermission('users.read'),
  userController.getUsers
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Obtener usuario específico por ID
 * @access  Private (view_users permission)
 */
router.get('/:id', 
  requirePermission('users.read'),
  userController.getUserById
);

/**
 * @route   POST /api/v1/users
 * @desc    Crear nuevo usuario
 * @access  Private (create_user permission)
 */
router.post('/', 
  requirePermission('users.create'),
  userController.createUser
);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Actualizar usuario
 * @access  Private (update_user permission)
 */
router.put('/:id', 
  requirePermission('users.update'),
  userController.updateUser
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Eliminar usuario (soft delete)
 * @access  Private (delete_user permission)
 */
router.delete('/:id', 
  requirePermission('users.delete'),
  userController.deleteUser
);

/**
 * @route   PATCH /api/v1/users/:id/status
 * @desc    Cambiar estado de usuario
 * @access  Private (change_user_status permission)
 */
router.patch('/:id/status', 
  requirePermission('users.update'),
  userController.changeUserStatus
);

/**
 * @route   PATCH /api/v1/users/:id/password
 * @desc    Cambiar contraseña de usuario
 * @access  Private (change_user_password permission)
 */
router.patch('/:id/password', 
  requirePermission('users.update'),
  userController.changeUserPassword
);

// ===================================================================
// RUTA DE DOCUMENTACIÓN
// ===================================================================

/**
 * @route   GET /api/v1/users/docs/endpoints
 * @desc    Documentación de endpoints de usuarios
 * @access  Private
 */
router.get('/docs/endpoints', (req, res) => {
  return sendSuccessResponse(res, {
    endpoints: {
      'GET /api/v1/users': 'Listar usuarios con filtros',
      'GET /api/v1/users/:id': 'Obtener usuario por ID',
      'POST /api/v1/users': 'Crear nuevo usuario',
      'PUT /api/v1/users/:id': 'Actualizar usuario',
      'DELETE /api/v1/users/:id': 'Eliminar usuario',
      'PATCH /api/v1/users/:id/status': 'Cambiar estado',
      'PATCH /api/v1/users/:id/password': 'Cambiar contraseña',
      'GET /api/v1/users/me': 'Perfil actual',
      'PUT /api/v1/users/me': 'Actualizar perfil actual',
      'GET /api/v1/users/stats': 'Estadísticas de usuarios'
    }
  }, 'Documentación de usuarios');
});

module.exports = router;