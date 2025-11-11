// ===================================================================
// PROSPERPOS - MODELO DE ROLES
// ===================================================================

const { query } = require('../utils/database');
const logger = require('../utils/logger');

// ===================================================================
// CLASE MODELO ROLES
// ===================================================================

class RoleModel {
  
  // ===================================================================
  // CREAR ROL
  // ===================================================================
  
  static async create(roleData) {
    const {
      name,
      slug,
      description = null,
      is_active = 1,
      created_by
    } = roleData;

    const sql = `
      INSERT INTO roles (
        name, slug, description, is_active, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const values = [name, slug, description, is_active, created_by];

    const result = await query(sql, values);
    
    return await this.findById(result.insertId);
  }

  // ===================================================================
  // BUSCAR POR ID
  // ===================================================================
  
  static async findById(id, options = {}) {
    const {
      includePermissions = false,
      includeUserCount = false
    } = options;

    let sql = `
      SELECT 
        r.id, r.name, r.slug, r.description, r.is_active,
        r.created_at, r.updated_at,
        CONCAT(uc.first_name, ' ', uc.last_name) as created_by_name,
        CONCAT(uu.first_name, ' ', uu.last_name) as updated_by_name
      FROM roles r
      LEFT JOIN users uc ON r.created_by = uc.id
      LEFT JOIN users uu ON r.updated_by = uu.id
      WHERE r.id = ? AND r.deleted_at IS NULL
    `;

    const roles = await query(sql, [id]);
    if (roles.length === 0) return null;

    let role = roles[0];

    // Incluir permisos si se solicita
    if (includePermissions) {
      const permissionsSql = `
        SELECT 
          p.id, p.name, p.slug, p.module, p.description
        FROM permissions p
        INNER JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ? AND p.deleted_at IS NULL
        ORDER BY p.module, p.name
      `;
      
      role.permissions = await query(permissionsSql, [id]);
    }

    // Incluir conteo de usuarios si se solicita
    if (includeUserCount) {
      const userCountSql = `
        SELECT COUNT(*) as user_count
        FROM user_roles ur
        INNER JOIN users u ON ur.user_id = u.id
        WHERE ur.role_id = ? AND u.deleted_at IS NULL
      `;
      
      const countResult = await query(userCountSql, [id]);
      role.user_count = countResult[0].user_count;
    }

    return role;
  }

  // ===================================================================
  // BUSCAR POR SLUG
  // ===================================================================
  
  static async findBySlug(slug) {
    const sql = `
      SELECT 
        r.id, r.name, r.slug, r.description, r.is_active,
        r.created_at, r.updated_at
      FROM roles r
      WHERE r.slug = ? AND r.deleted_at IS NULL
    `;

    const roles = await query(sql, [slug]);
    return roles.length > 0 ? roles[0] : null;
  }

  // ===================================================================
  // LISTAR ROLES CON FILTROS
  // ===================================================================
  
  static async findAll(filters = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      sortBy = 'name',
      sortOrder = 'ASC'
    } = filters;

    // Asegurar que page y limit sean números enteros
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Validar que sean números válidos
    if (isNaN(pageNum) || isNaN(limitNum) || isNaN(offset)) {
      throw new Error(`Invalid pagination params: page=${page}, limit=${limit}`);
    }

    // Construir condiciones WHERE
    let whereConditions = ['r.deleted_at IS NULL'];
    let params = [];

    if (search) {
      whereConditions.push(`(
        r.name LIKE ? OR 
        r.slug LIKE ? OR 
        r.description LIKE ?
      )`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    if (status !== '') {
      whereConditions.push('r.is_active = ?');
      params.push(status === 'active' ? 1 : 0);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Validar columna de ordenamiento
    const validSortColumns = ['name', 'slug', 'created_at', 'updated_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'name';
    const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Query principal con conteo de usuarios
    // ✅ SOLUCIÓN: Poner limit y offset directamente en el SQL (igual que User.model.js)
    const sql = `
      SELECT
        r.id, r.name, r.slug, r.description, r.is_active,
        r.created_at, r.updated_at,
        COUNT(DISTINCT ur.user_id) as user_count,
        COUNT(DISTINCT rp.permission_id) as permission_count
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      ${whereClause}
      GROUP BY r.id, r.name, r.slug, r.description, r.is_active, r.created_at, r.updated_at
      ORDER BY r.${sortColumn} ${sortDirection}
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    // Query para contar total
    const countSql = `
      SELECT COUNT(*) as total
      FROM roles r
      ${whereClause}
    `;

    // NO pasar limitNum, offset como params ya que están en el SQL directamente
    const [roles, countResult] = await Promise.all([
      query(sql, params),  // params solo contiene search y status
      query(countSql, params)
    ]);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limitNum);

