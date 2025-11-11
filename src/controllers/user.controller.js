// ===================================================================
// PROSPERPOS - CONTROLADOR DE USUARIOS
// ===================================================================

const userService = require('../services/user.service');
const { createResponse } = require('../utils/response');
const { catchAsync, ValidationError, NotFoundError, AuthorizationError } = require('../middleware/error.middleware');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

// ===================================================================
// LISTAR USUARIOS
// ===================================================================

const getUsers = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    role = '',
    status = '',
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = req.query;

  logger.info('Listando usuarios', {
    userId: req.user.id,
    filters: { search, role, status },
    pagination: { page, limit }
  });

  const result = await userService.getUsers({
    page: parseInt(page),
    limit: parseInt(limit),
    search,
    role,
    status,
    sortBy,
    sortOrder
  });

  res.json(createResponse(
    true,
    'Usuarios obtenidos correctamente',
    {
      data: result.data,
      pagination: result.pagination,
      filters: { search, role, status }
    }
  ));
});

// ===================================================================
// OBTENER USUARIO POR ID
// ===================================================================

const getUserById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const includeRoles = req.query.include_roles === 'true';
  const includePermissions = req.query.include_permissions === 'true';

  logger.info('Obteniendo usuario por ID', {
    userId: req.user.id,
    targetUserId: id,
    includes: { roles: includeRoles, permissions: includePermissions }
  });

  const user = await userService.getUserById(id, {
    includeRoles,
    includePermissions
  });

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  res.json(createResponse(
    true,
    'Usuario obtenido correctamente',
    user
  ));
});

// ===================================================================
// CREAR USUARIO
// ===================================================================

const createUser = catchAsync(async (req, res) => {
  // Validar datos de entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Datos de entrada inválidos', errors.array());
  }

  const userData = {
    ...req.body,
    created_by: req.user.id
  };

  logger.info('Creando nuevo usuario', {
    userId: req.user.id,
    newUserEmail: userData.email,
    newUserRole: userData.role_id
  });

  // Los permisos ya son verificados por el middleware requirePermission
  // No es necesario verificar nuevamente aquí

  const newUser = await userService.createUser(userData);

  logger.info('Usuario creado exitosamente', {
    userId: req.user.id,
    newUserId: newUser.id,
    newUserEmail: newUser.email
  });

  res.status(201).json(createResponse(
    true,
    'Usuario creado correctamente',
    newUser
  ));
});

// ===================================================================
// ACTUALIZAR USUARIO
// ===================================================================

const updateUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Validar datos de entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Datos de entrada inválidos', errors.array());
  }

  // Verificar que el usuario existe
  const existingUser = await userService.getUserById(id);
  if (!existingUser) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // Los permisos ya son verificados por el middleware requirePermission
  // No es necesario verificar nuevamente aquí

  const updateData = {
    ...req.body,
    updated_by: req.user.id,
    updated_at: new Date()
  };

  logger.info('Actualizando usuario', {
    userId: req.user.id,
    targetUserId: id,
    fieldsToUpdate: Object.keys(updateData)
  });

  const updatedUser = await userService.updateUser(id, updateData);

  logger.info('Usuario actualizado exitosamente', {
    userId: req.user.id,
    updatedUserId: id
  });

  res.json(createResponse(
    true,
    'Usuario actualizado correctamente',
    updatedUser
  ));
});

// ===================================================================
// ELIMINAR USUARIO (SOFT DELETE)
// ===================================================================

const deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Verificar que el usuario existe
  const existingUser = await userService.getUserById(id);
  if (!existingUser) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // No permitir que un usuario se elimine a sí mismo
  if (req.user.id === parseInt(id)) {
    throw new ValidationError('No puedes eliminar tu propia cuenta');
  }

  // Los permisos ya son verificados por el middleware requirePermission
  // No es necesario verificar nuevamente aquí

  logger.info('Eliminando usuario', {
    userId: req.user.id,
    targetUserId: id,
    targetUserEmail: existingUser.email
  });

  await userService.deleteUser(id, req.user.id);

  logger.info('Usuario eliminado exitosamente', {
    userId: req.user.id,
    deletedUserId: id
  });

  res.json(createResponse(
    true,
    'Usuario eliminado correctamente'
  ));
});

