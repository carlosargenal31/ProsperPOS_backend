// ===================================================================
// PROSPERPOS - MODELO DE MONEDAS
// ===================================================================

const db = require('../utils/database');
const { logError } = require('../utils/logger');

class Currency {

  /**
   * Obtener todas las monedas
   */
  static async getAll(filters = {}) {
    try {
      const { search = '', is_active = null } = filters;

      let whereClause = 'WHERE deleted_at IS NULL';
      const params = [];

      if (search) {
        whereClause += ' AND (codigo LIKE ? OR simbolo LIKE ? OR plural LIKE ? OR singular LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (is_active !== null) {
        whereClause += ' AND is_active = ?';
        params.push(is_active ? 1 : 0);
      }

      const query = `
        SELECT *
        FROM currencies
        ${whereClause}
        ORDER BY is_default DESC, id ASC
      `;

      const [currencies] = await db.execute(query, params);
      return currencies;

    } catch (error) {
      logError('Error getting currencies:', error);
      throw error;
    }
  }

  /**
   * Obtener moneda por ID
   */
  static async getById(id) {
    try {
      const query = `
        SELECT *
        FROM currencies
        WHERE id = ? AND deleted_at IS NULL
      `;

      const [rows] = await db.execute(query, [id]);
      return rows[0] || null;

    } catch (error) {
      logError('Error getting currency by id:', error);
      throw error;
    }
  }

  /**
   * Crear nueva moneda
   */
  static async create(currencyData) {
    try {
      const {
        codigo,
        simbolo,
        factor_cambio,
        extranjera = 0,
        multiplicar_dividir = 0,
        plural,
        singular,
        is_active = true,
        is_default = false,
        created_by
      } = currencyData;

      // Verificar duplicados por código
      const [existing] = await db.execute(
        'SELECT id FROM currencies WHERE codigo = ? AND deleted_at IS NULL',
        [codigo]
      );

      if (existing.length > 0) {
        throw new Error('Ya existe una moneda con ese código');
      }

      // Verificar duplicados por símbolo
      const [existingSymbol] = await db.execute(
        'SELECT id FROM currencies WHERE simbolo = ? AND deleted_at IS NULL',
        [simbolo]
      );

      if (existingSymbol.length > 0) {
        throw new Error('Ya existe una moneda con ese símbolo');
      }

      // Si se marca como default, desmarcar las demás
      if (is_default) {
        await db.execute(
          'UPDATE currencies SET is_default = 0 WHERE is_default = 1'
        );
      }

      // Insertar moneda
      const insertQuery = `
        INSERT INTO currencies (
          codigo, simbolo, factor_cambio, extranjera, multiplicar_dividir,
          plural, singular, is_active, is_default, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const [result] = await db.execute(insertQuery, [
        codigo, simbolo, factor_cambio, extranjera ? 1 : 0,
        multiplicar_dividir ? 1 : 0, plural, singular,
        is_active ? 1 : 0, is_default ? 1 : 0, created_by
      ]);

      return {
        id: result.insertId,
        codigo,
        simbolo,
        message: 'Moneda creada exitosamente'
      };

    } catch (error) {
      logError('Error creating currency:', error);
      throw error;
    }
  }

  /**
   * Actualizar moneda
   */
  static async update(id, currencyData) {
    try {
      const {
        codigo,
        simbolo,
        factor_cambio,
        extranjera,
        multiplicar_dividir,
        plural,
        singular,
        is_active,
        is_default,
        updated_by
      } = currencyData;

      // Verificar que existe
      const [existing] = await db.execute(
        'SELECT id FROM currencies WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Moneda no encontrada');
      }

      // Verificar código duplicado
      const [duplicateCode] = await db.execute(
        'SELECT id FROM currencies WHERE codigo = ? AND id != ? AND deleted_at IS NULL',
        [codigo, id]
      );

      if (duplicateCode.length > 0) {
        throw new Error('Ya existe otra moneda con ese código');
      }

      // Verificar símbolo duplicado
      const [duplicateSymbol] = await db.execute(
        'SELECT id FROM currencies WHERE simbolo = ? AND id != ? AND deleted_at IS NULL',
        [simbolo, id]
      );

      if (duplicateSymbol.length > 0) {
        throw new Error('Ya existe otra moneda con ese símbolo');
      }

      // Si se marca como default, desmarcar las demás
      if (is_default) {
        await db.execute(
          'UPDATE currencies SET is_default = 0 WHERE is_default = 1 AND id != ?',
          [id]
        );
      }

      // Actualizar
      const updateQuery = `
        UPDATE currencies SET
          codigo = ?, simbolo = ?, factor_cambio = ?, extranjera = ?,
          multiplicar_dividir = ?, plural = ?, singular = ?,
          is_active = ?, is_default = ?, updated_by = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await db.execute(updateQuery, [
        codigo, simbolo, factor_cambio, extranjera ? 1 : 0,
        multiplicar_dividir ? 1 : 0, plural, singular,
        is_active ? 1 : 0, is_default ? 1 : 0, updated_by, id
      ]);

      return {
        id,
        codigo,
        simbolo,
        message: 'Moneda actualizada exitosamente'
      };

    } catch (error) {
      logError('Error updating currency:', error);
      throw error;
    }
  }

  /**
   * Eliminar moneda (soft delete)
   */
  static async delete(id, deleted_by) {
    try {
      // Verificar que existe
      const [existing] = await db.execute(
        'SELECT id, is_default FROM currencies WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Moneda no encontrada');
      }

      // No permitir eliminar la moneda por defecto
      if (existing[0].is_default) {
        throw new Error('No se puede eliminar la moneda por defecto');
      }

      // Soft delete
      await db.execute(
        'UPDATE currencies SET deleted_at = NOW(), updated_by = ? WHERE id = ?',
        [deleted_by, id]
      );

      return { message: 'Moneda eliminada exitosamente' };

    } catch (error) {
      logError('Error deleting currency:', error);
      throw error;
    }
  }

  /**
   * Obtener moneda por defecto
   */
  static async getDefault() {
    try {
      const query = `
        SELECT * FROM currencies
        WHERE is_default = 1 AND deleted_at IS NULL
        LIMIT 1
      `;

      const [rows] = await db.execute(query);
      return rows[0] || null;

    } catch (error) {
      logError('Error getting default currency:', error);
      throw error;
    }
  }

  /**
   * Obtener monedas activas
   */
  static async getActive() {
    try {
      const query = `
        SELECT * FROM currencies
        WHERE is_active = 1 AND deleted_at IS NULL
        ORDER BY is_default DESC, id ASC
      `;

      const [currencies] = await db.execute(query);
      return currencies;

    } catch (error) {
      logError('Error getting active currencies:', error);
      throw error;
    }
  }
}

module.exports = Currency;
