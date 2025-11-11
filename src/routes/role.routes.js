// ===================================================================
// PROSPERPOS - RUTAS DE ROLES
// ===================================================================

const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');
const { sendSuccessResponse } = require('../utils/response');

// ===================================================================
// MIDDLEWARE GLOBAL PARA TODAS LAS RUTAS
// ===================================================================

// Autenticación requerida para todas las rutas
router.use(authenticateToken);

// ===================================================================
// RUTAS PRINCIPALES
// ===================================================================

/**
 * @route   GET /api/v1/roles/stats
 * @desc    Obtener estadísticas de roles
 * @access  Private (roles.read permission)
 */
router.get('/stats', 
  requirePermission('roles.read'),
  roleController.getRoleStats
);

/**
 * @route   GET /api/v1/roles/active
 * @desc    Listar todos los roles activos (para dropdowns)
 * @access  Private (roles.read permission)
 */
router.get('/active', 
  requirePermission('roles.read'),
  roleController.getActiveRoles
);

/**
 * @route   GET /api/v1/roles
 * @desc    Listar roles con filtros y paginación
 * @access  Private (roles.read permission)
 */
router.get('/', 
  requirePermission('roles.read'),
  roleController.getRoles
);

/**
 * @route   GET /api/v1/roles/:id
 * @desc    Obtener rol específico por ID
 * @access  Private (roles.read permission)
 */
router.get('/:id', 
  requirePermission('roles.read'),
  roleController.getRoleById
);

/**
 * @route   POST /api/v1/roles
 * @desc    Crear nuevo rol
 * @access  Private (roles.create permission)
 */
router.post('/', 
  requirePermission('roles.create'),
  roleController.createRole
);

/**
 * @route   PUT /api/v1/roles/:id
 * @desc    Actualizar rol
 * @access  Private (roles.update permission)
 */
router.put('/:id', 
  requirePermission('roles.update'),
  roleController.updateRole
);

/**
 * @route   DELETE /api/v1/roles/:id
 * @desc    Eliminar rol (soft delete)
 * @access  Private (roles.delete permission)
 */
router.delete('/:id', 
  requirePermission('roles.delete'),
  roleController.deleteRole
);

/**
 * @route   GET /api/v1/roles/:id/permissions
 * @desc    Obtener permisos asignados al rol
 * @access  Private (roles.read permission)
 */
router.get('/:id/permissions', 
  requirePermission('roles.read'),
  roleController.getRolePermissions
);

/**
 * @route   PUT /api/v1/roles/:id/permissions
 * @desc    Asignar permisos al rol
 * @access  Private (roles.assign_permissions permission)
 */
router.put('/:id/permissions', 
  requirePermission('roles.assign_permissions'),
  roleController.assignPermissions
);

/**
 * @route   GET /api/v1/roles/:id/modules
 * @desc    Obtener módulos con permisos (para UI de asignación)
 * @access  Private (roles.read permission)
 */
router.get('/:id/modules', 
  requirePermission('roles.read'),
  roleController.getModulesWithPermissions
);

/**
 * @route   GET /api/v1/roles/:id/users
 * @desc    Obtener usuarios asignados al rol
 * @access  Private (roles.read permission)
 */
router.get('/:id/users', 
  requirePermission('roles.read'),
  roleController.getRoleUsers
);

/**
 * @route   POST /api/v1/roles/:id/duplicate
 * @desc    Duplicar un rol con sus permisos
 * @access  Private (roles.create permission)
 */
router.post('/:id/duplicate', 
  requirePermission('roles.create'),
  roleController.duplicateRole
);

// ===================================================================
// RUTA DE DOCUMENTACIÓN
// ===================================================================

/**
 * @route   GET /api/v1/roles/docs/endpoints
 * @desc    Documentación de endpoints de roles
 * @access  Private
 */
router.get('/docs/endpoints', (req, res) => {
  return sendSuccessResponse(res, {
    endpoints: {
      'GET /api/v1/roles': 'Listar roles con filtros',
      'GET /api/v1/roles/active': 'Listar roles activos',
      'GET /api/v1/roles/stats': 'Estadísticas de roles',
      'GET /api/v1/roles/:id': 'Obtener rol por ID',
      'POST /api/v1/roles': 'Crear nuevo rol',
      'PUT /api/v1/roles/:id': 'Actualizar rol',
      'DELETE /api/v1/roles/:id': 'Eliminar rol',
      'GET /api/v1/roles/:id/permissions': 'Obtener permisos del rol',
      'PUT /api/v1/roles/:id/permissions': 'Asignar permisos al rol',
      'GET /api/v1/roles/:id/modules': 'Obtener módulos con permisos',
      'GET /api/v1/roles/:id/users': 'Obtener usuarios del rol',
      'POST /api/v1/roles/:id/duplicate': 'Duplicar rol'
    }
  }, 'Documentación de roles');
});

module.exports = router;