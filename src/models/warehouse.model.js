// ===================================================================
// PROSPERPOS - MODELO DE BODEGAS
// ===================================================================

const db = require('../utils/database');

class WarehouseModel {

  /**
   * Obtener todas las bodegas
   */
  static async getAll(filters = {}) {
    const { search = '', is_active = null } = filters;

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

    return await db.execute(query, params);
  }

  /**
   * Obtener bodega por ID
   */
  static async getById(id) {
    const query = `
      SELECT w.*
      FROM warehouses w
      WHERE w.id = ? AND w.deleted_at IS NULL
    `;

    const rows = await db.execute(query, [id]);
    return rows[0] || null;
  }

  /**
   * Crear nueva bodega
   */
  static async create(warehouseData) {
    const query = `
      INSERT INTO warehouses (
        nombre, encargado, ubicacion, is_active, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const result = await db.execute(query, [
      warehouseData.nombre,
      warehouseData.encargado || null,
      warehouseData.ubicacion || null,
      warehouseData.is_active ? 1 : 0,
      warehouseData.created_by
    ]);

    return result.insertId;
  }

  /**
   * Actualizar bodega
   */
  static async update(id, warehouseData) {
    const query = `
      UPDATE warehouses SET
        nombre = ?, encargado = ?, ubicacion = ?, is_active = ?,
        updated_by = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await db.execute(query, [
      warehouseData.nombre,
      warehouseData.encargado || null,
      warehouseData.ubicacion || null,
      warehouseData.is_active ? 1 : 0,
      warehouseData.updated_by,
      id
    ]);

    return true;
  }

  /**
   * Eliminar bodega (soft delete)
   */
  static async delete(id, deleted_by) {
    const query = `
      UPDATE warehouses SET
        deleted_at = NOW(), updated_by = ?
      WHERE id = ?
    `;

    await db.execute(query, [deleted_by, id]);
    return true;
  }

  /**
   * Obtener bodegas activas
   */
  static async getActive() {
    const query = `
      SELECT w.*
      FROM warehouses w
      WHERE w.is_active = 1 AND w.deleted_at IS NULL
      ORDER BY w.id ASC
    `;

    return await db.execute(query);
  }
}

module.exports = WarehouseModel;