    return {
      data: roles,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1
      }
    };
  }

  // ===================================================================
  // ACTUALIZAR ROL
  // ===================================================================
  
  static async update(id, updateData) {
    const {
      name,
      slug,
      description,
      is_active,
      updated_by
    } = updateData;

    // Construir query dinámicamente
    const updateFields = [];
    const values = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      values.push(name);
    }
    if (slug !== undefined) {
      updateFields.push('slug = ?');
      values.push(slug);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      values.push(description);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      values.push(is_active);
    }

    // Agregar campos de auditoría
    updateFields.push('updated_by = ?', 'updated_at = NOW()');
    values.push(updated_by, id);

    const sql = `
      UPDATE roles 
      SET ${updateFields.join(', ')}
      WHERE id = ? AND deleted_at IS NULL
    `;

    await query(sql, values);
    
    return await this.findById(id);
  }

  // ===================================================================
  // SOFT DELETE
  // ===================================================================
  
  static async softDelete(id, deletedBy) {
    const sql = `
      UPDATE roles 
      SET deleted_at = NOW(), deleted_by = ?
      WHERE id = ? AND deleted_at IS NULL
    `;

    const result = await query(sql, [deletedBy, id]);
    return result.affectedRows > 0;
  }

  // ===================================================================
  // ASIGNAR PERMISOS A ROL
  // ===================================================================
  
  static async assignPermissions(roleId, permissionIds, createdBy) {
    // Primero eliminar permisos existentes
    await this.removeAllPermissions(roleId);

    // Insertar nuevos permisos
    if (permissionIds.length === 0) return true;

    const values = permissionIds.map(permId => 
      `(${roleId}, ${permId}, ${createdBy}, NOW())`
    ).join(',');

    const sql = `
      INSERT INTO role_permissions (role_id, permission_id, created_by, created_at)
      VALUES ${values}
    `;

    await query(sql);
    return true;
  }

  // ===================================================================
  // REMOVER TODOS LOS PERMISOS DE UN ROL
  // ===================================================================
  
  static async removeAllPermissions(roleId) {
    const sql = `
      DELETE FROM role_permissions 
      WHERE role_id = ?
    `;

    await query(sql, [roleId]);
    return true;
  }

  // ===================================================================
  // OBTENER PERMISOS DE UN ROL
  // ===================================================================
  
  static async getPermissions(roleId) {
    const sql = `
      SELECT 
        p.id, p.name, p.slug, p.module, p.description, p.is_active
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ? AND p.deleted_at IS NULL
      ORDER BY p.module, p.name
    `;

    return await query(sql, [roleId]);
  }

  // ===================================================================
  // OBTENER USUARIOS CON ESTE ROL
  // ===================================================================
  
  static async getUsers(roleId, options = {}) {
    const { limit = 50, offset = 0 } = options;

    const sql = `
      SELECT 
        u.id, u.first_name, u.last_name, u.email, u.status,
        CONCAT(u.first_name, ' ', u.last_name) as full_name
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role_id = ? AND u.deleted_at IS NULL
      ORDER BY u.first_name, u.last_name
      LIMIT ? OFFSET ?
    `;

    return await query(sql, [roleId, limit, offset]);
  }

  // ===================================================================
  // OBTENER ESTADÍSTICAS
  // ===================================================================
  
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_roles,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_roles,
        COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_roles
      FROM roles 
      WHERE deleted_at IS NULL
    `;

    const result = await query(sql);
    return result[0];
  }

  // ===================================================================
  // VERIFICAR SI SLUG EXISTE
  // ===================================================================
  
  static async slugExists(slug, excludeId = null) {
    let sql = `
      SELECT id FROM roles 
      WHERE slug = ? AND deleted_at IS NULL
    `;
    let params = [slug];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    const result = await query(sql, params);
    return result.length > 0;
  }

  // ===================================================================
  // VERIFICAR SI NOMBRE EXISTE
  // ===================================================================
  
  static async nameExists(name, excludeId = null) {
    let sql = `
      SELECT id FROM roles 
      WHERE name = ? AND deleted_at IS NULL
    `;
    let params = [name];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    const result = await query(sql, params);
    return result.length > 0;
  }

  // ===================================================================
  // VERIFICAR SI ROL TIENE USUARIOS ASIGNADOS
  // ===================================================================
  
  static async hasUsers(roleId) {
    const sql = `
      SELECT COUNT(*) as user_count
      FROM user_roles ur
      INNER JOIN users u ON ur.user_id = u.id
      WHERE ur.role_id = ? AND u.deleted_at IS NULL
    `;

    const result = await query(sql, [roleId]);
    return result[0].user_count > 0;
  }

  // ===================================================================
  // LISTAR TODOS LOS ROLES ACTIVOS (SIN PAGINACIÓN)
  // ===================================================================
  
  static async findAllActive() {
    const sql = `
      SELECT 
        r.id, r.name, r.slug, r.description
      FROM roles r
      WHERE r.is_active = 1 AND r.deleted_at IS NULL
      ORDER BY r.name ASC
    `;

    return await query(sql);
  }

  // ===================================================================
  // OBTENER MÓDULOS CON PERMISOS AGRUPADOS
  // ===================================================================
  
  static async getModulesWithPermissions(roleId) {
    const sql = `
      SELECT 
        p.module,
        p.id as permission_id,
        p.name as permission_name,
        p.slug as permission_slug,
        p.description as permission_description,
        CASE WHEN rp.id IS NOT NULL THEN 1 ELSE 0 END as is_assigned
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id AND rp.role_id = ?
      WHERE p.deleted_at IS NULL AND p.is_active = 1
      ORDER BY p.module, p.name
    `;

    const permissions = await query(sql, [roleId]);

    // Agrupar por módulo
    const modules = {};
    permissions.forEach(perm => {
      if (!modules[perm.module]) {
        modules[perm.module] = {
          module: perm.module,
          permissions: []
        };
      }
      modules[perm.module].permissions.push({
        id: perm.permission_id,
        name: perm.permission_name,
        slug: perm.permission_slug,
        description: perm.permission_description,
        is_assigned: perm.is_assigned === 1
      });
    });

    return Object.values(modules);
  }
}

// ===================================================================
// EXPORTAR MODELO
// ===================================================================

module.exports = RoleModel;
