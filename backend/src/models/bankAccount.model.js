// ===================================================================
// PROSPERPOS - MODELO DE CUENTAS BANCARIAS
// ===================================================================

const db = require('../utils/database');
const { logError } = require('../utils/logger');

class BankAccount {

  /**
   * Obtener todas las cuentas bancarias
   */
  static async getAll(filters = {}) {
    try {
      const { search = '', is_active = null } = filters;

      let whereClause = 'WHERE deleted_at IS NULL';
      const params = [];

      if (search) {
        whereClause += ' AND (banco LIKE ? OR numero_cuenta LIKE ? OR titular LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (is_active !== null) {
        whereClause += ' AND is_active = ?';
        params.push(is_active ? 1 : 0);
      }

      const query = `
        SELECT *
        FROM bank_accounts
        ${whereClause}
        ORDER BY is_default DESC, id ASC
      `;

      const [accounts] = await db.execute(query, params);
      return accounts;

    } catch (error) {
      logError('Error getting bank accounts:', error);
      throw error;
    }
  }

  /**
   * Obtener cuenta bancaria por ID
   */
  static async getById(id) {
    try {
      const query = `
        SELECT *
        FROM bank_accounts
        WHERE id = ? AND deleted_at IS NULL
      `;

      const [rows] = await db.execute(query, [id]);
      return rows[0] || null;

    } catch (error) {
      logError('Error getting bank account by id:', error);
      throw error;
    }
  }

  /**
   * Crear nueva cuenta bancaria
   */
  static async create(accountData) {
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
      const [existing] = await db.execute(
        'SELECT id FROM bank_accounts WHERE numero_cuenta = ? AND deleted_at IS NULL',
        [numero_cuenta]
      );

      if (existing.length > 0) {
        throw new Error('Ya existe una cuenta con ese número');
      }

      // Si se marca como default, desmarcar las demás
      if (is_default) {
        await db.execute(
          'UPDATE bank_accounts SET is_default = 0 WHERE is_default = 1'
        );
      }

      // Insertar cuenta bancaria
      const insertQuery = `
        INSERT INTO bank_accounts (
          banco, tipo_cuenta, moneda, numero_cuenta, titular, imagen_banco,
          is_active, is_default, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const [result] = await db.execute(insertQuery, [
        banco, tipo_cuenta, moneda, numero_cuenta, titular, imagen_banco,
        is_active ? 1 : 0, is_default ? 1 : 0, created_by
      ]);

      return {
        id: result.insertId,
        banco,
        numero_cuenta,
        message: 'Cuenta bancaria creada exitosamente'
      };

    } catch (error) {
      logError('Error creating bank account:', error);
      throw error;
    }
  }

  /**
   * Actualizar cuenta bancaria
   */
  static async update(id, accountData) {
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
      const [existing] = await db.execute(
        'SELECT id FROM bank_accounts WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Cuenta bancaria no encontrada');
      }

      // Verificar número de cuenta duplicado
      const [duplicate] = await db.execute(
        'SELECT id FROM bank_accounts WHERE numero_cuenta = ? AND id != ? AND deleted_at IS NULL',
        [numero_cuenta, id]
      );

      if (duplicate.length > 0) {
        throw new Error('Ya existe otra cuenta con ese número');
      }

      // Si se marca como default, desmarcar las demás
      if (is_default) {
        await db.execute(
          'UPDATE bank_accounts SET is_default = 0 WHERE is_default = 1 AND id != ?',
          [id]
        );
      }

      // Actualizar
      const updateQuery = `
        UPDATE bank_accounts SET
          banco = ?, tipo_cuenta = ?, moneda = ?, numero_cuenta = ?, titular = ?,
          imagen_banco = ?, is_active = ?, is_default = ?, updated_by = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await db.execute(updateQuery, [
        banco, tipo_cuenta, moneda, numero_cuenta, titular, imagen_banco,
        is_active ? 1 : 0, is_default ? 1 : 0, updated_by, id
      ]);

      return {
        id,
        banco,
        numero_cuenta,
        message: 'Cuenta bancaria actualizada exitosamente'
      };

    } catch (error) {
      logError('Error updating bank account:', error);
      throw error;
    }
  }

  /**
   * Eliminar cuenta bancaria (soft delete)
   */
  static async delete(id, deleted_by) {
    try {
      // Verificar que existe
      const [existing] = await db.execute(
        'SELECT id, is_default FROM bank_accounts WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Cuenta bancaria no encontrada');
      }

      // No permitir eliminar la cuenta por defecto
      if (existing[0].is_default) {
        throw new Error('No se puede eliminar la cuenta bancaria por defecto');
      }

      // Soft delete
      await db.execute(
        'UPDATE bank_accounts SET deleted_at = NOW(), updated_by = ? WHERE id = ?',
        [deleted_by, id]
      );

      return { message: 'Cuenta bancaria eliminada exitosamente' };

    } catch (error) {
      logError('Error deleting bank account:', error);
      throw error;
    }
  }

  /**
   * Obtener cuenta por defecto
   */
  static async getDefault() {
    try {
      const query = `
        SELECT * FROM bank_accounts
        WHERE is_default = 1 AND deleted_at IS NULL
        LIMIT 1
      `;

      const [rows] = await db.execute(query);
      return rows[0] || null;

    } catch (error) {
      logError('Error getting default bank account:', error);
      throw error;
    }
  }

  /**
   * Obtener cuentas activas
   */
  static async getActive() {
    try {
      const query = `
        SELECT * FROM bank_accounts
        WHERE is_active = 1 AND deleted_at IS NULL
        ORDER BY is_default DESC, id ASC
      `;

      const [accounts] = await db.execute(query);
      return accounts;

    } catch (error) {
      logError('Error getting active bank accounts:', error);
      throw error;
    }
  }
}

module.exports = BankAccount;
