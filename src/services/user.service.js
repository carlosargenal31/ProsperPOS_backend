// ===================================================================
// PROSPERPOS - SERVICIO DE USUARIOS (CORREGIDO)
// ===================================================================

const UserModel = require('../models/user.model');
const logger = require('../utils/logger');
const { query } = require('../utils/database');

// ===================================================================
// ✅ DEFINIR CLASES DE ERROR LOCALMENTE
// ===================================================================

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class DatabaseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
  }
}

// ===================================================================
// SERVICIO DE USUARIOS
// ===================================================================

class UserService {

  // ===================================================================
  // OBTENER USUARIOS CON FILTROS Y PAGINACIÓN
  // ===================================================================
  
  static async getUsers(filters) {
    try {
      logger.info('Obteniendo usuarios con filtros', { filters });

      const result = await UserModel.findAll(filters);

      logger.info('Usuarios obtenidos exitosamente', {
        total: result.pagination.totalItems,
        page: result.pagination.currentPage
      });

      return result;
    } catch (error) {
      logger.error('Error obteniendo usuarios:', error);
      throw new DatabaseError('Error al obtener usuarios');
    }
  }

  // ===================================================================
  // OBTENER USUARIO POR ID
  // ===================================================================
  
  static async getUserById(id, options = {}) {
    try {
      logger.info('Obteniendo usuario por ID', { id, options });
      
      const user = await UserModel.findById(id, options);
      
      if (!user) {
        logger.warn('Usuario no encontrado', { id });
        return null;
      }
      
      logger.info('Usuario obtenido exitosamente', { 
        id: user.id, 
        email: user.email 
      });
      
      return user;
    } catch (error) {
      logger.error('Error obteniendo usuario por ID:', error);
      throw new DatabaseError('Error al obtener usuario');
    }
  }

  // ===================================================================
  // CREAR NUEVO USUARIO
  // ===================================================================
  
  static async createUser(userData) {
    try {
      logger.info('Creando nuevo usuario', { 
        email: userData.email,
        role_id: userData.role_id 
      });

      // Validar que el email no exista
      const emailExists = await UserModel.emailExists(userData.email);
      if (emailExists) {
        throw new ValidationError('El email ya está registrado');
      }

      // Validar que el rol exista
      const roleExists = await this.roleExists(userData.role_id);
      if (!roleExists) {
        throw new ValidationError('El rol especificado no existe');
      }

      // Validar que la tienda exista
      if (userData.store_id) {
        const storeExists = await this.storeExists(userData.store_id);
        if (!storeExists) {
          throw new ValidationError('La tienda especificada no existe');
        }
      }

      // Crear usuario
      const newUser = await UserModel.create(userData);
      
      // Asignar rol por defecto si no se especificó
      if (userData.role_id) {
        await this.assignRoleToUser(newUser.id, userData.role_id);
      }

      logger.info('Usuario creado exitosamente', { 
        id: newUser.id, 
        email: newUser.email 
      });

      return newUser;
    } catch (error) {
      logger.error('Error creando usuario:', error);
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new DatabaseError('Error al crear usuario');
    }
  }

  // ===================================================================
  // ACTUALIZAR USUARIO
  // ===================================================================
  
