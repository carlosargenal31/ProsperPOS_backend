// ===================================================================
// PROSPERPOS - MODELO DE DEPARTAMENTOS
// ===================================================================

const db = require('../utils/database');

class StateModel {

  /**
   * Obtener todos los departamentos
   */
  static async getAll(filters = {}) {
    const { search = '', is_active = null, country_id = null } = filters;

    let whereClause = 'WHERE s.deleted_at IS NULL';
    const params = [];

    if (search) {
      whereClause += ' AND s.nombre LIKE ?';
      params.push(`%${search}%`);
    }

    if (is_active !== null) {
      whereClause += ' AND s.is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    if (country_id) {
      whereClause += ' AND s.country_id = ?';
      params.push(country_id);
    }

    const query = `
      SELECT s.*, c.nombre as country_name
      FROM states s
      LEFT JOIN countries c ON s.country_id = c.id
      ${whereClause}
      ORDER BY s.nombre ASC
    `;

    return await db.execute(query, params);
  }

  /**
   * Obtener departamento por ID
   */
  static async getById(id) {
    const query = `
      SELECT s.*, c.nombre as country_name
      FROM states s
      LEFT JOIN countries c ON s.country_id = c.id
      WHERE s.id = ? AND s.deleted_at IS NULL
    `;

    const rows = await db.execute(query, [id]);
    return rows[0] || null;
  }

  /**
   * Crear nuevo departamento
   */
  static async create(stateData) {
    const query = `
      INSERT INTO states (
        country_id, nombre, is_active, created_by, created_at
      ) VALUES (?, ?, ?, ?, NOW())
    `;

    const result = await db.execute(query, [
      stateData.country_id,
      stateData.nombre,
      stateData.is_active ? 1 : 0,
      stateData.created_by
    ]);

    return result.insertId;
  }

  /**
   * Actualizar departamento
   */
  static async update(id, stateData) {
    const query = `
      UPDATE states SET
        country_id = ?, nombre = ?, is_active = ?,
        updated_by = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await db.execute(query, [
      stateData.country_id,
      stateData.nombre,
      stateData.is_active ? 1 : 0,
      stateData.updated_by,
      id
    ]);

    return true;
  }

  /**
   * Eliminar departamento (soft delete)
   */
  static async delete(id, deleted_by) {
    const query = `
      UPDATE states SET
        deleted_at = NOW(), updated_by = ?
      WHERE id = ?
    `;

    await db.execute(query, [deleted_by, id]);
    return true;
  }

  /**
   * Obtener departamentos activos
   */
  static async getActive(country_id = null) {
    let query = `
      SELECT s.*
      FROM states s
      WHERE s.is_active = 1 AND s.deleted_at IS NULL
    `;
    const params = [];

    if (country_id) {
      query += ' AND s.country_id = ?';
      params.push(country_id);
    }

    query += ' ORDER BY s.nombre ASC';

    return await db.execute(query, params);
  }
}

module.exports = StateModel;
