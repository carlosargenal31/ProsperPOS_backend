// ===================================================================
// PROSPERPOS - SERVICIO DE CARGOS/PUESTOS (RH)
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class PositionService {

  /**
   * Obtener todos los cargos con filtros
   */
  static async getPositions(filters = {}) {
    try {
      const {
        search = '',
        is_active = null,
        department_id = null
      } = filters;

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
        SELECT p.*,
          d.nombre as department_name,
          (SELECT COUNT(*) FROM hr_employees WHERE position_id = p.id AND deleted_at IS NULL) as employees_count
        FROM hr_positions p
        LEFT JOIN hr_departments d ON p.department_id = d.id AND d.deleted_at IS NULL
        ${whereClause}
        ORDER BY p.id ASC
      `;

      const positions = await db.execute(query, params);
      return positions;

    } catch (error) {
      logger.error('Error in getPositions:', error);
      throw error;
    }
  }

  /**
   * Obtener cargo por ID
   */
  static async getPositionById(id) {
    try {
      const query = `
        SELECT p.*,
          d.nombre as department_name,
          (SELECT COUNT(*) FROM hr_employees WHERE position_id = p.id AND deleted_at IS NULL) as employees_count
        FROM hr_positions p
        LEFT JOIN hr_departments d ON p.department_id = d.id AND d.deleted_at IS NULL
        WHERE p.id = ? AND p.deleted_at IS NULL
      `;

      const rows = await db.execute(query, [id]);
      return rows[0] || null;

    } catch (error) {
      logger.error('Error in getPositionById:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo cargo
   */
  static async createPosition(positionData) {
    try {
      const {
        nombre,
        descripcion = null,
        department_id = null,
        is_active = true,
        created_by
      } = positionData;

      // Insertar cargo
      const insertQuery = `
        INSERT INTO hr_positions (
          nombre, descripcion, department_id, is_active, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())
      `;

      const result = await db.execute(insertQuery, [
        nombre,
        descripcion,
        department_id,
        is_active ? 1 : 0,
        created_by || 1
      ]);

      return {
        id: result.insertId,
        nombre
      };

    } catch (error) {
      logger.error('Error in createPosition:', error);
      throw error;
    }
  }

  /**
   * Actualizar cargo
   */
  static async updatePosition(id, positionData) {
    try {
      const {
        nombre,
        descripcion,
        department_id,
        is_active,
        updated_by
      } = positionData;

      // Verificar que existe
      const existing = await db.execute(
        'SELECT id FROM hr_positions WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Cargo no encontrado');
      }

      // Actualizar
      const updateQuery = `
        UPDATE hr_positions SET
          nombre = ?, descripcion = ?, department_id = ?, is_active = ?,
          updated_by = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await db.execute(updateQuery, [
        nombre,
        descripcion,
        department_id,
        is_active ? 1 : 0,
        updated_by || 1,
        id
      ]);

      return { id, nombre };

    } catch (error) {
      logger.error('Error in updatePosition:', error);
      throw error;
    }
  }

  /**
   * Eliminar cargo (soft delete)
   */
  static async deletePosition(id, deleted_by) {
    try {
      // Verificar que existe
      const existing = await db.execute(
        'SELECT id FROM hr_positions WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Cargo no encontrado');
      }

      // Soft delete
      await db.execute(
        'UPDATE hr_positions SET deleted_at = NOW(), updated_by = ? WHERE id = ?',
        [deleted_by, id]
      );

      return { success: true };

    } catch (error) {
      logger.error('Error in deletePosition:', error);
      throw error;
    }
  }

  /**
   * Obtener cargos activos
   */
  static async getActivePositions() {
    try {
      const query = `
        SELECT
          p.id,
          p.nombre,
          p.descripcion,
          p.department_id,
          d.nombre as department_name,
          p.is_active
        FROM hr_positions p
        LEFT JOIN hr_departments d ON p.department_id = d.id AND d.deleted_at IS NULL
        WHERE p.is_active = 1 AND p.deleted_at IS NULL
        ORDER BY p.id ASC
      `;

      const positions = await db.execute(query);
      return positions;

    } catch (error) {
      logger.error('Error in getActivePositions:', error);
      throw error;
    }
  }

  /**
   * Obtener cargos por departamento
   */
  static async getPositionsByDepartment(department_id) {
    try {
      const query = `
        SELECT p.*
        FROM hr_positions p
        WHERE p.department_id = ? AND p.is_active = 1 AND p.deleted_at IS NULL
        ORDER BY p.id ASC
      `;

      const positions = await db.execute(query, [department_id]);
      return positions;

    } catch (error) {
      logger.error('Error in getPositionsByDepartment:', error);
      throw error;
    }
  }
}

module.exports = PositionService;
