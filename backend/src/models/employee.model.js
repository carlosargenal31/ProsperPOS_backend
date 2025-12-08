// ===================================================================
// PROSPERPOS - MODELO DE EMPLEADOS (RH)
// ===================================================================

const db = require('../utils/database');

class EmployeeModel {

  /**
   * Obtener todos los empleados
   */
  static async getAll(filters = {}) {
    const { search = '', is_active = null, department_id = null, position_id = null } = filters;

    let whereClause = 'WHERE e.deleted_at IS NULL';
    const params = [];

    if (search) {
      whereClause += ' AND (e.nombre LIKE ? OR e.apellido LIKE ? OR e.email LIKE ? OR e.telefono LIKE ? OR e.codigo LIKE ? OR e.dni LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (is_active !== null) {
      whereClause += ' AND e.is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    if (department_id) {
      whereClause += ' AND e.department_id = ?';
      params.push(department_id);
    }

    if (position_id) {
      whereClause += ' AND e.position_id = ?';
      params.push(position_id);
    }

    const query = `
      SELECT
        e.*,
        d.nombre as department_name,
        p.nombre as position_name
      FROM hr_employees e
      LEFT JOIN hr_departments d ON e.department_id = d.id AND d.deleted_at IS NULL
      LEFT JOIN hr_positions p ON e.position_id = p.id AND p.deleted_at IS NULL
      ${whereClause}
      ORDER BY e.nombre ASC, e.apellido ASC
    `;

    return await db.execute(query, params);
  }

  /**
   * Obtener empleado por ID
   */
  static async getById(id) {
    const query = `
      SELECT
        e.*,
        d.nombre as department_name,
        p.nombre as position_name
      FROM hr_employees e
      LEFT JOIN hr_departments d ON e.department_id = d.id AND d.deleted_at IS NULL
      LEFT JOIN hr_positions p ON e.position_id = p.id AND p.deleted_at IS NULL
      WHERE e.id = ? AND e.deleted_at IS NULL
    `;

    const rows = await db.execute(query, [id]);
    return rows[0] || null;
  }

  /**
   * Crear nuevo empleado
   */
  static async create(employeeData) {
    const query = `
      INSERT INTO hr_employees (
        codigo, nombre, apellido, dni, email, telefono,
        department_id, position_id, fecha_ingreso,
        salario, is_active, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const result = await db.execute(query, [
      employeeData.codigo || null,
      employeeData.nombre,
      employeeData.apellido || null,
      employeeData.dni || null,
      employeeData.email || null,
      employeeData.telefono || null,
      employeeData.department_id || null,
      employeeData.position_id || null,
      employeeData.fecha_ingreso || null,
      employeeData.salario || null,
      employeeData.is_active ? 1 : 0,
      employeeData.created_by
    ]);

    return result.insertId;
  }

  /**
   * Actualizar empleado
   */
  static async update(id, employeeData) {
    const query = `
      UPDATE hr_employees SET
        codigo = ?, nombre = ?, apellido = ?, dni = ?, email = ?, telefono = ?,
        department_id = ?, position_id = ?, fecha_ingreso = ?,
        salario = ?, is_active = ?,
        updated_by = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await db.execute(query, [
      employeeData.codigo || null,
      employeeData.nombre,
      employeeData.apellido || null,
      employeeData.dni || null,
      employeeData.email || null,
      employeeData.telefono || null,
      employeeData.department_id || null,
      employeeData.position_id || null,
      employeeData.fecha_ingreso || null,
      employeeData.salario || null,
      employeeData.is_active ? 1 : 0,
      employeeData.updated_by,
      id
    ]);

    return true;
  }

  /**
   * Eliminar empleado (soft delete)
   */
  static async delete(id, deleted_by) {
    const query = `
      UPDATE hr_employees SET
        deleted_at = NOW(), updated_by = ?
      WHERE id = ?
    `;

    await db.execute(query, [deleted_by, id]);
    return true;
  }

  /**
   * Obtener empleados activos
   */
  static async getActive() {
    const query = `
      SELECT
        e.*,
        d.nombre as department_name,
        p.nombre as position_name
      FROM hr_employees e
      LEFT JOIN hr_departments d ON e.department_id = d.id AND d.deleted_at IS NULL
      LEFT JOIN hr_positions p ON e.position_id = p.id AND p.deleted_at IS NULL
      WHERE e.is_active = 1 AND e.deleted_at IS NULL
      ORDER BY e.nombre ASC, e.apellido ASC
    `;

    return await db.execute(query);
  }

  /**
   * Verificar si el código de empleado ya existe
   */
  static async existsByCodigo(codigo, excludeId = null) {
    let query = `
      SELECT COUNT(*) as count
      FROM hr_employees
      WHERE codigo = ? AND deleted_at IS NULL
    `;
    const params = [codigo];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const rows = await db.execute(query, params);
    return rows[0].count > 0;
  }

  /**
   * Verificar si el email ya existe
   */
  static async existsByEmail(email, excludeId = null) {
    let query = `
      SELECT COUNT(*) as count
      FROM hr_employees
      WHERE email = ? AND deleted_at IS NULL
    `;
    const params = [email];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const rows = await db.execute(query, params);
    return rows[0].count > 0;
  }
}

module.exports = EmployeeModel;
