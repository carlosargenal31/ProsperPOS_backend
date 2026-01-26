// ===================================================================
// PROSPERPOS - SERVICIO DE TASAS DE IMPUESTO
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class TaxRateService {

  /**
   * Obtener todas las tasas de impuesto con filtros
   */
  static async getTaxRates(filters = {}) {
    try {
      const {
        search = '',
        is_active = null
      } = filters;

      let whereClause = 'WHERE t.deleted_at IS NULL';
      const params = [];

      if (search) {
        whereClause += ' AND (t.name LIKE ? OR CAST(t.rate AS CHAR) LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      if (is_active !== null) {
        whereClause += ' AND t.is_active = ?';
        params.push(is_active ? 1 : 0);
      }

      const query = `
        SELECT
          t.*,
          COALESCE((SELECT COUNT(*) FROM products p WHERE p.tax_id = t.id AND p.deleted_at IS NULL), 0) as products_count
        FROM tax_rates t
        ${whereClause}
        ORDER BY t.is_default DESC, t.rate ASC
      `;

      const taxRates = await db.execute(query, params);
      return taxRates;

    } catch (error) {
      logger.error('Error in getTaxRates:', error);
      throw error;
    }
  }

  /**
   * Obtener tasa de impuesto por ID
   */
  static async getTaxRateById(id) {
    try {
      const query = `
        SELECT
          t.*,
          COALESCE((SELECT COUNT(*) FROM products p WHERE p.tax_id = t.id AND p.deleted_at IS NULL), 0) as products_count
        FROM tax_rates t
        WHERE t.id = ? AND t.deleted_at IS NULL
      `;

      const rows = await db.execute(query, [id]);
      return rows[0] || null;

    } catch (error) {
      logger.error('Error in getTaxRateById:', error);
      throw error;
    }
  }

  /**
   * Crear nueva tasa de impuesto
   */
  static async createTaxRate(taxRateData) {
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

      // Verificar nombre duplicado
      if (name && name.trim()) {
        const existing = await db.execute(
          'SELECT id FROM tax_rates WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND deleted_at IS NULL',
          [name.trim()]
        );

        if (existing.length > 0) {
          throw new Error('Ya existe una tasa de impuesto con ese nombre');
        }
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

      const result = await db.execute(insertQuery, [
        name,
        rate,
        description || null,
        is_active ? 1 : 0,
        is_default ? 1 : 0,
        created_by || 1
      ]);

      return {
        id: result.insertId,
        name,
        rate
      };

    } catch (error) {
      logger.error('Error in createTaxRate:', error);
      throw error;
    }
  }

  /**
   * Actualizar tasa de impuesto
   */
  static async updateTaxRate(id, taxRateData) {
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
      const existing = await db.execute(
        'SELECT id FROM tax_rates WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Tasa de impuesto no encontrada');
      }

      // Verificar nombre duplicado
      const duplicate = await db.execute(
        'SELECT id FROM tax_rates WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND id != ? AND deleted_at IS NULL',
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
        name,
        rate,
        description || null,
        is_active ? 1 : 0,
        is_default ? 1 : 0,
        updated_by || 1,
        id
      ]);

      // Ya no necesitamos actualizar tax_rate en productos porque se eliminó esa columna

      return { id, name, rate };

    } catch (error) {
      logger.error('Error in updateTaxRate:', error);
      throw error;
    }
  }

  /**
   * Eliminar tasa de impuesto (soft delete)
   */
  static async deleteTaxRate(id, deleted_by) {
    try {
      // Verificar que existe
      const existing = await db.execute(
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
      const products = await db.execute(
        'SELECT COUNT(*) as count FROM products WHERE tax_id = ? AND deleted_at IS NULL',
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

      return { success: true };

    } catch (error) {
      logger.error('Error in deleteTaxRate:', error);
      throw error;
    }
  }

  /**
   * Obtener tasas activas
   */
  static async getActiveTaxRates() {
    try {
      const query = `
        SELECT
          t.id,
          t.name,
          t.rate,
          t.description,
          t.is_active,
          t.is_default
        FROM tax_rates t
        WHERE t.is_active = 1 AND t.deleted_at IS NULL
        ORDER BY t.is_default DESC, t.rate ASC
      `;

      const taxRates = await db.execute(query);
      return taxRates;

    } catch (error) {
      logger.error('Error in getActiveTaxRates:', error);
      throw error;
    }
  }

  /**
   * Obtener tasa por defecto
   */
  static async getDefaultTaxRate() {
    try {
      const query = `
        SELECT * FROM tax_rates
        WHERE is_default = 1 AND deleted_at IS NULL
        LIMIT 1
      `;

      const rows = await db.execute(query);
      return rows[0] || null;

    } catch (error) {
      logger.error('Error in getDefaultTaxRate:', error);
      throw error;
    }
  }
}

module.exports = TaxRateService;
