// ===================================================================
// PROSPERPOS - MODELO DE VEHÍCULOS
// ===================================================================

const db = require('../utils/database');

class VehicleModel {
  // Obtener todos los vehículos
  static async getAll() {
    const query = `
      SELECT *
      FROM vehicles
      WHERE deleted_at IS NULL
      ORDER BY id DESC
    `;
    return await db.execute(query);
  }

  // Obtener vehículos activos
  static async getActive() {
    const query = `
      SELECT *
      FROM vehicles
      WHERE deleted_at IS NULL AND is_active = 1
      ORDER BY placa
    `;
    return await db.execute(query);
  }

  // Obtener un vehículo por ID
  static async getById(id) {
    const query = `
      SELECT *
      FROM vehicles
      WHERE id = ? AND deleted_at IS NULL
    `;
    const rows = await db.execute(query, [id]);
    return rows[0] || null;
  }

  // Crear un nuevo vehículo
  static async create(data) {
    const query = `
      INSERT INTO vehicles (placa, marca, modelo, color, is_active, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    const result = await db.execute(query, [
      data.placa,
      data.marca,
      data.modelo,
      data.color,
      data.is_active ?? 1,
      data.created_by || null
    ]);
    return result.insertId;
  }

  // Actualizar un vehículo
  static async update(id, data) {
    const query = `
      UPDATE vehicles
      SET placa = ?,
          marca = ?,
          modelo = ?,
          color = ?,
          is_active = ?,
          updated_by = ?,
          updated_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
    `;
    const result = await db.execute(query, [
      data.placa,
      data.marca,
      data.modelo,
      data.color,
      data.is_active ?? 1,
      data.updated_by || null,
      id
    ]);
    return result.affectedRows > 0;
  }

  // Eliminar (soft delete) un vehículo
  static async delete(id, deleted_by) {
    const query = `
      UPDATE vehicles
      SET deleted_at = NOW(),
          deleted_by = ?
      WHERE id = ? AND deleted_at IS NULL
    `;
    const result = await db.execute(query, [deleted_by, id]);
    return result.affectedRows > 0;
  }
}

module.exports = VehicleModel;
