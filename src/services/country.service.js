// ===================================================================
// PROSPERPOS - SERVICIO DE PAÍSES
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class CountryService {

  /**
   * Obtener todos los países con filtros
   */
  static async getCountries(filters = {}) {
    try {
      const {
        search = '',
        is_active = null
      } = filters;

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
        SELECT c.*,
          (SELECT COUNT(*) FROM states WHERE country_id = c.id AND deleted_at IS NULL) as states_count
        FROM countries c
        ${whereClause}
        ORDER BY c.nombre ASC
      `;

      const countries = await db.execute(query, params);
      return countries;

    } catch (error) {
      logger.error('Error in getCountries:', error);
      throw error;
    }
  }

  /**
   * Obtener país por ID
   */
  static async getCountryById(id) {
    try {
      const query = `
        SELECT c.*,
          (SELECT COUNT(*) FROM states WHERE country_id = c.id AND deleted_at IS NULL) as states_count
        FROM countries c
        WHERE c.id = ? AND c.deleted_at IS NULL
      `;

      const rows = await db.execute(query, [id]);
      return rows[0] || null;

    } catch (error) {
      logger.error('Error in getCountryById:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo país
   */
  static async createCountry(countryData) {
    try {
      const {
        nombre,
        codigo_iso = null,
        is_active = true,
        created_by
      } = countryData;

      // Insertar país
      const insertQuery = `
        INSERT INTO countries (
          nombre, codigo_iso, is_active, created_by, created_at
        ) VALUES (?, ?, ?, ?, NOW())
      `;

      const result = await db.execute(insertQuery, [
        nombre,
        codigo_iso,
        is_active ? 1 : 0,
        created_by || 1
      ]);

      return {
        id: result.insertId,
        nombre
      };

    } catch (error) {
      logger.error('Error in createCountry:', error);
      throw error;
    }
  }

  /**
   * Actualizar país
   */
  static async updateCountry(id, countryData) {
    try {
      const {
        nombre,
        codigo_iso,
        is_active,
        updated_by
      } = countryData;

      // Verificar que existe
      const existing = await db.execute(
        'SELECT id FROM countries WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('País no encontrado');
      }

      // Actualizar
      const updateQuery = `
        UPDATE countries SET
          nombre = ?, codigo_iso = ?, is_active = ?,
          updated_by = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await db.execute(updateQuery, [
        nombre,
        codigo_iso,
        is_active ? 1 : 0,
        updated_by || 1,
        id
      ]);

      return { id, nombre };

    } catch (error) {
      logger.error('Error in updateCountry:', error);
      throw error;
    }
  }

  /**
   * Eliminar país (soft delete)
   */
  static async deleteCountry(id, deleted_by) {
    try {
      // Verificar que existe
      const existing = await db.execute(
        'SELECT id FROM countries WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('País no encontrado');
      }

      // Soft delete
      await db.execute(
        'UPDATE countries SET deleted_at = NOW(), updated_by = ? WHERE id = ?',
        [deleted_by, id]
      );

      return { success: true };

    } catch (error) {
      logger.error('Error in deleteCountry:', error);
      throw error;
    }
  }

  /**
   * Obtener países activos
   */
  static async getActiveCountries() {
    try {
      const query = `
        SELECT
          c.id,
          c.nombre,
          c.codigo_iso,
          c.is_active
        FROM countries c
        WHERE c.is_active = 1 AND c.deleted_at IS NULL
        ORDER BY c.nombre ASC
      `;

      const countries = await db.execute(query);
      return countries;

    } catch (error) {
      logger.error('Error in getActiveCountries:', error);
      throw error;
    }
  }
}

module.exports = CountryService;
