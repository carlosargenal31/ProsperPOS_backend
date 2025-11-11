// ===================================================================
// PROSPERPOS - SERVICIO DE UNIDADES
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class UnitService {

  /**
   * Obtener todas las unidades con filtros
   */
  static async getUnits(filters = {}) {
    try {
      const {
        search = '',
        is_active = null
      } = filters;

      let whereClause = 'WHERE u.deleted_at IS NULL';
      const params = [];

      if (search) {
        whereClause += ' AND u.name LIKE ?';
        params.push(`%${search}%`);
      }

      if (is_active !== null) {
        whereClause += ' AND u.is_active = ?';
        params.push(is_active ? 1 : 0);
      }

      const query = `
        SELECT
          u.id,
          u.name,
          u.description,
          u.is_active,
          u.created_at,
          u.updated_at,
          0 as products_count
        FROM units u
        ${whereClause}
        ORDER BY u.id ASC
      `;

      const units = await db.execute(query, params);
      return units;

    } catch (error) {
      logger.error('Error in getUnits:', error);
      throw error;
    }
  }

  /**
   * Obtener unidad por ID
   */
  static async getUnitById(id) {
    try {
      const query = `
        SELECT
          u.*,
          0 as products_count
        FROM units u
        WHERE u.id = ? AND u.deleted_at IS NULL
      `;

      const rows = await db.execute(query, [id]);
      return rows[0] || null;

    } catch (error) {
      logger.error('Error in getUnitById:', error);
      throw error;
    }
  }

  /**
   * Crear nueva unidad
   */
  static async createUnit(unitData) {
    try {
      const {
        name,
        description,
        is_active = true,
        created_by
      } = unitData;

      // Verificar nombre duplicado (solo si el nombre está presente)
      if (name && name.trim()) {
        const existing = await db.execute(
          'SELECT id FROM units WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND deleted_at IS NULL',
          [name.trim()]
        );

        if (existing.length > 0) {
          throw new Error('Ya existe una unidad con ese nombre');
        }
      }

      // Insertar unidad
      const insertQuery = `
        INSERT INTO units (
          name, description,
          is_active, created_at
        ) VALUES (?, ?, ?, NOW())
      `;

      const result = await db.execute(insertQuery, [
        name,
        description || null,
        is_active ? 1 : 0
      ]);

      return {
        id: result.insertId,
        name
      };

    } catch (error) {
      logger.error('Error in createUnit:', error);
      throw error;
    }
  }

  /**
   * Actualizar unidad
   */
  static async updateUnit(id, unitData) {
    try {
      const {
        name,
        description,
        is_active,
        updated_by
      } = unitData;

      // Verificar que existe
      const existing = await db.execute(
        'SELECT id FROM units WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Unidad no encontrada');
      }

      // Verificar nombre duplicado
      const duplicate = await db.execute(
        'SELECT id FROM units WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND id != ? AND deleted_at IS NULL',
        [name, id]
      );

      if (duplicate.length > 0) {
        throw new Error('Ya existe otra unidad con ese nombre');
      }

      // Actualizar
      const updateQuery = `
        UPDATE units SET
          name = ?, description = ?,
          is_active = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await db.execute(updateQuery, [
        name,
        description || null,
        is_active ? 1 : 0,
        id
      ]);

      return { id, name };

    } catch (error) {
      logger.error('Error in updateUnit:', error);
      throw error;
    }
  }

  /**
   * Eliminar unidad (soft delete)
   */
  static async deleteUnit(id, deleted_by) {
    try {
      // Verificar que existe
      const existing = await db.execute(
        'SELECT id FROM units WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Unidad no encontrada');
      }

      // Verificar productos asociados (omitir por ahora, la columna unit_id no existe en products)
      // TODO: Agregar validación cuando se agregue unit_id a la tabla products

      // Soft delete
      await db.execute(
        'UPDATE units SET deleted_at = NOW() WHERE id = ?',
        [id]
      );

      return { success: true };

    } catch (error) {
      logger.error('Error in deleteUnit:', error);
      throw error;
    }
  }

  /**
   * Obtener unidades activas
   */
  static async getActiveUnits() {
    try {
      const query = `
        SELECT
          u.id,
          u.name,
          u.description,
          u.is_active
        FROM units u
        WHERE u.is_active = 1 AND u.deleted_at IS NULL
        ORDER BY u.name ASC
      `;

      const units = await db.execute(query);
      return units;

    } catch (error) {
      logger.error('Error in getActiveUnits:', error);
      throw error;
    }
  }
}

module.exports = UnitService;
