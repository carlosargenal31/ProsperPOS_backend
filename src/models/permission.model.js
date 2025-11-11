// ===================================================================
// PROSPERPOS - MODELO DE PERMISOS
// ===================================================================

const { query } = require('../utils/database');
const logger = require('../utils/logger');

// ===================================================================
// CLASE MODELO PERMISOS
// ===================================================================

class PermissionModel {
  
  // ===================================================================
  // CREAR PERMISO
  // ===================================================================
  
  static async create(permissionData) {
    const {
      name,
      slug,
      module,
      description = null,
      is_active = 1
    } = permissionData;

    const sql = `
      INSERT INTO permissions (
        name, slug, module, description, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const values = [name, slug, module, description, is_active];

    const result = await query(sql, values);
    
    return await this.findById(result.insertId);
  }

  // ===================================================================
  // BUSCAR POR ID
  // ===================================================================
  
  static async findById(id, options = {}) {
    const { includeRoleCount = false } = options;

    let sql = `
      SELECT 
        p.id, p.name, p.slug, p.module, p.description, p.is_active,
        p.created_at, p.updated_at
      FROM permissions p
      WHERE p.id = ? AND p.deleted_at IS NULL
    `;

    const permissions = await query(sql, [id]);
    if (permissions.length === 0) return null;

    let permission = permissions[0];

    // Incluir conteo de roles si se solicita
    if (includeRoleCount) {
      const roleCountSql = `
        SELECT COUNT(*) as role_count
        FROM role_permissions rp
        INNER JOIN roles r ON rp.role_id = r.id
        WHERE rp.permission_id = ? AND r.deleted_at IS NULL
      `;
      
      const countResult = await query(roleCountSql, [id]);
      permission.role_count = countResult[0].role_count;
    }

    return permission;
  }

  // ===================================================================
  // BUSCAR POR SLUG
  // ===================================================================
  
  static async findBySlug(slug) {
    const sql = `
      SELECT 
        p.id, p.name, p.slug, p.module, p.description, p.is_active,
        p.created_at, p.updated_at
      FROM permissions p
      WHERE p.slug = ? AND p.deleted_at IS NULL
    `;

    const permissions = await query(sql, [slug]);
    return permissions.length > 0 ? permissions[0] : null;
  }

  // ===================================================================
  // BUSCAR POR NAME
  // ===================================================================
  
  static async findByName(name) {
    const sql = `
      SELECT 
        p.id, p.name, p.slug, p.module, p.description, p.is_active,
        p.created_at, p.updated_at
      FROM permissions p
      WHERE p.name = ? AND p.deleted_at IS NULL
    `;

    const permissions = await query(sql, [name]);
    return permissions.length > 0 ? permissions[0] : null;
  }

  // ===================================================================
  // LISTAR PERMISOS CON FILTROS
  // ===================================================================
  
  static async findAll(filters = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      module = '',
      status = '',
      sortBy = 'module',
      sortOrder = 'ASC'
    } = filters;

    const offset = (page - 1) * limit;

    // Construir condiciones WHERE
    let whereConditions = ['p.deleted_at IS NULL'];
    let params = [];

    if (search) {
      whereConditions.push(`(
        p.name LIKE ? OR 
        p.slug LIKE ? OR 
        p.description LIKE ? OR
        p.module LIKE ?
      )`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (module) {
      whereConditions.push('p.module = ?');
      params.push(module);
    }

    if (status !== '') {
      whereConditions.push('p.is_active = ?');
      params.push(status === 'active' ? 1 : 0);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Validar columna de ordenamiento
    const validSortColumns = ['name', 'slug', 'module', 'created_at', 'updated_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'module';
    const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Query principal con conteo de roles
    const sql = `
      SELECT 
        p.id, p.name, p.slug, p.module, p.description, p.is_active,
        p.created_at, p.updated_at,
        COUNT(DISTINCT rp.role_id) as role_count
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.${sortColumn} ${sortDirection}, p.name ASC
      LIMIT ? OFFSET ?
    `;

    // Query para contar total
    const countSql = `
      SELECT COUNT(*) as total
      FROM permissions p
      ${whereClause}
    `;

    const [permissions, countResult] = await Promise.all([
      query(sql, [...params, limit, offset]),
      query(countSql, params)
    ]);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    return {
      data: permissions,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }

  // ===================================================================
  // ACTUALIZAR PERMISO
  // ===================================================================
  
  static async update(id, updateData) {
    const {
      name,
      slug,
      module,
      description,
      is_active
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
    if (module !== undefined) {
      updateFields.push('module = ?');
      values.push(module);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      values.push(description);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      values.push(is_active);
    }

    // Agregar campo de auditoría
    updateFields.push('updated_at = NOW()');
    values.push(id);

    const sql = `
      UPDATE permissions 
      SET ${updateFields.join(', ')}
      WHERE id = ? AND deleted_at IS NULL
    `;

    await query(sql, values);
    
    return await this.findById(id);
  }

  // ===================================================================
  // SOFT DELETE
  // ===================================================================
  
  static async softDelete(id) {
    const sql = `
      UPDATE permissions 
      SET deleted_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
    `;

    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  }

  // ===================================================================
  // OBTENER ROLES CON ESTE PERMISO
  // ===================================================================
  
  static async getRoles(permissionId, options = {}) {
    const { limit = 50, offset = 0 } = options;

    const sql = `
      SELECT 
        r.id, r.name, r.slug, r.description, r.is_active
      FROM roles r
      INNER JOIN role_permissions rp ON r.id = rp.role_id
      WHERE rp.permission_id = ? AND r.deleted_at IS NULL
      ORDER BY r.name
      LIMIT ? OFFSET ?
    `;

    return await query(sql, [permissionId, limit, offset]);
  }

  // ===================================================================
  // OBTENER ESTADÍSTICAS
  // ===================================================================
  
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_permissions,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_permissions,
        COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_permissions,
        COUNT(DISTINCT module) as total_modules
      FROM permissions 
      WHERE deleted_at IS NULL
    `;

    const result = await query(sql);
    return result[0];
  }

