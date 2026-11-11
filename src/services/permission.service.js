// ===================================================================
// PROSPERPOS - SERVICIO DE PERMISOS
// ===================================================================

const PermissionModel = require('../models/Permission.model');
const { ValidationError, DatabaseError, NotFoundError } = require('../middleware/error.middleware');
const logger = require('../utils/logger');
const { query } = require('../utils/database');

// ===================================================================
// SERVICIO DE PERMISOS
// ===================================================================

class PermissionService {

  // ===================================================================
  // OBTENER PERMISOS CON FILTROS Y PAGINACIÓN
  // ===================================================================
  
  static async getPermissions(filters) {
    try {
      logger.info('Obteniendo permisos con filtros', { filters });
      
      const result = await PermissionModel.findAll(filters);
      
      logger.info('Permisos obtenidos exitosamente', {
        total: result.pagination.totalItems,
        page: result.pagination.currentPage
      });
      
      return result;
    } catch (error) {
      logger.error('Error obteniendo permisos:', error);
      throw new DatabaseError('Error al obtener permisos');
    }
  }

  // ===================================================================
  // OBTENER PERMISO POR ID
  // ===================================================================
  
  static async getPermissionById(id, options = {}) {
    try {
      logger.info('Obteniendo permiso por ID', { id, options });
      
      const permission = await PermissionModel.findById(id, options);
      
      if (!permission) {
        logger.warn('Permiso no encontrado', { id });
        return null;
      }
      
      logger.info('Permiso obtenido exitosamente', { 
        id: permission.id, 
        name: permission.name 
      });
      
      return permission;
    } catch (error) {
      logger.error('Error obteniendo permiso por ID:', error);
      throw new DatabaseError('Error al obtener permiso');
    }
  }

  // ===================================================================
  // CREAR NUEVO PERMISO
  // ===================================================================
  
  static async createPermission(permissionData) {
    try {
      logger.info('Creando nuevo permiso', { 
        name: permissionData.name,
        slug: permissionData.slug,
        module: permissionData.module
      });

      // Validar que el nombre no exista
      const nameExists = await PermissionModel.nameExists(permissionData.name);
      if (nameExists) {
        throw new ValidationError('Ya existe un permiso con ese nombre');
      }

      // Validar que el slug no exista
      const slugExists = await PermissionModel.slugExists(permissionData.slug);
      if (slugExists) {
        throw new ValidationError('Ya existe un permiso con ese slug');
      }

      // Validar formato del slug (module.action)
      if (!this.isValidSlugFormat(permissionData.slug)) {
        throw new ValidationError('El slug debe tener el formato: module.action (ej: products.read)');
      }

      // Crear permiso
      const newPermission = await PermissionModel.create(permissionData);

      logger.info('Permiso creado exitosamente', { 
        id: newPermission.id, 
        name: newPermission.name 
      });

      return newPermission;
    } catch (error) {
      logger.error('Error creando permiso:', error);
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new DatabaseError('Error al crear permiso');
    }
  }

  // ===================================================================
  // ACTUALIZAR PERMISO
  // ===================================================================
  
  static async updatePermission(id, updateData) {
    try {
      logger.info('Actualizando permiso', { id, fields: Object.keys(updateData) });

      // Validar que el permiso exista
      const existingPermission = await PermissionModel.findById(id);
      if (!existingPermission) {
        throw new NotFoundError('Permiso no encontrado');
      }

      // Validar nombre único si se está actualizando
      if (updateData.name) {
        const nameExists = await PermissionModel.nameExists(updateData.name, id);
        if (nameExists) {
          throw new ValidationError('Ya existe un permiso con ese nombre');
        }
      }

      // Validar slug único si se está actualizando
      if (updateData.slug) {
        const slugExists = await PermissionModel.slugExists(updateData.slug, id);
        if (slugExists) {
          throw new ValidationError('Ya existe un permiso con ese slug');
        }

        // Validar formato del slug
        if (!this.isValidSlugFormat(updateData.slug)) {
          throw new ValidationError('El slug debe tener el formato: module.action (ej: products.read)');
        }
      }

      const updatedPermission = await PermissionModel.update(id, updateData);

      logger.info('Permiso actualizado exitosamente', { id });

      return updatedPermission;
    } catch (error) {
      logger.error('Error actualizando permiso:', error);
      
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      
      throw new DatabaseError('Error al actualizar permiso');
    }
  }

  // ===================================================================
  // ELIMINAR PERMISO (SOFT DELETE)
  // ===================================================================
  
  static async deletePermission(id) {
    try {
      logger.info('Eliminando permiso', { id });

      const existingPermission = await PermissionModel.findById(id);
      if (!existingPermission) {
        throw new NotFoundError('Permiso no encontrado');
      }

      // Verificar que no tenga roles asignados
      const hasRoles = await PermissionModel.hasRoles(id);
      if (hasRoles) {
        throw new ValidationError('No se puede eliminar el permiso porque está asignado a uno o más roles');
      }

      const deleted = await PermissionModel.softDelete(id);
      
      if (!deleted) {
        throw new DatabaseError('No se pudo eliminar el permiso');
      }

      logger.info('Permiso eliminado exitosamente', { id });

      return true;
    } catch (error) {
      logger.error('Error eliminando permiso:', error);
      
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      
      throw new DatabaseError('Error al eliminar permiso');
    }
  }

  // ===================================================================
  // OBTENER ROLES CON ESTE PERMISO
  // ===================================================================
  
