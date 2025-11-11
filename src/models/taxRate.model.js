// ===================================================================
// PROSPERPOS - MODELO DE TASAS DE IMPUESTO
// ===================================================================

const db = require('../utils/database');
const { logError } = require('../utils/logger');

class TaxRate {

  /**
   * Obtener todas las tasas de impuesto
   */
  static async getAll(filters = {}) {
    try {
      const { search = '', is_active = null } = filters;

      let whereClause = 'WHERE deleted_at IS NULL';
      const params = [];

      if (search) {
        whereClause += ' AND (name LIKE ? OR CAST(rate AS CHAR) LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      if (is_active !== null) {
        whereClause += ' AND is_active = ?';
        params.push(is_active ? 1 : 0);
      }

      const query = `
        SELECT
          t.*,
          (SELECT COUNT(*) FROM products p WHERE p.tax_rate_id = t.id AND p.deleted_at IS NULL) as products_count
        FROM tax_rates t
        ${whereClause}
        ORDER BY t.is_default DESC, t.rate ASC
      `;

      const [taxRates] = await db.execute(query, params);
      return taxRates;

    } catch (error) {
      logError('Error getting tax rates:', error);
      throw error;
    }
  }

  /**
   * Obtener tasa de impuesto por ID
   */
  static async getById(id) {
    try {
      const query = `
        SELECT
          t.*,
          (SELECT COUNT(*) FROM products p WHERE p.tax_rate_id = t.id AND p.deleted_at IS NULL) as products_count
        FROM tax_rates t
        WHERE t.id = ? AND t.deleted_at IS NULL
      `;

      const [rows] = await db.execute(query, [id]);
      return rows[0] || null;

    } catch (error) {
      logError('Error getting tax rate by ID:', error);
      throw error;
    }
  }

  /**
   * Crear nueva tasa de impuesto
   */
  static async create(taxRateData) {
    try {
      const {
        name,
        rate,
        description,
        is_active = true,
        is_default = false,
        created_by
      } = taxRateData;

      // Validar rate
      if (rate < 0 || rate > 100) {
        throw new Error('La tasa debe estar entre 0 y 100');
      }

      // Verificar duplicados por nombre
      const [existing] = await db.execute(
        'SELECT id FROM tax_rates WHERE name = ? AND deleted_at IS NULL',
        [name]
      );

      if (existing.length > 0) {
        throw new Error('Ya existe una tasa de impuesto con ese nombre');
      }

      // Si se marca como default, desmarcar las demás
      if (is_default) {
        await db.execute(
          'UPDATE tax_rates SET is_default = 0 WHERE is_default = 1'
        );
      }

      // Insertar tasa de impuesto
      const insertQuery = `
        INSERT INTO tax_rates (
          name, rate, description, is_active, is_default, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;

      const [result] = await db.execute(insertQuery, [
        name, rate, description, is_active ? 1 : 0, is_default ? 1 : 0, created_by
      ]);

      return {
        id: result.insertId,
        name,
        rate,
        message: 'Tasa de impuesto creada exitosamente'
      };

    } catch (error) {
      logError('Error creating tax rate:', error);
      throw error;
    }
  }

  /**
   * Actualizar tasa de impuesto
   */
  static async update(id, taxRateData) {
    try {
      const {
        name,
        rate,
        description,
        is_active,
        is_default,
        updated_by
      } = taxRateData;

      // Validar rate
      if (rate < 0 || rate > 100) {
        throw new Error('La tasa debe estar entre 0 y 100');
      }

      // Verificar que existe
      const [existing] = await db.execute(
        'SELECT id FROM tax_rates WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Tasa de impuesto no encontrada');
      }

      // Verificar nombre duplicado
      const [duplicate] = await db.execute(
        'SELECT id FROM tax_rates WHERE name = ? AND id != ? AND deleted_at IS NULL',
        [name, id]
      );

      if (duplicate.length > 0) {
        throw new Error('Ya existe otra tasa de impuesto con ese nombre');
      }

      // Si se marca como default, desmarcar las demás
      if (is_default) {
        await db.execute(
          'UPDATE tax_rates SET is_default = 0 WHERE is_default = 1 AND id != ?',
          [id]
        );
      }

      // Actualizar
      const updateQuery = `
        UPDATE tax_rates SET
          name = ?, rate = ?, description = ?, is_active = ?, is_default = ?,
          updated_by = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await db.execute(updateQuery, [
        name, rate, description, is_active ? 1 : 0, is_default ? 1 : 0, updated_by, id
      ]);

      // Si cambia la tasa, actualizar también en productos
      await db.execute(
        'UPDATE products SET tax_rate = ? WHERE tax_rate_id = ?',
        [rate, id]
      );

      return {
        id,
        name,
        rate,
        message: 'Tasa de impuesto actualizada exitosamente'
      };

    } catch (error) {
      logError('Error updating tax rate:', error);
      throw error;
    }
  }

  /**
   * Eliminar tasa de impuesto (soft delete)
   */
  static async delete(id, deleted_by) {
    try {
      // Verificar que existe
      const [existing] = await db.execute(
        'SELECT id, is_default FROM tax_rates WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Tasa de impuesto no encontrada');
      }

      // No permitir eliminar la tasa por defecto
      if (existing[0].is_default) {
        throw new Error('No se puede eliminar la tasa de impuesto por defecto');
      }

      // Verificar productos asociados
      const [products] = await db.execute(
        'SELECT COUNT(*) as count FROM products WHERE tax_rate_id = ? AND deleted_at IS NULL',
        [id]
      );

      if (products[0].count > 0) {
        throw new Error(`No se puede eliminar. Tiene ${products[0].count} producto(s) asociado(s)`);
      }

      // Soft delete
      await db.execute(
        'UPDATE tax_rates SET deleted_at = NOW(), updated_by = ? WHERE id = ?',
        [deleted_by, id]
      );

      return { message: 'Tasa de impuesto eliminada exitosamente' };

    } catch (error) {
      logError('Error deleting tax rate:', error);
      throw error;
    }
  }

  /**
   * Obtener tasa por defecto
   */
  static async getDefault() {
    try {
      const query = `
        SELECT * FROM tax_rates
        WHERE is_default = 1 AND deleted_at IS NULL
        LIMIT 1
      `;

      const [rows] = await db.execute(query);
      return rows[0] || null;

    } catch (error) {
      logError('Error getting default tax rate:', error);
      throw error;
    }
  }

  /**
   * Obtener tasas activas
   */
  static async getActive() {
    try {
      const query = `
        SELECT * FROM tax_rates
        WHERE is_active = 1 AND deleted_at IS NULL
        ORDER BY is_default DESC, rate ASC
      `;

      const [taxRates] = await db.execute(query);
      return taxRates;

    } catch (error) {
      logError('Error getting active tax rates:', error);
      throw error;
    }
  }
}

module.exports = TaxRate;
