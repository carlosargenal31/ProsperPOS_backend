// ===================================================================
// PROSPERPOS - MODELO DE CARGOS/PUESTOS (RH)
// ===================================================================

const db = require('../utils/database');

class PositionModel {

  /**
   * Obtener todos los cargos
   */
  static async getAll(filters = {}) {
    const { search = '', is_active = null, department_id = null } = filters;

    let whereClause = 'WHERE p.deleted_at IS NULL';
    const params = [];

    if (search) {
      whereClause += ' AND (p.nombre LIKE ? OR p.descripcion LIKE ? OR d.nombre LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (is_active !== null) {
      whereClause += ' AND p.is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    if (department_id) {
      whereClause += ' AND p.department_id = ?';
      params.push(department_id);
    }

    const query = `
      SELECT p.*, d.nombre as department_name
      FROM hr_positions p
      LEFT JOIN hr_departments d ON p.department_id = d.id AND d.deleted_at IS NULL
      ${whereClause}
      ORDER BY p.nombre ASC
    `;

    return await db.execute(query, params);
  }

  /**
   * Obtener cargo por ID
   */
  static async getById(id) {
    const query = `
      SELECT p.*, d.nombre as department_name
      FROM hr_positions p
      LEFT JOIN hr_departments d ON p.department_id = d.id AND d.deleted_at IS NULL
      WHERE p.id = ? AND p.deleted_at IS NULL
    `;

    const rows = await db.execute(query, [id]);
    return rows[0] || null;
  }

  /**
   * Crear nuevo cargo
   */
  static async create(positionData) {
    const query = `
      INSERT INTO hr_positions (
        nombre, descripcion, department_id, is_active, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const result = await db.execute(query, [
      positionData.nombre,
      positionData.descripcion || null,
      positionData.department_id || null,
      positionData.is_active ? 1 : 0,
      positionData.created_by
    ]);

    return result.insertId;
  }

  /**
   * Actualizar cargo
   */
  static async update(id, positionData) {
    const query = `
      UPDATE hr_positions SET
        nombre = ?, descripcion = ?, department_id = ?, is_active = ?,
        updated_by = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await db.execute(query, [
      positionData.nombre,
      positionData.descripcion || null,
      positionData.department_id || null,
      positionData.is_active ? 1 : 0,
      positionData.updated_by,
      id
    ]);

    return true;
  }

  /**
   * Eliminar cargo (soft delete)
   */
  static async delete(id, deleted_by) {
    const query = `
      UPDATE hr_positions SET
        deleted_at = NOW(), updated_by = ?
      WHERE id = ?
    `;

    await db.execute(query, [deleted_by, id]);
    return true;
  }

  /**
   * Obtener cargos activos
   */
  static async getActive() {
    const query = `
      SELECT p.*, d.nombre as department_name
      FROM hr_positions p
      LEFT JOIN hr_departments d ON p.department_id = d.id AND d.deleted_at IS NULL
      WHERE p.is_active = 1 AND p.deleted_at IS NULL
      ORDER BY p.nombre ASC
    `;

    return await db.execute(query);
  }

  /**
   * Obtener cargos por departamento
   */
  static async getByDepartment(department_id) {
    const query = `
      SELECT p.*
      FROM hr_positions p
      WHERE p.department_id = ? AND p.is_active = 1 AND p.deleted_at IS NULL
      ORDER BY p.nombre ASC
    `;

    return await db.execute(query, [department_id]);
  }
}

module.exports = PositionModel;
