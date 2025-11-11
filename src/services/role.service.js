// ===================================================================
// PROSPERPOS - SERVICIO DE ROLES
// ===================================================================

const RoleModel = require('../models/Role.model');
const { ValidationError, NotFoundError } = require('../middleware/error.middleware');
const logger = require('../utils/logger');
const { query } = require('../utils/database');

// ===================================================================
// ✅ DEFINIR CLASE DE ERROR LOCALMENTE
// ===================================================================

class DatabaseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
  }
}

// ===================================================================
// SERVICIO DE ROLES
// ===================================================================

class RoleService {

  // ===================================================================
  // OBTENER ROLES CON FILTROS Y PAGINACIÓN
  // ===================================================================
  
  static async getRoles(filters) {
    try {
      logger.info('Obteniendo roles con filtros', { filters });
      
      const result = await RoleModel.findAll(filters);
      
      logger.info('Roles obtenidos exitosamente', {
        total: result.pagination.totalItems,
        page: result.pagination.currentPage
      });
      
      return result;
    } catch (error) {
      logger.error('Error obteniendo roles:', error);
      throw new DatabaseError('Error al obtener roles');
    }
  }

  // ===================================================================
  // OBTENER ROL POR ID
  // ===================================================================
  
  static async getRoleById(id, options = {}) {
    try {
      logger.info('Obteniendo rol por ID', { id, options });
      
      const role = await RoleModel.findById(id, options);
      
      if (!role) {
        logger.warn('Rol no encontrado', { id });
        return null;
      }
      
      logger.info('Rol obtenido exitosamente', { 
        id: role.id, 
        name: role.name 
      });
      
      return role;
    } catch (error) {
      logger.error('Error obteniendo rol por ID:', error);
      throw new DatabaseError('Error al obtener rol');
    }
  }

  // ===================================================================
  // CREAR NUEVO ROL
  // ===================================================================
  
  static async createRole(roleData) {
    try {
      logger.info('Creando nuevo rol', { 
        name: roleData.name,
        slug: roleData.slug 
      });

      // Validar que el nombre no exista
      const nameExists = await RoleModel.nameExists(roleData.name);
      if (nameExists) {
        throw new ValidationError('Ya existe un rol con ese nombre');
      }

      // Validar que el slug no exista
      const slugExists = await RoleModel.slugExists(roleData.slug);
      if (slugExists) {
        throw new ValidationError('Ya existe un rol con ese slug');
      }

      // Crear rol
      const newRole = await RoleModel.create(roleData);

      logger.info('Rol creado exitosamente', { 
        id: newRole.id, 
        name: newRole.name 
      });

      return newRole;
    } catch (error) {
      logger.error('Error creando rol:', error);
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new DatabaseError('Error al crear rol');
    }
  }

  // ===================================================================
  // ACTUALIZAR ROL
  // ===================================================================
  
  static async updateRole(id, updateData) {
    try {
      logger.info('Actualizando rol', { id, fields: Object.keys(updateData) });

      // Validar que el rol exista
      const existingRole = await RoleModel.findById(id);
      if (!existingRole) {
        throw new NotFoundError('Rol no encontrado');
      }

      // Validar nombre único si se está actualizando
      if (updateData.name) {
        const nameExists = await RoleModel.nameExists(updateData.name, id);
        if (nameExists) {
          throw new ValidationError('Ya existe un rol con ese nombre');
        }
      }

      // Validar slug único si se está actualizando
      if (updateData.slug) {
        const slugExists = await RoleModel.slugExists(updateData.slug, id);
        if (slugExists) {
          throw new ValidationError('Ya existe un rol con ese slug');
        }
      }

      // No permitir desactivar roles que son del sistema
      const systemRoles = ['super_admin', 'admin'];
      if (updateData.is_active === 0 && systemRoles.includes(existingRole.slug)) {
        throw new ValidationError('No se puede desactivar un rol del sistema');
      }

      const updatedRole = await RoleModel.update(id, updateData);

      logger.info('Rol actualizado exitosamente', { id });

      return updatedRole;
    } catch (error) {
      logger.error('Error actualizando rol:', error);
      
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      
      throw new DatabaseError('Error al actualizar rol');
    }
  }

