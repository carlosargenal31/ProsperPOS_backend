// ===================================================================
// PROSPERPOS - RUTAS DE PERMISOS
// ===================================================================

const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permission.controller');
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
 * @route   GET /api/v1/permissions/stats
 * @desc    Obtener estadísticas de permisos
 * @access  Private (roles.read permission)
 */
router.get('/stats', 
  requirePermission('roles.read'),
  permissionController.getPermissionStats
);

/**
 * @route   GET /api/v1/permissions/modules
 * @desc    Obtener todos los módulos
 * @access  Private (roles.read permission)
 */
router.get('/modules', 
  requirePermission('roles.read'),
  permissionController.getAllModules
);

/**
 * @route   GET /api/v1/permissions/active
 * @desc    Listar todos los permisos activos (para dropdowns)
 * @access  Private (roles.read permission)
 */
router.get('/active', 
  requirePermission('roles.read'),
  permissionController.getActivePermissions
);

/**
 * @route   GET /api/v1/permissions/grouped
 * @desc    Obtener permisos agrupados por módulo
 * @access  Private (roles.read permission)
 */
router.get('/grouped', 
  requirePermission('roles.read'),
  permissionController.getPermissionsGrouped
);

/**
 * @route   GET /api/v1/permissions
 * @desc    Listar permisos con filtros y paginación
 * @access  Private (roles.read permission)
 */
router.get('/', 
  requirePermission('roles.read'),
  permissionController.getPermissions
);

/**
 * @route   GET /api/v1/permissions/:id
 * @desc    Obtener permiso específico por ID
 * @access  Private (roles.read permission)
 */
router.get('/:id', 
  requirePermission('roles.read'),
  permissionController.getPermissionById
);

/**
 * @route   POST /api/v1/permissions
 * @desc    Crear nuevo permiso
 * @access  Private (roles.create permission)
 */
router.post('/', 
  requirePermission('roles.create'),
  permissionController.createPermission
);

/**
 * @route   PUT /api/v1/permissions/:id
 * @desc    Actualizar permiso
 * @access  Private (roles.update permission)
 */
router.put('/:id', 
  requirePermission('roles.update'),
  permissionController.updatePermission
);

/**
 * @route   DELETE /api/v1/permissions/:id
 * @desc    Eliminar permiso (soft delete)
 * @access  Private (roles.delete permission)
 */
router.delete('/:id', 
  requirePermission('roles.delete'),
  permissionController.deletePermission
);

/**
 * @route   GET /api/v1/permissions/:id/roles
 * @desc    Obtener roles que tienen este permiso
 * @access  Private (roles.read permission)
 */
router.get('/:id/roles', 
  requirePermission('roles.read'),
  permissionController.getPermissionRoles
);

/**
 * @route   GET /api/v1/permissions/module/:module
 * @desc    Obtener permisos de un módulo específico
 * @access  Private (roles.read permission)
 */
router.get('/module/:module', 
  requirePermission('roles.read'),
  permissionController.getPermissionsByModule
);

/**
 * @route   POST /api/v1/permissions/import
 * @desc    Importar múltiples permisos
 * @access  Private (roles.create permission)
 */
router.post('/import', 
  requirePermission('roles.create'),
  permissionController.importPermissions
);

// ===================================================================
// RUTA DE DOCUMENTACIÓN
// ===================================================================

/**
 * @route   GET /api/v1/permissions/docs/endpoints
 * @desc    Documentación de endpoints de permisos
 * @access  Private
 */
router.get('/docs/endpoints', (req, res) => {
  return sendSuccessResponse(res, {
    endpoints: {
      'GET /api/v1/permissions': 'Listar permisos con filtros',
      'GET /api/v1/permissions/active': 'Listar permisos activos',
      'GET /api/v1/permissions/grouped': 'Permisos agrupados por módulo',
      'GET /api/v1/permissions/modules': 'Listar todos los módulos',
      'GET /api/v1/permissions/stats': 'Estadísticas de permisos',
      'GET /api/v1/permissions/:id': 'Obtener permiso por ID',
      'POST /api/v1/permissions': 'Crear nuevo permiso',
      'PUT /api/v1/permissions/:id': 'Actualizar permiso',
      'DELETE /api/v1/permissions/:id': 'Eliminar permiso',
      'GET /api/v1/permissions/:id/roles': 'Obtener roles del permiso',
      'GET /api/v1/permissions/module/:module': 'Permisos por módulo',
      'POST /api/v1/permissions/import': 'Importar permisos'
    }
  }, 'Documentación de permisos');
});

module.exports = router;