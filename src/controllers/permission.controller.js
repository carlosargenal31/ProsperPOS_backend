// ===================================================================
// PROSPERPOS - CONTROLADOR DE PERMISOS
// ===================================================================

const PermissionService = require('../services/permission.service');
const { createResponse } = require('../utils/response');
const { catchAsync, ValidationError, NotFoundError } = require('../middleware/error.middleware');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

// ===================================================================
// LISTAR PERMISOS
// ===================================================================

const getPermissions = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    search = '',
    module = '',
    status = '',
    sortBy = 'module',
    sortOrder = 'ASC'
  } = req.query;

  logger.info('Listando permisos', {
    userId: req.user.id,
    filters: { search, module, status },
    pagination: { page, limit }
  });

  const result = await PermissionService.getPermissions({
    page: parseInt(page),
    limit: parseInt(limit),
    search,
    module,
    status,
    sortBy,
    sortOrder
  });

  res.json(createResponse(
    true,
    'Permisos obtenidos correctamente',
    result.data,
    {
      pagination: result.pagination,
      filters: { search, module, status }
    }
  ));
});

// ===================================================================
// OBTENER PERMISO POR ID
// ===================================================================

const getPermissionById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const includeRoleCount = req.query.include_role_count === 'true';

  logger.info('Obteniendo permiso por ID', {
    userId: req.user.id,
    permissionId: id,
    includes: { roleCount: includeRoleCount }
  });

  const permission = await PermissionService.getPermissionById(id, {
    includeRoleCount
  });

  if (!permission) {
    throw new NotFoundError('Permiso no encontrado');
  }

  res.json(createResponse(
    true,
    'Permiso obtenido correctamente',
    permission
  ));
});

// ===================================================================
// CREAR PERMISO
// ===================================================================

const createPermission = catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Datos de entrada inválidos', errors.array());
  }

  const permissionData = req.body;

  logger.info('Creando nuevo permiso', {
    userId: req.user.id,
    permissionName: permissionData.name,
    permissionSlug: permissionData.slug,
    module: permissionData.module
  });

  const newPermission = await PermissionService.createPermission(permissionData);

  logger.info('Permiso creado exitosamente', {
    userId: req.user.id,
    permissionId: newPermission.id,
    permissionName: newPermission.name
  });

  res.status(201).json(createResponse(
    true,
    'Permiso creado correctamente',
    newPermission
  ));
});

// ===================================================================
// ACTUALIZAR PERMISO
// ===================================================================

const updatePermission = catchAsync(async (req, res) => {
  const { id } = req.params;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Datos de entrada inválidos', errors.array());
  }

  const updateData = req.body;

  logger.info('Actualizando permiso', {
    userId: req.user.id,
    permissionId: id,
    fieldsToUpdate: Object.keys(updateData)
  });

  const updatedPermission = await PermissionService.updatePermission(id, updateData);

  logger.info('Permiso actualizado exitosamente', {
    userId: req.user.id,
    permissionId: id
  });

  res.json(createResponse(
    true,
    'Permiso actualizado correctamente',
    updatedPermission
  ));
});

// ===================================================================
// ELIMINAR PERMISO
// ===================================================================

const deletePermission = catchAsync(async (req, res) => {
  const { id } = req.params;

  logger.info('Eliminando permiso', {
    userId: req.user.id,
    permissionId: id
  });

  await PermissionService.deletePermission(id);

  logger.info('Permiso eliminado exitosamente', {
    userId: req.user.id,
    permissionId: id
  });

  res.json(createResponse(
    true,
    'Permiso eliminado correctamente'
  ));
});

// ===================================================================
// OBTENER ROLES CON ESTE PERMISO
// ===================================================================

const getPermissionRoles = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  logger.info('Obteniendo roles del permiso', {
    userId: req.user.id,
    permissionId: id
  });

  const roles = await PermissionService.getPermissionRoles(id, {
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json(createResponse(
    true,
    'Roles obtenidos correctamente',
    roles
  ));
});

// ===================================================================
// OBTENER ESTADÍSTICAS
// ===================================================================

const getPermissionStats = catchAsync(async (req, res) => {
  logger.info('Obteniendo estadísticas de permisos', {
    userId: req.user.id
  });

  const stats = await PermissionService.getPermissionStats();

  res.json(createResponse(
    true,
    'Estadísticas obtenidas correctamente',
    stats
  ));
});

// ===================================================================
// OBTENER PERMISOS POR MÓDULO
// ===================================================================

const getPermissionsByModule = catchAsync(async (req, res) => {
  const { module } = req.params;

  logger.info('Obteniendo permisos por módulo', {
    userId: req.user.id,
    module
  });

  const permissions = await PermissionService.getPermissionsByModule(module);

  res.json(createResponse(
    true,
    'Permisos obtenidos correctamente',
    permissions
  ));
});

// ===================================================================
// OBTENER TODOS LOS MÓDULOS
// ===================================================================

const getAllModules = catchAsync(async (req, res) => {
  logger.info('Obteniendo todos los módulos', {
    userId: req.user.id
  });

  const modules = await PermissionService.getAllModules();

  res.json(createResponse(
    true,
    'Módulos obtenidos correctamente',
    modules
  ));
});

// ===================================================================
// LISTAR PERMISOS ACTIVOS (PARA DROPDOWNS)
// ===================================================================

const getActivePermissions = catchAsync(async (req, res) => {
  logger.info('Obteniendo permisos activos', {
    userId: req.user.id
  });

  const permissions = await PermissionService.getAllActivePermissions();

  res.json(createResponse(
    true,
    'Permisos activos obtenidos correctamente',
    permissions
  ));
});

// ===================================================================
// OBTENER PERMISOS AGRUPADOS POR MÓDULO
// ===================================================================

const getPermissionsGrouped = catchAsync(async (req, res) => {
  logger.info('Obteniendo permisos agrupados por módulo', {
    userId: req.user.id
  });

  const modules = await PermissionService.getPermissionsGroupedByModule();

  res.json(createResponse(
    true,
    'Permisos agrupados obtenidos correctamente',
    modules
  ));
});

// ===================================================================
// IMPORTAR PERMISOS
// ===================================================================

const importPermissions = catchAsync(async (req, res) => {
  const { permissions } = req.body;

  if (!Array.isArray(permissions)) {
    throw new ValidationError('permissions debe ser un arreglo');
  }

  logger.info('Importando permisos', {
    userId: req.user.id,
    permissionCount: permissions.length
  });

  const result = await PermissionService.importPermissions(permissions);

  logger.info('Importación completada', {
    userId: req.user.id,
    result
  });

  res.json(createResponse(
    true,
    'Permisos importados correctamente',
    result
  ));
});

// ===================================================================
// EXPORTACIONES
// ===================================================================

module.exports = {
  getPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
  getPermissionRoles,
  getPermissionStats,
  getPermissionsByModule,
  getAllModules,
  getActivePermissions,
  getPermissionsGrouped,
  importPermissions
};