  // ===================================================================
  // ELIMINAR ROL (SOFT DELETE)
  // ===================================================================
  
  static async deleteRole(id, deletedBy) {
    try {
      logger.info('Eliminando rol', { id, deletedBy });

      const existingRole = await RoleModel.findById(id);
      if (!existingRole) {
        throw new NotFoundError('Rol no encontrado');
      }

      // No permitir eliminar roles del sistema
      const systemRoles = ['super_admin', 'admin'];
      if (systemRoles.includes(existingRole.slug)) {
        throw new ValidationError('No se puede eliminar un rol del sistema');
      }

      // Verificar que no tenga usuarios asignados
      const hasUsers = await RoleModel.hasUsers(id);
      if (hasUsers) {
        throw new ValidationError('No se puede eliminar el rol porque tiene usuarios asignados');
      }

      const deleted = await RoleModel.softDelete(id, deletedBy);
      
      if (!deleted) {
        throw new DatabaseError('No se pudo eliminar el rol');
      }

      logger.info('Rol eliminado exitosamente', { id });

      return true;
    } catch (error) {
      logger.error('Error eliminando rol:', error);
      
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      
      throw new DatabaseError('Error al eliminar rol');
    }
  }

  // ===================================================================
  // ASIGNAR PERMISOS A ROL
  // ===================================================================
  
  static async assignPermissions(roleId, permissionIds, userId) {
    try {
      logger.info('Asignando permisos a rol', { 
        roleId, 
        permissionCount: permissionIds.length 
      });

      // Validar que el rol exista
      const role = await RoleModel.findById(roleId);
      if (!role) {
        throw new NotFoundError('Rol no encontrado');
      }

      // Validar que todos los permisos existan
      for (const permId of permissionIds) {
        const permExists = await this.permissionExists(permId);
        if (!permExists) {
          throw new ValidationError(`El permiso con ID ${permId} no existe`);
        }
      }

      // Asignar permisos
      await RoleModel.assignPermissions(roleId, permissionIds, userId);

      logger.info('Permisos asignados exitosamente', { roleId });

      return await RoleModel.getPermissions(roleId);
    } catch (error) {
      logger.error('Error asignando permisos:', error);
      
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      
      throw new DatabaseError('Error al asignar permisos');
    }
  }

  // ===================================================================
  // OBTENER PERMISOS DE ROL
  // ===================================================================
  
  static async getRolePermissions(roleId) {
    try {
      logger.info('Obteniendo permisos de rol', { roleId });

      const role = await RoleModel.findById(roleId);
      if (!role) {
        throw new NotFoundError('Rol no encontrado');
      }

      const permissions = await RoleModel.getPermissions(roleId);

      logger.info('Permisos obtenidos exitosamente', { 
        roleId, 
        permissionCount: permissions.length 
      });

      return permissions;
    } catch (error) {
      logger.error('Error obteniendo permisos de rol:', error);
      
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      throw new DatabaseError('Error al obtener permisos');
    }
  }

  // ===================================================================
  // OBTENER MÓDULOS CON PERMISOS (PARA UI)
  // ===================================================================
  
  static async getModulesWithPermissions(roleId) {
    try {
      logger.info('Obteniendo módulos con permisos', { roleId });

      const role = await RoleModel.findById(roleId);
      if (!role) {
        throw new NotFoundError('Rol no encontrado');
      }

      const modules = await RoleModel.getModulesWithPermissions(roleId);

      logger.info('Módulos obtenidos exitosamente', { 
        roleId, 
        moduleCount: modules.length 
      });

      return modules;
    } catch (error) {
      logger.error('Error obteniendo módulos con permisos:', error);
      
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      throw new DatabaseError('Error al obtener módulos');
    }
  }

  // ===================================================================
  // OBTENER USUARIOS CON ESTE ROL
  // ===================================================================
  
