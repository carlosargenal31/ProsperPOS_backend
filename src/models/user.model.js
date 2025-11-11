// ===================================================================
// PROSPERPOS - MODELO DE USUARIO
// ===================================================================

const { query } = require('../utils/database');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

// ===================================================================
// CLASE MODELO USUARIO
// ===================================================================

class UserModel {
  
  // ===================================================================
  // CREAR USUARIO
  // ===================================================================
  
  static async create(userData) {
    const {
      first_name,
      last_name,
      email,
      password,
      phone = null,
      role_id = 2, // Usuario por defecto
      store_id = 1,
      status = 'active',
      avatar = null,
      created_by
    } = userData;

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    const sql = `
      INSERT INTO users (
        first_name, last_name, email, password, phone,
        role_id, store_id, status, avatar, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      first_name, last_name, email, hashedPassword, phone,
      role_id, store_id, status, avatar, created_by
    ];

    const result = await query(sql, values);
    
    // Obtener el usuario creado sin la contraseña
    return await this.findById(result.insertId);
  }

  // ===================================================================
  // BUSCAR POR ID
  // ===================================================================
  
  static async findById(id, options = {}) {
    const {
      includeRoles = false,
      includePermissions = false,
      includeStats = false
    } = options;

    let sql = `
      SELECT 
        u.id, u.first_name, u.last_name, u.email, u.phone,
        u.role_id, u.store_id, u.status, u.avatar, u.last_login,
        u.created_at, u.updated_at,
        s.name as store_name,
        CONCAT(u.first_name, ' ', u.last_name) as full_name
      FROM users u
      LEFT JOIN stores s ON u.store_id = s.id
      WHERE u.id = ? AND u.deleted_at IS NULL
    `;

    const users = await query(sql, [id]);
    if (users.length === 0) return null;

    let user = users[0];

    // Incluir roles si se solicita
    if (includeRoles) {
      const rolesSql = `
        SELECT r.id, r.name, r.description, r.permissions
        FROM roles r
        INNER JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = ? AND r.deleted_at IS NULL
      `;
      
      user.roles = await query(rolesSql, [id]);
    }

    // Incluir permisos si se solicita
    if (includePermissions) {
      const permissionsSql = `
        SELECT DISTINCT p.name, p.description
        FROM permissions p
        INNER JOIN role_permissions rp ON p.id = rp.permission_id
        INNER JOIN user_roles ur ON rp.role_id = ur.role_id
        WHERE ur.user_id = ? AND p.deleted_at IS NULL
      `;
      
      user.permissions = await query(permissionsSql, [id]);
    }

    // Incluir estadísticas si se solicita
    if (includeStats) {
      const statsSql = `
        SELECT 
          COUNT(DISTINCT s.id) as total_sales,
          COALESCE(SUM(s.total), 0) as total_sales_amount,
          COUNT(DISTINCT DATE(s.created_at)) as days_active
        FROM sales s
        WHERE s.user_id = ? AND s.deleted_at IS NULL
      `;
      
      const stats = await query(statsSql, [id]);
      user.stats = stats[0] || { total_sales: 0, total_sales_amount: 0, days_active: 0 };
    }

    return user;
  }

  // ===================================================================
  // BUSCAR POR EMAIL
  // ===================================================================
  
  static async findByEmail(email, includePassword = false) {
    const passwordField = includePassword ? ', u.password' : '';
    
    const sql = `
      SELECT 
        u.id, u.first_name, u.last_name, u.email, u.phone,
        u.role_id, u.store_id, u.status, u.avatar, u.last_login,
        u.created_at, u.updated_at,
        s.name as store_name,
        CONCAT(u.first_name, ' ', u.last_name) as full_name
        ${passwordField}
      FROM users u
      LEFT JOIN stores s ON u.store_id = s.id
      WHERE u.email = ? AND u.deleted_at IS NULL
    `;

    const users = await query(sql, [email]);
    return users.length > 0 ? users[0] : null;
  }

   // ===================================================================
  // LISTAR USUARIOS CON FILTROS (VERSIÓN DEFINITIVA)
  // ===================================================================
  
  static async findAll(filters = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      status = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = filters;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Construir condiciones WHERE
    let whereConditions = ['u.deleted_at IS NULL'];
    let params = [];

    if (search) {
      whereConditions.push(`(
        u.first_name LIKE ? OR 
        u.last_name LIKE ? OR 
        u.email LIKE ? OR
        CONCAT(u.first_name, ' ', u.last_name) LIKE ?
      )`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (role) {
      whereConditions.push('u.role_id = ?');
      params.push(parseInt(role, 10));
    }

    if (status) {
      whereConditions.push('u.status = ?');
      params.push(status);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const validSortColumns = ['first_name', 'last_name', 'email', 'status', 'created_at', 'last_login'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // ✅ SOLUCIÓN: Poner limit y offset directamente en el SQL
    const sql = `
      SELECT 
        u.id, u.first_name, u.last_name, u.email, u.phone,
        u.role_id, u.store_id, u.status, u.avatar, u.last_login,
        u.created_at, u.updated_at,
        s.name as store_name,
        r.name as role_name,
        CONCAT(u.first_name, ' ', u.last_name) as full_name
      FROM users u
      LEFT JOIN stores s ON u.store_id = s.id
      LEFT JOIN roles r ON u.role_id = r.id
      ${whereClause}
      ORDER BY u.${sortColumn} ${sortDirection}
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `;

    const [users, countResult] = await Promise.all([
      query(sql, params),
      query(countSql, params)
    ]);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limitNum);

    return {
      data: users,
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
  // ACTUALIZAR USUARIO
  // ===================================================================
  
  static async update(id, updateData) {
    const {
      first_name,
      last_name,
      email,
      phone,
      role_id,
      store_id,
      status,
      avatar,
      updated_by
    } = updateData;

    // Construir query dinámicamente
    const updateFields = [];
    const values = [];

    if (first_name !== undefined) {
      updateFields.push('first_name = ?');
      values.push(first_name);
    }
    if (last_name !== undefined) {
      updateFields.push('last_name = ?');
      values.push(last_name);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      values.push(email);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      values.push(phone);
    }
    if (role_id !== undefined) {
      updateFields.push('role_id = ?');
      values.push(role_id);
    }
    if (store_id !== undefined) {
      updateFields.push('store_id = ?');
      values.push(store_id);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      values.push(status);
    }
    if (avatar !== undefined) {
      updateFields.push('avatar = ?');
      values.push(avatar);
    }

    // Agregar campos de auditoría
    updateFields.push('updated_by = ?', 'updated_at = NOW()');
    values.push(updated_by, id);

    const sql = `
      UPDATE users 
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
      UPDATE users 
      SET deleted_at = NOW(), deleted_by = ?
      WHERE id = ? AND deleted_at IS NULL
    `;

    const result = await query(sql, [deletedBy, id]);
    return result.affectedRows > 0;
  }

  // ===================================================================
  // CAMBIAR CONTRASEÑA
  // ===================================================================
  
  static async updatePassword(id, newPassword, updatedBy) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const sql = `
      UPDATE users 
      SET password = ?, updated_by = ?, updated_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
    `;

    const result = await query(sql, [hashedPassword, updatedBy, id]);
    return result.affectedRows > 0;
  }

  // ===================================================================
  // ACTUALIZAR ÚLTIMO LOGIN
  // ===================================================================
  
  static async updateLastLogin(id) {
    const sql = `
      UPDATE users 
      SET last_login = NOW()
      WHERE id = ? AND deleted_at IS NULL
    `;

    await query(sql, [id]);
  }

  // ===================================================================
  // VERIFICAR CONTRASEÑA
  // ===================================================================
  
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // ===================================================================
  // OBTENER ESTADÍSTICAS
  // ===================================================================
  
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_users,
        COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_users,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as users_today,
        COUNT(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as users_this_week,
        COUNT(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as users_this_month
      FROM users 
      WHERE deleted_at IS NULL
    `;

    const result = await query(sql);
    return result[0];
  }

  // ===================================================================
  // VERIFICAR SI EMAIL EXISTE
  // ===================================================================
  
  static async emailExists(email, excludeId = null) {
    let sql = `
      SELECT id FROM users 
      WHERE email = ? AND deleted_at IS NULL
    `;
    let params = [email];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    const result = await query(sql, params);
    return result.length > 0;
  }

  // ===================================================================
  // OBTENER USUARIOS POR ROL
  // ===================================================================
  
  static async findByRole(roleId) {
    const sql = `
      SELECT 
        u.id, u.first_name, u.last_name, u.email, u.status,
        CONCAT(u.first_name, ' ', u.last_name) as full_name
      FROM users u
      WHERE u.role_id = ? AND u.status = 'active' AND u.deleted_at IS NULL
      ORDER BY u.first_name, u.last_name
    `;

    return await query(sql, [roleId]);
  }
}

// ===================================================================
// EXPORTAR MODELO
// ===================================================================

module.exports = UserModel;