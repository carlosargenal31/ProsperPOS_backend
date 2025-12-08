// ===================================================================
// PROSPERPOS - CONTROLADOR DE ROLES
// ===================================================================

const RoleService = require('../services/role.service');
const { createResponse } = require('../utils/response');
const { catchAsync, ValidationError, NotFoundError } = require('../middleware/error.middleware');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

// ===================================================================
// LISTAR ROLES
// ===================================================================

const getRoles = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status = '',
    sortBy = 'name',
    sortOrder = 'ASC'
  } = req.query;

  logger.info('Listando roles', {
    userId: req.user.id,
    filters: { search, status },
    pagination: { page, limit }
  });

  const result = await RoleService.getRoles({
    page: parseInt(page),
    limit: parseInt(limit),
    search,
    status,
    sortBy,
    sortOrder
  });

  res.json(createResponse(
    true,
    'Roles obtenidos correctamente',
    {
      data: result.data,
      pagination: result.pagination,
      filters: { search, status }
    }
  ));
});

// ===================================================================
// OBTENER ROL POR ID
// ===================================================================

const getRoleById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const includePermissions = req.query.include_permissions === 'true';
  const includeUserCount = req.query.include_user_count === 'true';

  logger.info('Obteniendo rol por ID', {
    userId: req.user.id,
    roleId: id,
    includes: { permissions: includePermissions, userCount: includeUserCount }
  });

  const role = await RoleService.getRoleById(id, {
    includePermissions,
    includeUserCount
  });

  if (!role) {
    throw new NotFoundError('Rol no encontrado');
  }

  res.json(createResponse(
    true,
    'Rol obtenido correctamente',
    role
  ));
});

// ===================================================================
// CREAR ROL
// ===================================================================

const createRole = catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Datos de entrada inválidos', errors.array());
  }

  const roleData = {
    ...req.body,
    created_by: req.user.id
  };

  logger.info('Creando nuevo rol', {
    userId: req.user.id,
    roleName: roleData.name,
    roleSlug: roleData.slug
  });

  const newRole = await RoleService.createRole(roleData);

  logger.info('Rol creado exitosamente', {
    userId: req.user.id,
    roleId: newRole.id,
    roleName: newRole.name
  });

  res.status(201).json(createResponse(
    true,
    'Rol creado correctamente',
    newRole
  ));
});

// ===================================================================
// ACTUALIZAR ROL
// ===================================================================

const updateRole = catchAsync(async (req, res) => {
  const { id } = req.params;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Datos de entrada inválidos', errors.array());
  }

  const updateData = {
    ...req.body,
    updated_by: req.user.id
  };

  logger.info('Actualizando rol', {
    userId: req.user.id,
    roleId: id,
    fieldsToUpdate: Object.keys(updateData)
  });

  const updatedRole = await RoleService.updateRole(id, updateData);

  logger.info('Rol actualizado exitosamente', {
    userId: req.user.id,
    roleId: id
  });

  res.json(createResponse(
    true,
    'Rol actualizado correctamente',
    updatedRole
  ));
});

// ===================================================================
// ELIMINAR ROL
// ===================================================================

const deleteRole = catchAsync(async (req, res) => {
  const { id } = req.params;

  logger.info('Eliminando rol', {
    userId: req.user.id,
    roleId: id
  });

  await RoleService.deleteRole(id, req.user.id);

  logger.info('Rol eliminado exitosamente', {
    userId: req.user.id,
    roleId: id
  });

  res.json(createResponse(
    true,
    'Rol eliminado correctamente'
  ));
});

// ===================================================================
// ASIGNAR PERMISOS A ROL
// ===================================================================

const assignPermissions = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { permission_ids } = req.body;

  if (!Array.isArray(permission_ids)) {
    throw new ValidationError('permission_ids debe ser un arreglo');
  }

  logger.info('Asignando permisos a rol', {
    userId: req.user.id,
    roleId: id,
    permissionCount: permission_ids.length
  });

  const permissions = await RoleService.assignPermissions(
    id, 
    permission_ids, 
    req.user.id
  );

  logger.info('Permisos asignados exitosamente', {
    userId: req.user.id,
    roleId: id
  });

  res.json(createResponse(
    true,
    'Permisos asignados correctamente',
    permissions
  ));
});

// ===================================================================
// OBTENER PERMISOS DE ROL
// ===================================================================

const getRolePermissions = catchAsync(async (req, res) => {
  const { id } = req.params;

  logger.info('Obteniendo permisos de rol', {
    userId: req.user.id,
    roleId: id
  });

  const permissions = await RoleService.getRolePermissions(id);

  res.json(createResponse(
    true,
    'Permisos obtenidos correctamente',
    permissions
  ));
});

// ===================================================================
// OBTENER MÓDULOS CON PERMISOS (PARA UI DE ASIGNACIÓN)
// ===================================================================

const getModulesWithPermissions = catchAsync(async (req, res) => {
  const { id } = req.params;

  logger.info('Obteniendo módulos con permisos para rol', {
    userId: req.user.id,
    roleId: id
  });

  const modules = await RoleService.getModulesWithPermissions(id);

  res.json(createResponse(
    true,
    'Módulos obtenidos correctamente',
    modules
  ));
});

// ===================================================================
// OBTENER USUARIOS DEL ROL
// ===================================================================

const getRoleUsers = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  logger.info('Obteniendo usuarios del rol', {
    userId: req.user.id,
    roleId: id
  });

  const users = await RoleService.getRoleUsers(id, {
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json(createResponse(
    true,
    'Usuarios obtenidos correctamente',
    users
  ));
});

// ===================================================================
// OBTENER ESTADÍSTICAS
// ===================================================================

const getRoleStats = catchAsync(async (req, res) => {
  logger.info('Obteniendo estadísticas de roles', {
    userId: req.user.id
  });

  const stats = await RoleService.getRoleStats();

  res.json(createResponse(
    true,
    'Estadísticas obtenidas correctamente',
    stats
  ));
});

// ===================================================================
// LISTAR ROLES ACTIVOS (PARA DROPDOWNS)
// ===================================================================

const getActiveRoles = catchAsync(async (req, res) => {
  logger.info('Obteniendo roles activos', {
    userId: req.user.id
  });

  const roles = await RoleService.getAllActiveRoles();

  res.json(createResponse(
    true,
    'Roles activos obtenidos correctamente',
    roles
  ));
});

// ===================================================================
// DUPLICAR ROL
// ===================================================================

const duplicateRole = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, slug } = req.body;

  if (!name || !slug) {
    throw new ValidationError('Nombre y slug son requeridos para duplicar el rol');
  }

  logger.info('Duplicando rol', {
    userId: req.user.id,
    originalRoleId: id,
    newName: name,
    newSlug: slug
  });

  const newRole = await RoleService.duplicateRole(id, name, slug, req.user.id);

  logger.info('Rol duplicado exitosamente', {
    userId: req.user.id,
    originalRoleId: id,
    newRoleId: newRole.id
  });

  res.status(201).json(createResponse(
    true,
    'Rol duplicado correctamente',
    newRole
  ));
});

// ===================================================================
// EXPORTACIONES
// ===================================================================

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  assignPermissions,
  getRolePermissions,
  getModulesWithPermissions,
  getRoleUsers,
  getRoleStats,
  getActiveRoles,
  duplicateRole
};