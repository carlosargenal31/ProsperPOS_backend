// ===================================================================
// PROSPERPOS - MODELO DE CIUDADES/MUNICIPIOS
// ===================================================================

const db = require('../utils/database');

class CityModel {

  /**
   * Obtener todas las ciudades
   */
  static async getAll(filters = {}) {
    const { search = '', is_active = null, state_id = null } = filters;

    let whereClause = 'WHERE c.deleted_at IS NULL';
    const params = [];

    if (search) {
      whereClause += ' AND c.nombre LIKE ?';
      params.push(`%${search}%`);
    }

    if (is_active !== null) {
      whereClause += ' AND c.is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    if (state_id) {
      whereClause += ' AND c.state_id = ?';
      params.push(state_id);
    }

    const query = `
      SELECT c.*, s.nombre as state_name, co.nombre as country_name
      FROM cities c
      LEFT JOIN states s ON c.state_id = s.id
      LEFT JOIN countries co ON s.country_id = co.id
      ${whereClause}
      ORDER BY c.nombre ASC
    `;

    return await db.execute(query, params);
  }

  /**
   * Obtener ciudad por ID
   */
  static async getById(id) {
    const query = `
      SELECT c.*, s.nombre as state_name, co.nombre as country_name
      FROM cities c
      LEFT JOIN states s ON c.state_id = s.id
      LEFT JOIN countries co ON s.country_id = co.id
      WHERE c.id = ? AND c.deleted_at IS NULL
    `;

    const rows = await db.execute(query, [id]);
    return rows[0] || null;
  }

  /**
   * Crear nueva ciudad
   */
  static async create(cityData) {
    const query = `
      INSERT INTO cities (
        state_id, nombre, is_active, created_by, created_at
      ) VALUES (?, ?, ?, ?, NOW())
    `;

    const result = await db.execute(query, [
      cityData.state_id,
      cityData.nombre,
      cityData.is_active ? 1 : 0,
      cityData.created_by
    ]);

    return result.insertId;
  }

  /**
   * Actualizar ciudad
   */
  static async update(id, cityData) {
    const query = `
      UPDATE cities SET
        state_id = ?, nombre = ?, is_active = ?,
        updated_by = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await db.execute(query, [
      cityData.state_id,
      cityData.nombre,
      cityData.is_active ? 1 : 0,
      cityData.updated_by,
      id
    ]);

    return true;
  }

  /**
   * Eliminar ciudad (soft delete)
   */
  static async delete(id, deleted_by) {
    const query = `
      UPDATE cities SET
        deleted_at = NOW(), updated_by = ?
      WHERE id = ?
    `;

    await db.execute(query, [deleted_by, id]);
    return true;
  }

  /**
   * Obtener ciudades activas
   */
  static async getActive(state_id = null) {
    let query = `
      SELECT c.*
      FROM cities c
      WHERE c.is_active = 1 AND c.deleted_at IS NULL
    `;
    const params = [];

    if (state_id) {
      query += ' AND c.state_id = ?';
      params.push(state_id);
    }

    query += ' ORDER BY c.nombre ASC';

    return await db.execute(query, params);
  }
}

module.exports = CityModel;
