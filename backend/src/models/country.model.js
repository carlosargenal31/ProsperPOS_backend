// ===================================================================
// PROSPERPOS - MODELO DE PAÍSES
// ===================================================================

const db = require('../utils/database');

class CountryModel {

  /**
   * Obtener todos los países
   */
  static async getAll(filters = {}) {
    const { search = '', is_active = null } = filters;

    let whereClause = 'WHERE c.deleted_at IS NULL';
    const params = [];

    if (search) {
      whereClause += ' AND (c.nombre LIKE ? OR c.codigo_iso LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (is_active !== null) {
      whereClause += ' AND c.is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    const query = `
      SELECT c.*
      FROM countries c
      ${whereClause}
      ORDER BY c.nombre ASC
    `;

    return await db.execute(query, params);
  }

  /**
   * Obtener país por ID
   */
  static async getById(id) {
    const query = `
      SELECT c.*
      FROM countries c
      WHERE c.id = ? AND c.deleted_at IS NULL
    `;

    const rows = await db.execute(query, [id]);
    return rows[0] || null;
  }

  /**
   * Crear nuevo país
   */
  static async create(countryData) {
    const query = `
      INSERT INTO countries (
        nombre, codigo_iso, is_active, created_by, created_at
      ) VALUES (?, ?, ?, ?, NOW())
    `;

    const result = await db.execute(query, [
      countryData.nombre,
      countryData.codigo_iso || null,
      countryData.is_active ? 1 : 0,
      countryData.created_by
    ]);

    return result.insertId;
  }

  /**
   * Actualizar país
   */
  static async update(id, countryData) {
    const query = `
      UPDATE countries SET
        nombre = ?, codigo_iso = ?, is_active = ?,
        updated_by = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await db.execute(query, [
      countryData.nombre,
      countryData.codigo_iso || null,
      countryData.is_active ? 1 : 0,
      countryData.updated_by,
      id
    ]);

    return true;
  }

  /**
   * Eliminar país (soft delete)
   */
  static async delete(id, deleted_by) {
    const query = `
      UPDATE countries SET
        deleted_at = NOW(), updated_by = ?
      WHERE id = ?
    `;

    await db.execute(query, [deleted_by, id]);
    return true;
  }

  /**
   * Obtener países activos
   */
  static async getActive() {
    const query = `
      SELECT c.*
      FROM countries c
      WHERE c.is_active = 1 AND c.deleted_at IS NULL
      ORDER BY c.nombre ASC
    `;

    return await db.execute(query);
  }
}

module.exports = CountryModel;
