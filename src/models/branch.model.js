// ===================================================================
// PROSPERPOS - MODELO DE SUCURSALES
// ===================================================================

const db = require('../utils/database');

class BranchModel {
  // Obtener todas las sucursales
  static async getAll() {
    const query = `
      SELECT
        b.*,
        c.nombre AS city_name,
        s.nombre AS state_name,
        co.nombre AS country_name
      FROM branches b
      LEFT JOIN cities c ON b.city_id = c.id
      LEFT JOIN states s ON c.state_id = s.id
      LEFT JOIN countries co ON s.country_id = co.id
      WHERE b.deleted_at IS NULL
      ORDER BY b.id DESC
    `;
    return await db.execute(query);
  }

  // Obtener sucursales activas
  static async getActive() {
    const query = `
      SELECT
        b.*,
        c.nombre AS city_name,
        s.nombre AS state_name,
        co.nombre AS country_name
      FROM branches b
      LEFT JOIN cities c ON b.city_id = c.id
      LEFT JOIN states s ON c.state_id = s.id
      LEFT JOIN countries co ON s.country_id = co.id
      WHERE b.deleted_at IS NULL AND b.is_active = 1
      ORDER BY b.nombre
    `;
    return await db.execute(query);
  }

  // Obtener una sucursal por ID
  static async getById(id) {
    const query = `
      SELECT
        b.*,
        c.nombre AS city_name,
        s.nombre AS state_name,
        co.nombre AS country_name
      FROM branches b
      LEFT JOIN cities c ON b.city_id = c.id
      LEFT JOIN states s ON c.state_id = s.id
      LEFT JOIN countries co ON s.country_id = co.id
      WHERE b.id = ? AND b.deleted_at IS NULL
    `;
    const rows = await db.execute(query, [id]);
    return rows[0] || null;
  }

  // Crear una nueva sucursal
  static async create(data) {
    const query = `
      INSERT INTO branches (nombre, direccion, city_id, telefono, correo, gerente, is_active, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const result = await db.execute(query, [
      data.nombre,
      data.direccion || null,
      (data.city_id && data.city_id !== '') ? parseInt(data.city_id) : null,
      data.telefono || null,
      data.correo || null,
      data.gerente || null,
      data.is_active ?? 1,
      data.created_by || null
    ]);
    return result.insertId;
  }

  // Actualizar una sucursal
  static async update(id, data) {
    const query = `
      UPDATE branches
      SET nombre = ?,
          direccion = ?,
          city_id = ?,
          telefono = ?,
          correo = ?,
          gerente = ?,
          is_active = ?,
          updated_by = ?,
          updated_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
    `;
    const result = await db.execute(query, [
      data.nombre,
      data.direccion || null,
      (data.city_id && data.city_id !== '') ? parseInt(data.city_id) : null,
      data.telefono || null,
      data.correo || null,
      data.gerente || null,
      data.is_active ?? 1,
      data.updated_by || null,
      id
    ]);
    return result.affectedRows > 0;
  }

  // Eliminar (soft delete) una sucursal
  static async delete(id, deleted_by) {
    const query = `
      UPDATE branches
      SET deleted_at = NOW(),
          deleted_by = ?
      WHERE id = ? AND deleted_at IS NULL
    `;
    const result = await db.execute(query, [deleted_by, id]);
    return result.affectedRows > 0;
  }
}

module.exports = BranchModel;