  static async getRoleUsers(roleId, options = {}) {
    try {
      logger.info('Obteniendo usuarios del rol', { roleId });

      const role = await RoleModel.findById(roleId);
      if (!role) {
        throw new NotFoundError('Rol no encontrado');
      }

      const users = await RoleModel.getUsers(roleId, options);

      logger.info('Usuarios obtenidos exitosamente', { 
        roleId, 
        userCount: users.length 
      });

      return users;
    } catch (error) {
      logger.error('Error obteniendo usuarios del rol:', error);
      
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      throw new DatabaseError('Error al obtener usuarios');
    }
  }

  // ===================================================================
  // OBTENER ESTADÍSTICAS
  // ===================================================================
  
  static async getRoleStats() {
    try {
      logger.info('Obteniendo estadísticas de roles');

      const stats = await RoleModel.getStats();

      // Obtener roles más usados
      const mostUsedSql = `
        SELECT 
          r.id, r.name, r.slug,
          COUNT(ur.user_id) as user_count
        FROM roles r
        LEFT JOIN user_roles ur ON r.id = ur.role_id
        WHERE r.deleted_at IS NULL
        GROUP BY r.id
        ORDER BY user_count DESC
        LIMIT 5
      `;
      
      const mostUsed = await query(mostUsedSql);
      stats.most_used_roles = mostUsed;

      logger.info('Estadísticas obtenidas exitosamente');

      return stats;
    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      throw new DatabaseError('Error al obtener estadísticas');
    }
  }

  // ===================================================================
  // LISTAR TODOS LOS ROLES ACTIVOS (PARA DROPDOWNS)
  // ===================================================================
  
  static async getAllActiveRoles() {
    try {
      logger.info('Obteniendo todos los roles activos');

      const roles = await RoleModel.findAllActive();

      logger.info('Roles activos obtenidos', { count: roles.length });

      return roles;
    } catch (error) {
      logger.error('Error obteniendo roles activos:', error);
      throw new DatabaseError('Error al obtener roles activos');
    }
  }

  // ===================================================================
  // DUPLICAR ROL
  // ===================================================================
  
  static async duplicateRole(id, newName, newSlug, userId) {
    try {
      logger.info('Duplicando rol', { id, newName, newSlug });

      // Obtener rol original con permisos
      const originalRole = await RoleModel.findById(id, { includePermissions: true });
      if (!originalRole) {
        throw new NotFoundError('Rol no encontrado');
      }

      // Validar que el nuevo nombre no exista
      const nameExists = await RoleModel.nameExists(newName);
      if (nameExists) {
        throw new ValidationError('Ya existe un rol con ese nombre');
      }

      // Validar que el nuevo slug no exista
      const slugExists = await RoleModel.slugExists(newSlug);
      if (slugExists) {
        throw new ValidationError('Ya existe un rol con ese slug');
      }

      // Crear nuevo rol
      const newRole = await RoleModel.create({
        name: newName,
        slug: newSlug,
        description: `Copia de ${originalRole.name}`,
        is_active: originalRole.is_active,
        created_by: userId
      });

      // Copiar permisos
      if (originalRole.permissions && originalRole.permissions.length > 0) {
        const permissionIds = originalRole.permissions.map(p => p.id);
        await RoleModel.assignPermissions(newRole.id, permissionIds, userId);
      }

      logger.info('Rol duplicado exitosamente', { 
        originalId: id, 
        newId: newRole.id 
      });

      return await RoleModel.findById(newRole.id, { includePermissions: true });
    } catch (error) {
      logger.error('Error duplicando rol:', error);
      
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      
      throw new DatabaseError('Error al duplicar rol');
    }
  }

  // ===================================================================
  // FUNCIONES AUXILIARES
  // ===================================================================
  
  static async permissionExists(permissionId) {
    try {
      const sql = `
        SELECT id FROM permissions 
        WHERE id = ? AND deleted_at IS NULL
      `;
      
      const result = await query(sql, [permissionId]);
      return result.length > 0;
    } catch (error) {
      logger.error('Error verificando permiso:', error);
      return false;
    }
  }
}

// ===================================================================
// EXPORTAR SERVICIO
// ===================================================================

module.exports = RoleService;