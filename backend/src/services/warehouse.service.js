// ===================================================================
// PROSPERPOS - SERVICIO DE BODEGAS
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class WarehouseService {

  /**
   * Obtener todas las bodegas con filtros
   */
  static async getWarehouses(filters = {}) {
    try {
      const {
        search = '',
        is_active = null
      } = filters;

      let whereClause = 'WHERE w.deleted_at IS NULL';
      const params = [];

      if (search) {
        whereClause += ' AND (w.nombre LIKE ? OR w.ubicacion LIKE ? OR w.encargado LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (is_active !== null) {
        whereClause += ' AND w.is_active = ?';
        params.push(is_active ? 1 : 0);
      }

      const query = `
        SELECT w.*
        FROM warehouses w
        ${whereClause}
        ORDER BY w.id ASC
      `;

      const warehouses = await db.execute(query, params);
      return warehouses;

    } catch (error) {
      logger.error('Error in getWarehouses:', error);
      throw error;
    }
  }

  /**
   * Obtener bodega por ID
   */
  static async getWarehouseById(id) {
    try {
      const query = `
        SELECT w.*
        FROM warehouses w
        WHERE w.id = ? AND w.deleted_at IS NULL
      `;

      const rows = await db.execute(query, [id]);
      return rows[0] || null;

    } catch (error) {
      logger.error('Error in getWarehouseById:', error);
      throw error;
    }
  }

  /**
   * Crear nueva bodega
   */
  static async createWarehouse(warehouseData) {
    try {
      const {
        nombre,
        encargado = null,
        ubicacion = null,
        is_active = true,
        created_by
      } = warehouseData;

      // Insertar bodega
      const insertQuery = `
        INSERT INTO warehouses (
          nombre, encargado, ubicacion, is_active, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())
      `;

      const result = await db.execute(insertQuery, [
        nombre,
        encargado,
        ubicacion,
        is_active ? 1 : 0,
        created_by || 1
      ]);

      return {
        id: result.insertId,
        nombre
      };

    } catch (error) {
      logger.error('Error in createWarehouse:', error);
      throw error;
    }
  }

  /**
   * Actualizar bodega
   */
  static async updateWarehouse(id, warehouseData) {
    try {
      const {
        nombre,
        encargado,
        ubicacion,
        is_active,
        updated_by
      } = warehouseData;

      // Verificar que existe
      const existing = await db.execute(
        'SELECT id FROM warehouses WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Bodega no encontrada');
      }

      // Actualizar
      const updateQuery = `
        UPDATE warehouses SET
          nombre = ?, encargado = ?, ubicacion = ?, is_active = ?,
          updated_by = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await db.execute(updateQuery, [
        nombre,
        encargado,
        ubicacion,
        is_active ? 1 : 0,
        updated_by || 1,
        id
      ]);

      return { id, nombre };

    } catch (error) {
      logger.error('Error in updateWarehouse:', error);
      throw error;
    }
  }

  /**
   * Eliminar bodega (soft delete)
   */
  static async deleteWarehouse(id, deleted_by) {
    try {
      // Verificar que existe
      const existing = await db.execute(
        'SELECT id FROM warehouses WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Bodega no encontrada');
      }

      // Soft delete
      await db.execute(
        'UPDATE warehouses SET deleted_at = NOW(), updated_by = ? WHERE id = ?',
        [deleted_by, id]
      );

      return { success: true };

    } catch (error) {
      logger.error('Error in deleteWarehouse:', error);
      throw error;
    }
  }

  /**
   * Obtener bodegas activas
   */
  static async getActiveWarehouses() {
    try {
      const query = `
        SELECT
          w.id,
          w.nombre,
          w.encargado,
          w.ubicacion,
          w.is_active
        FROM warehouses w
        WHERE w.is_active = 1 AND w.deleted_at IS NULL
        ORDER BY w.id ASC
      `;

      const warehouses = await db.execute(query);
      return warehouses;

    } catch (error) {
      logger.error('Error in getActiveWarehouses:', error);
      throw error;
    }
  }
}

module.exports = WarehouseService;