  static async updateUser(id, updateData) {
    try {
      logger.info('Actualizando usuario', { id, fields: Object.keys(updateData) });

      // Validar que el usuario exista
      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        throw new ValidationError('Usuario no encontrado');
      }

      // Validar email único si se está actualizando
      if (updateData.email) {
        const emailExists = await UserModel.emailExists(updateData.email, id);
        if (emailExists) {
          throw new ValidationError('El email ya está registrado');
        }
      }

      // Validar rol si se está actualizando
      if (updateData.role_id) {
        const roleExists = await this.roleExists(updateData.role_id);
        if (!roleExists) {
          throw new ValidationError('El rol especificado no existe');
        }
      }

      // Validar tienda si se está actualizando
      if (updateData.store_id) {
        const storeExists = await this.storeExists(updateData.store_id);
        if (!storeExists) {
          throw new ValidationError('La tienda especificada no existe');
        }
      }

      const updatedUser = await UserModel.update(id, updateData);

      logger.info('Usuario actualizado exitosamente', { id });

      return updatedUser;
    } catch (error) {
      logger.error('Error actualizando usuario:', error);
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new DatabaseError('Error al actualizar usuario');
    }
  }

  // ===================================================================
  // ELIMINAR USUARIO (SOFT DELETE)
  // ===================================================================
  
  static async deleteUser(id, deletedBy) {
    try {
      logger.info('Eliminando usuario', { id, deletedBy });

      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        throw new ValidationError('Usuario no encontrado');
      }

      // Verificar que no tenga operaciones pendientes
      const hasPendingOperations = await this.userHasPendingOperations(id);
      if (hasPendingOperations) {
        throw new ValidationError('No se puede eliminar el usuario porque tiene operaciones pendientes');
      }

      const deleted = await UserModel.softDelete(id, deletedBy);
      
      if (!deleted) {
        throw new DatabaseError('No se pudo eliminar el usuario');
      }

      logger.info('Usuario eliminado exitosamente', { id });

      return true;
    } catch (error) {
      logger.error('Error eliminando usuario:', error);
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new DatabaseError('Error al eliminar usuario');
    }
  }

  // ===================================================================
  // CAMBIAR ESTADO DE USUARIO
  // ===================================================================
  
  static async changeUserStatus(id, status, updatedBy) {
    try {
      logger.info('Cambiando estado de usuario', { id, status, updatedBy });

      const validStatuses = ['active', 'inactive', 'suspended'];
      if (!validStatuses.includes(status)) {
        throw new ValidationError('Estado inválido');
      }

      const updated = await UserModel.update(id, { 
        status, 
        updated_by: updatedBy 
      });

      if (!updated) {
        throw new ValidationError('Usuario no encontrado');
      }

      logger.info('Estado de usuario cambiado exitosamente', { id, status });

      return updated;
    } catch (error) {
      logger.error('Error cambiando estado de usuario:', error);
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new DatabaseError('Error al cambiar estado del usuario');
    }
  }

  // ===================================================================
  // CAMBIAR CONTRASEÑA
  // ===================================================================
  
  static async changeUserPassword(id, newPassword, updatedBy) {
    try {
      logger.info('Cambiando contraseña de usuario', { id, updatedBy });

      // Validar longitud de contraseña
      if (newPassword.length < 8) {
        throw new ValidationError('La contraseña debe tener al menos 8 caracteres');
      }

      const updated = await UserModel.updatePassword(id, newPassword, updatedBy);
      
      if (!updated) {
        throw new ValidationError('Usuario no encontrado');
      }

      logger.info('Contraseña cambiada exitosamente', { id });

      return true;
    } catch (error) {
      logger.error('Error cambiando contraseña:', error);
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new DatabaseError('Error al cambiar contraseña');
    }
  }

  // ===================================================================
  // OBTENER ESTADÍSTICAS
  // ===================================================================
  
  static async getUserStats() {
    try {
      logger.info('Obteniendo estadísticas de usuarios');

      const stats = await UserModel.getStats();

      // Obtener estadísticas adicionales
      const roleSql = `
        SELECT r.name, COUNT(u.id) as count
        FROM roles r
        LEFT JOIN users u ON r.id = u.role_id AND u.deleted_at IS NULL
        WHERE r.deleted_at IS NULL
        GROUP BY r.id, r.name
        ORDER BY count DESC
      `;
      
      const roleStats = await query(roleSql);
      stats.by_role = roleStats;

      // Actividad reciente
      const recentActivitySql = `
        SELECT DATE(created_at) as date, COUNT(*) as users_created
        FROM users
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND deleted_at IS NULL
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `;
      
      const recentActivity = await query(recentActivitySql);
      stats.recent_activity = recentActivity;

      logger.info('Estadísticas obtenidas exitosamente');

      return stats;
    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      throw new DatabaseError('Error al obtener estadísticas');
    }
  }

  // ===================================================================
  // VERIFICAR PERMISOS
  // ===================================================================
  
  static async canUserPerformAction(userId, action) {
    try {
      const sql = `
        SELECT COUNT(*) as count
        FROM permissions p
        INNER JOIN role_permissions rp ON p.id = rp.permission_id
        INNER JOIN user_roles ur ON rp.role_id = ur.role_id
        WHERE ur.user_id = ? AND p.name = ? 
        AND p.deleted_at IS NULL
      `;

      const result = await query(sql, [userId, action]);
      return result[0].count > 0;
    } catch (error) {
      logger.error('Error verificando permisos:', error);
      return false;
    }
  }

  static async canUserUpdateUser(requesterId, targetUserId) {
    try {
      // El usuario puede actualizar su propio perfil (campos limitados)
      if (requesterId === parseInt(targetUserId)) {
        return true;
      }

      // Para actualizar otros usuarios, necesita el permiso
      return await this.canUserPerformAction(requesterId, 'update_user');
    } catch (error) {
      logger.error('Error verificando permisos de actualización:', error);
      return false;
    }
  }

  // ===================================================================
  // FUNCIONES AUXILIARES
  // ===================================================================
  
  static async roleExists(roleId) {
    try {
      const sql = `
        SELECT id FROM roles 
        WHERE id = ? AND deleted_at IS NULL
      `;
      
      const result = await query(sql, [roleId]);
      return result.length > 0;
    } catch (error) {
      logger.error('Error verificando rol:', error);
      return false;
    }
  }

  static async storeExists(storeId) {
    try {
      const sql = `
        SELECT id FROM stores 
        WHERE id = ? AND deleted_at IS NULL
      `;
      
      const result = await query(sql, [storeId]);
      return result.length > 0;
    } catch (error) {
      logger.error('Error verificando tienda:', error);
      return false;
    }
  }

  static async userHasPendingOperations(userId) {
    try {
      // Verificar ventas no cerradas
      const salesSql = `
        SELECT COUNT(*) as count
        FROM sales 
        WHERE user_id = ? AND status != 'completed' 
        AND deleted_at IS NULL
      `;
      
      const salesResult = await query(salesSql, [userId]);
      
      return salesResult[0].count > 0;
    } catch (error) {
      logger.error('Error verificando operaciones pendientes:', error);
      return false;
    }
  }

  static async assignRoleToUser(userId, roleId) {
    try {
      const sql = `
        INSERT INTO user_roles (user_id, role_id, created_at)
        VALUES (?, ?, NOW())
        ON DUPLICATE KEY UPDATE updated_at = NOW()
      `;
      
      await query(sql, [userId, roleId]);
      return true;
    } catch (error) {
      logger.error('Error asignando rol:', error);
      return false;
    }
  }
}

// ===================================================================
// EXPORTAR SERVICIO
// ===================================================================

module.exports = UserService;