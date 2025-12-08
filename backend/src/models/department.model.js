// ===================================================================
// PROSPERPOS - MODELO DE DEPARTAMENTOS (RH)
// ===================================================================

const db = require('../utils/database');

class DepartmentModel {

  /**
   * Obtener todos los departamentos
   */
  static async getAll(filters = {}) {
    const { search = '', is_active = null } = filters;

    let whereClause = 'WHERE d.deleted_at IS NULL';
    const params = [];

    if (search) {
      whereClause += ' AND (d.nombre LIKE ? OR d.descripcion LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (is_active !== null) {
      whereClause += ' AND d.is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    const query = `
      SELECT d.*
      FROM hr_departments d
      ${whereClause}
      ORDER BY d.nombre ASC
    `;

    return await db.execute(query, params);
  }

  /**
   * Obtener departamento por ID
   */
  static async getById(id) {
    const query = `
      SELECT d.*
      FROM hr_departments d
      WHERE d.id = ? AND d.deleted_at IS NULL
    `;

    const rows = await db.execute(query, [id]);
    return rows[0] || null;
  }

  /**
   * Crear nuevo departamento
   */
  static async create(departmentData) {
    const query = `
      INSERT INTO hr_departments (
        nombre, descripcion, is_active, created_by, created_at
      ) VALUES (?, ?, ?, ?, NOW())
    `;

    const result = await db.execute(query, [
      departmentData.nombre,
      departmentData.descripcion || null,
      departmentData.is_active ? 1 : 0,
      departmentData.created_by
    ]);

    return result.insertId;
  }

  /**
   * Actualizar departamento
   */
  static async update(id, departmentData) {
    const query = `
      UPDATE hr_departments SET
        nombre = ?, descripcion = ?, is_active = ?,
        updated_by = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await db.execute(query, [
      departmentData.nombre,
      departmentData.descripcion || null,
      departmentData.is_active ? 1 : 0,
      departmentData.updated_by,
      id
    ]);

    return true;
  }

  /**
   * Eliminar departamento (soft delete)
   */
  static async delete(id, deleted_by) {
    const query = `
      UPDATE hr_departments SET
        deleted_at = NOW(), updated_by = ?
      WHERE id = ?
    `;

    await db.execute(query, [deleted_by, id]);
    return true;
  }

  /**
   * Obtener departamentos activos
   */
  static async getActive() {
    const query = `
      SELECT d.*
      FROM hr_departments d
      WHERE d.is_active = 1 AND d.deleted_at IS NULL
      ORDER BY d.nombre ASC
    `;

    return await db.execute(query);
  }
}

module.exports = DepartmentModel;