// ===================================================================
// CAMBIAR ESTADO DE USUARIO
// ===================================================================

const changeUserStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'inactive', 'suspended'].includes(status)) {
    throw new ValidationError('Estado inválido. Use: active, inactive, suspended');
  }

  // Verificar que el usuario existe
  const existingUser = await userService.getUserById(id);
  if (!existingUser) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // No permitir cambiar el estado de su propia cuenta
  if (req.user.id === parseInt(id)) {
    throw new ValidationError('No puedes cambiar el estado de tu propia cuenta');
  }

  // Los permisos ya son verificados por el middleware requirePermission
  // No es necesario verificar nuevamente aquí

  logger.info('Cambiando estado de usuario', {
    userId: req.user.id,
    targetUserId: id,
    oldStatus: existingUser.status,
    newStatus: status
  });

  await userService.changeUserStatus(id, status, req.user.id);

  logger.info('Estado de usuario cambiado exitosamente', {
    userId: req.user.id,
    targetUserId: id,
    newStatus: status
  });

  res.json(createResponse(
    true,
    `Usuario ${status === 'active' ? 'activado' : status === 'inactive' ? 'desactivado' : 'suspendido'} correctamente`
  ));
});

// ===================================================================
// CAMBIAR CONTRASEÑA DE USUARIO
// ===================================================================

const changeUserPassword = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { new_password, confirm_password } = req.body;

  if (new_password !== confirm_password) {
    throw new ValidationError('Las contraseñas no coinciden');
  }

  // Verificar que el usuario existe
  const existingUser = await userService.getUserById(id);
  if (!existingUser) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // Solo admin puede cambiar contraseñas de otros usuarios
  // Los permisos ya son verificados por el middleware requirePermission
  const isOwnPassword = req.user.id === parseInt(id);

  logger.info('Cambiando contraseña de usuario', {
    userId: req.user.id,
    targetUserId: id,
    isOwnPassword
  });

  await userService.changeUserPassword(id, new_password, req.user.id);

  logger.info('Contraseña cambiada exitosamente', {
    userId: req.user.id,
    targetUserId: id
  });

  res.json(createResponse(
    true,
    'Contraseña cambiada correctamente'
  ));
});

// ===================================================================
// OBTENER PERFIL DEL USUARIO ACTUAL
// ===================================================================

const getMyProfile = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.user.id, {
    includeRoles: true,
    includePermissions: true,
    includeStats: true
  });

  res.json(createResponse(
    true,
    'Perfil obtenido correctamente',
    user
  ));
});

// ===================================================================
// ACTUALIZAR PERFIL DEL USUARIO ACTUAL
// ===================================================================

const updateMyProfile = catchAsync(async (req, res) => {
  // Validar datos de entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Datos de entrada inválidos', errors.array());
  }

  // Remover campos que no se pueden actualizar desde el perfil
  const allowedFields = ['first_name', 'last_name', 'phone', 'avatar'];
  const updateData = {};
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  updateData.updated_by = req.user.id;
  updateData.updated_at = new Date();

  logger.info('Actualizando perfil propio', {
    userId: req.user.id,
    fieldsToUpdate: Object.keys(updateData)
  });

  const updatedUser = await userService.updateUser(req.user.id, updateData);

  res.json(createResponse(
    true,
    'Perfil actualizado correctamente',
    updatedUser
  ));
});

// ===================================================================
// OBTENER ESTADÍSTICAS DE USUARIOS
// ===================================================================

const getUserStats = catchAsync(async (req, res) => {
  logger.info('Obteniendo estadísticas de usuarios', {
    userId: req.user.id
  });

  const stats = await userService.getUserStats();

  res.json(createResponse(
    true,
    'Estadísticas obtenidas correctamente',
    stats
  ));
});

// ===================================================================
// EXPORTACIONES
// ===================================================================

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changeUserStatus,
  changeUserPassword,
  getMyProfile,
  updateMyProfile,
  getUserStats
};