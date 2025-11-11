// ===================================================================
// PROSPERPOS - SERVICIO DE CUENTAS BANCARIAS
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class BankAccountService {

  /**
   * Obtener todas las cuentas bancarias con filtros
   */
  static async getBankAccounts(filters = {}) {
    try {
      const {
        search = '',
        is_active = null
      } = filters;

      let whereClause = 'WHERE b.deleted_at IS NULL';
      const params = [];

      if (search) {
        whereClause += ' AND (b.banco LIKE ? OR b.numero_cuenta LIKE ? OR b.titular LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (is_active !== null) {
        whereClause += ' AND b.is_active = ?';
        params.push(is_active ? 1 : 0);
      }

      const query = `
        SELECT b.*
        FROM bank_accounts b
        ${whereClause}
        ORDER BY b.is_default DESC, b.id ASC
      `;

      const accounts = await db.execute(query, params);
      return accounts;

    } catch (error) {
      logger.error('Error in getBankAccounts:', error);
      throw error;
    }
  }

  /**
   * Obtener cuenta bancaria por ID
   */
  static async getBankAccountById(id) {
    try {
      const query = `
        SELECT b.*
        FROM bank_accounts b
        WHERE b.id = ? AND b.deleted_at IS NULL
      `;

      const rows = await db.execute(query, [id]);
      return rows[0] || null;

    } catch (error) {
      logger.error('Error in getBankAccountById:', error);
      throw error;
    }
  }

  /**
   * Crear nueva cuenta bancaria
   */
  static async createBankAccount(accountData) {
    try {
      const {
        banco,
        tipo_cuenta,
        moneda,
        numero_cuenta,
        titular,
        imagen_banco = null,
        is_active = true,
        is_default = false,
        created_by
      } = accountData;

      // Verificar número de cuenta duplicado
      if (numero_cuenta && numero_cuenta.trim()) {
        const existing = await db.execute(
          'SELECT id FROM bank_accounts WHERE numero_cuenta = ? AND deleted_at IS NULL',
          [numero_cuenta.trim()]
        );

        if (existing.length > 0) {
          throw new Error('Ya existe una cuenta con ese número');
        }
      }

      // Insertar cuenta bancaria
      const insertQuery = `
        INSERT INTO bank_accounts (
          banco, tipo_cuenta, moneda, numero_cuenta, titular, imagen_banco,
          is_active, is_default, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const result = await db.execute(insertQuery, [
        banco,
        tipo_cuenta,
        moneda,
        numero_cuenta,
        titular,
        imagen_banco,
        is_active ? 1 : 0,
        is_default ? 1 : 0,
        created_by || 1
      ]);

      return {
        id: result.insertId,
        banco,
        numero_cuenta
      };

    } catch (error) {
      logger.error('Error in createBankAccount:', error);
      throw error;
    }
  }

  /**
   * Actualizar cuenta bancaria
   */
  static async updateBankAccount(id, accountData) {
    try {
      const {
        banco,
        tipo_cuenta,
        moneda,
        numero_cuenta,
        titular,
        imagen_banco,
        is_active,
        is_default,
        updated_by
      } = accountData;

      // Verificar que existe
      const existing = await db.execute(
        'SELECT id FROM bank_accounts WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Cuenta bancaria no encontrada');
      }

      // Verificar número de cuenta duplicado
      const duplicate = await db.execute(
        'SELECT id FROM bank_accounts WHERE numero_cuenta = ? AND id != ? AND deleted_at IS NULL',
        [numero_cuenta, id]
      );

      if (duplicate.length > 0) {
        throw new Error('Ya existe otra cuenta con ese número');
      }

      // Actualizar
      const updateQuery = `
        UPDATE bank_accounts SET
          banco = ?, tipo_cuenta = ?, moneda = ?, numero_cuenta = ?, titular = ?,
          imagen_banco = ?, is_active = ?, is_default = ?, updated_by = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await db.execute(updateQuery, [
        banco,
        tipo_cuenta,
        moneda,
        numero_cuenta,
        titular,
        imagen_banco,
        is_active ? 1 : 0,
        is_default ? 1 : 0,
        updated_by || 1,
        id
      ]);

      return { id, banco, numero_cuenta };

    } catch (error) {
      logger.error('Error in updateBankAccount:', error);
      throw error;
    }
  }

  /**
   * Eliminar cuenta bancaria (soft delete)
   */
  static async deleteBankAccount(id, deleted_by) {
    try {
      // Verificar que existe
      const existing = await db.execute(
        'SELECT id FROM bank_accounts WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Cuenta bancaria no encontrada');
      }

      // Soft delete
      await db.execute(
        'UPDATE bank_accounts SET deleted_at = NOW(), updated_by = ? WHERE id = ?',
        [deleted_by, id]
      );

      return { success: true };

    } catch (error) {
      logger.error('Error in deleteBankAccount:', error);
      throw error;
    }
  }

  /**
   * Obtener cuentas activas
   */
  static async getActiveBankAccounts() {
    try {
      const query = `
        SELECT
          b.id,
          b.banco,
          b.tipo_cuenta,
          b.moneda,
          b.numero_cuenta,
          b.titular,
          b.imagen_banco,
          b.is_active,
          b.is_default
        FROM bank_accounts b
        WHERE b.is_active = 1 AND b.deleted_at IS NULL
        ORDER BY b.is_default DESC, b.id ASC
      `;

      const accounts = await db.execute(query);
      return accounts;

    } catch (error) {
      logger.error('Error in getActiveBankAccounts:', error);
      throw error;
    }
  }

}

module.exports = BankAccountService;