  static async getPermissionRoles(permissionId, options = {}) {
    try {
      logger.info('Obteniendo roles del permiso', { permissionId });

      const permission = await PermissionModel.findById(permissionId);
      if (!permission) {
        throw new NotFoundError('Permiso no encontrado');
      }

      const roles = await PermissionModel.getRoles(permissionId, options);

      logger.info('Roles obtenidos exitosamente', { 
        permissionId, 
        roleCount: roles.length 
      });

      return roles;
    } catch (error) {
      logger.error('Error obteniendo roles del permiso:', error);
      
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      throw new DatabaseError('Error al obtener roles');
    }
  }

  // ===================================================================
  // OBTENER ESTADÍSTICAS
  // ===================================================================
  
  static async getPermissionStats() {
    try {
      logger.info('Obteniendo estadísticas de permisos');

      const stats = await PermissionModel.getStats();

      // Obtener permisos por módulo
      const modulesSql = `
        SELECT 
          module,
          COUNT(*) as permission_count,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_count
        FROM permissions
        WHERE deleted_at IS NULL
        GROUP BY module
        ORDER BY permission_count DESC
      `;
      
      const moduleStats = await query(modulesSql);
      stats.by_module = moduleStats;

      // Obtener permisos más usados
      const mostUsedSql = `
        SELECT 
          p.id, p.name, p.module, p.slug,
          COUNT(rp.role_id) as role_count
        FROM permissions p
        LEFT JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE p.deleted_at IS NULL
        GROUP BY p.id
        ORDER BY role_count DESC
        LIMIT 10
      `;
      
      const mostUsed = await query(mostUsedSql);
      stats.most_used = mostUsed;

      logger.info('Estadísticas obtenidas exitosamente');

      return stats;
    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      throw new DatabaseError('Error al obtener estadísticas');
    }
  }

  // ===================================================================
  // OBTENER PERMISOS POR MÓDULO
  // ===================================================================
  
  static async getPermissionsByModule(module) {
    try {
      logger.info('Obteniendo permisos por módulo', { module });

      const permissions = await PermissionModel.getByModule(module);

      logger.info('Permisos obtenidos exitosamente', { 
        module, 
        count: permissions.length 
      });

      return permissions;
    } catch (error) {
      logger.error('Error obteniendo permisos por módulo:', error);
      throw new DatabaseError('Error al obtener permisos');
    }
  }

  // ===================================================================
  // OBTENER TODOS LOS MÓDULOS
  // ===================================================================
  
  static async getAllModules() {
    try {
      logger.info('Obteniendo todos los módulos');

      const modules = await PermissionModel.getAllModules();

      logger.info('Módulos obtenidos exitosamente', { count: modules.length });

      return modules;
    } catch (error) {
      logger.error('Error obteniendo módulos:', error);
      throw new DatabaseError('Error al obtener módulos');
    }
  }

  // ===================================================================
  // LISTAR PERMISOS ACTIVOS (PARA DROPDOWNS)
  // ===================================================================
  
  static async getAllActivePermissions() {
    try {
      logger.info('Obteniendo todos los permisos activos');

      const permissions = await PermissionModel.findAllActive();

      logger.info('Permisos activos obtenidos', { count: permissions.length });

      return permissions;
    } catch (error) {
      logger.error('Error obteniendo permisos activos:', error);
      throw new DatabaseError('Error al obtener permisos activos');
    }
  }

  // ===================================================================
  // OBTENER PERMISOS AGRUPADOS POR MÓDULO
  // ===================================================================
  
  static async getPermissionsGroupedByModule() {
    try {
      logger.info('Obteniendo permisos agrupados por módulo');

      const modules = await PermissionModel.findAllGroupedByModule();

      logger.info('Permisos agrupados obtenidos exitosamente', { 
        moduleCount: modules.length 
      });

      return modules;
    } catch (error) {
      logger.error('Error obteniendo permisos agrupados:', error);
      throw new DatabaseError('Error al obtener permisos agrupados');
    }
  }

  // ===================================================================
  // IMPORTAR PERMISOS DESDE DEFINICIÓN
  // ===================================================================
  
  static async importPermissions(permissionsDefinition) {
    try {
      logger.info('Importando permisos', { 
        count: permissionsDefinition.length 
      });

      const results = {
        created: 0,
        updated: 0,
        skipped: 0,
        errors: []
      };

      for (const permDef of permissionsDefinition) {
        try {
          // Verificar si ya existe
          const existing = await PermissionModel.findBySlug(permDef.slug);
          
          if (existing) {
            // Actualizar si hay cambios
            await PermissionModel.update(existing.id, {
              name: permDef.name,
              module: permDef.module,
              description: permDef.description,
              is_active: permDef.is_active !== undefined ? permDef.is_active : 1
            });
            results.updated++;
          } else {
            // Crear nuevo
            await PermissionModel.create(permDef);
            results.created++;
          }
        } catch (error) {
          results.errors.push({
            slug: permDef.slug,
            error: error.message
          });
        }
      }

      logger.info('Importación completada', results);

      return results;
    } catch (error) {
      logger.error('Error importando permisos:', error);
      throw new DatabaseError('Error al importar permisos');
    }
  }

  // ===================================================================
  // FUNCIONES AUXILIARES
  // ===================================================================
  
  static isValidSlugFormat(slug) {
    // Formato esperado: module.action (ej: products.read)
    const slugRegex = /^[a-z_]+\.[a-z_]+$/;
    return slugRegex.test(slug);
  }
}

// ===================================================================
// EXPORTAR SERVICIO
// ===================================================================

module.exports = PermissionService;