// ===================================================================
// PROSPERPOS - SERVICIO DE MONEDAS
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class CurrencyService {

  /**
   * Obtener todas las monedas con filtros
   */
  static async getCurrencies(filters = {}) {
    try {
      const {
        search = '',
        is_active = null
      } = filters;

      let whereClause = 'WHERE c.deleted_at IS NULL';
      const params = [];

      if (search) {
        whereClause += ' AND (c.simbolo LIKE ? OR c.plural LIKE ? OR c.singular LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (is_active !== null) {
        whereClause += ' AND c.is_active = ?';
        params.push(is_active ? 1 : 0);
      }

      const query = `
        SELECT c.*
        FROM currencies c
        ${whereClause}
        ORDER BY c.is_default DESC, c.id ASC
      `;

      const currencies = await db.execute(query, params);
      return currencies;

    } catch (error) {
      logger.error('Error in getCurrencies:', error);
      throw error;
    }
  }

  /**
   * Obtener moneda por ID
   */
  static async getCurrencyById(id) {
    try {
      const query = `
        SELECT c.*
        FROM currencies c
        WHERE c.id = ? AND c.deleted_at IS NULL
      `;

      const rows = await db.execute(query, [id]);
      return rows[0] || null;

    } catch (error) {
      logger.error('Error in getCurrencyById:', error);
      throw error;
    }
  }

  /**
   * Crear nueva moneda
   */
  static async createCurrency(currencyData) {
    try {
      const {
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

      // Verificar símbolo duplicado
      if (simbolo && simbolo.trim()) {
        const existing = await db.execute(
          'SELECT id FROM currencies WHERE UPPER(TRIM(simbolo)) = UPPER(TRIM(?)) AND deleted_at IS NULL',
          [simbolo.trim()]
        );

        if (existing.length > 0) {
          throw new Error('Ya existe una moneda con ese símbolo');
        }
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
          simbolo, factor_cambio, extranjera, multiplicar_dividir,
          plural, singular, is_active, is_default, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const result = await db.execute(insertQuery, [
        simbolo,
        factor_cambio || 0,
        extranjera ? 1 : 0,
        multiplicar_dividir ? 1 : 0,
        plural,
        singular,
        is_active ? 1 : 0,
        is_default ? 1 : 0,
        created_by || 1
      ]);

      return {
        id: result.insertId,
        simbolo
      };

    } catch (error) {
      logger.error('Error in createCurrency:', error);
      throw error;
    }
  }

  /**
   * Actualizar moneda
   */
  static async updateCurrency(id, currencyData) {
    try {
      const {
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
      const existing = await db.execute(
        'SELECT id FROM currencies WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Moneda no encontrada');
      }

      // Verificar símbolo duplicado
      const duplicateSymbol = await db.execute(
        'SELECT id FROM currencies WHERE UPPER(TRIM(simbolo)) = UPPER(TRIM(?)) AND id != ? AND deleted_at IS NULL',
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
          simbolo = ?, factor_cambio = ?, extranjera = ?,
          multiplicar_dividir = ?, plural = ?, singular = ?,
          is_active = ?, is_default = ?, updated_by = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await db.execute(updateQuery, [
        simbolo,
        factor_cambio || 0,
        extranjera ? 1 : 0,
        multiplicar_dividir ? 1 : 0,
        plural,
        singular,
        is_active ? 1 : 0,
        is_default ? 1 : 0,
        updated_by || 1,
        id
      ]);

      return { id, simbolo };

    } catch (error) {
      logger.error('Error in updateCurrency:', error);
      throw error;
    }
  }

  /**
   * Eliminar moneda (soft delete)
   */
  static async deleteCurrency(id, deleted_by) {
    try {
      // Verificar que existe
      const existing = await db.execute(
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

      return { success: true };

    } catch (error) {
      logger.error('Error in deleteCurrency:', error);
      throw error;
    }
  }

  /**
   * Obtener monedas activas
   */
  static async getActiveCurrencies() {
    try {
      const query = `
        SELECT c.*
        FROM currencies c
        WHERE c.is_active = 1 AND c.deleted_at IS NULL
        ORDER BY c.is_default DESC, c.id ASC
      `;

      const currencies = await db.execute(query);
      return currencies;

    } catch (error) {
      logger.error('Error in getActiveCurrencies:', error);
      throw error;
    }
  }

  /**
   * Obtener moneda por defecto
   */
  static async getDefaultCurrency() {
    try {
      const query = `
        SELECT * FROM currencies
        WHERE is_default = 1 AND deleted_at IS NULL
        LIMIT 1
      `;

      const rows = await db.execute(query);
      return rows[0] || null;

    } catch (error) {
      logger.error('Error in getDefaultCurrency:', error);
      throw error;
    }
  }
}

module.exports = CurrencyService;