  // ===================================================================
  // OBTENER PERMISOS POR MÓDULO
  // ===================================================================
  
  static async getByModule(module) {
    const sql = `
      SELECT 
        p.id, p.name, p.slug, p.description, p.is_active
      FROM permissions p
      WHERE p.module = ? AND p.deleted_at IS NULL
      ORDER BY p.name
    `;

    return await query(sql, [module]);
  }

  // ===================================================================
  // OBTENER TODOS LOS MÓDULOS
  // ===================================================================
  
  static async getAllModules() {
    const sql = `
      SELECT 
        module,
        COUNT(*) as permission_count
      FROM permissions
      WHERE deleted_at IS NULL
      GROUP BY module
      ORDER BY module
    `;

    return await query(sql);
  }

  // ===================================================================
  // VERIFICAR SI SLUG EXISTE
  // ===================================================================
  
  static async slugExists(slug, excludeId = null) {
    let sql = `
      SELECT id FROM permissions 
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
  // VERIFICAR SI NAME EXISTE
  // ===================================================================
  
  static async nameExists(name, excludeId = null) {
    let sql = `
      SELECT id FROM permissions 
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
  // VERIFICAR SI PERMISO TIENE ROLES ASIGNADOS
  // ===================================================================
  
  static async hasRoles(permissionId) {
    const sql = `
      SELECT COUNT(*) as role_count
      FROM role_permissions rp
      INNER JOIN roles r ON rp.role_id = r.id
      WHERE rp.permission_id = ? AND r.deleted_at IS NULL
    `;

    const result = await query(sql, [permissionId]);
    return result[0].role_count > 0;
  }

  // ===================================================================
  // LISTAR TODOS LOS PERMISOS ACTIVOS (SIN PAGINACIÓN)
  // ===================================================================
  
  static async findAllActive() {
    const sql = `
      SELECT 
        p.id, p.name, p.slug, p.module, p.description
      FROM permissions p
      WHERE p.is_active = 1 AND p.deleted_at IS NULL
      ORDER BY p.module, p.name
    `;

    return await query(sql);
  }

  // ===================================================================
  // OBTENER PERMISOS AGRUPADOS POR MÓDULO
  // ===================================================================
  
  static async findAllGroupedByModule() {
    const sql = `
      SELECT 
        p.id, p.name, p.slug, p.module, p.description, p.is_active
      FROM permissions p
      WHERE p.deleted_at IS NULL AND p.is_active = 1
      ORDER BY p.module, p.name
    `;

    const permissions = await query(sql);

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
        id: perm.id,
        name: perm.name,
        slug: perm.slug,
        description: perm.description
      });
    });

    return Object.values(modules);
  }
}

// ===================================================================
// EXPORTAR MODELO
// ===================================================================

module.exports = PermissionModel;