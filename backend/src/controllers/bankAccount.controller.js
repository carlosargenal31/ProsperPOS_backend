// ===================================================================
// PROSPERPOS - CONTROLADOR DE CUENTAS BANCARIAS
// ===================================================================

const BankAccountService = require('../services/bankAccount.service');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class BankAccountController {

  /**
   * Obtener todas las cuentas bancarias
   */
  static async getBankAccounts(req, res) {
    try {
      const { search = '', is_active } = req.query;

      const filters = {
        search,
        is_active: is_active === 'true' ? true : is_active === 'false' ? false : null
      };

      const accounts = await BankAccountService.getBankAccounts(filters);

      return sendSuccessResponse(res, accounts, 'Cuentas bancarias obtenidas exitosamente');

    } catch (error) {
      logger.error('Error getting bank accounts:', error);
      return sendErrorResponse(res, 500, 'Error al obtener cuentas bancarias');
    }
  }

  /**
   * Obtener cuentas activas
   */
  static async getActiveBankAccounts(req, res) {
    try {
      const accounts = await BankAccountService.getActiveBankAccounts();
      return sendSuccessResponse(res, accounts, 'Cuentas bancarias activas obtenidas exitosamente');
    } catch (error) {
      logger.error('Error getting active bank accounts:', error);
      return sendErrorResponse(res, 500, 'Error al obtener cuentas bancarias activas');
    }
  }

  /**
   * Obtener cuenta bancaria por ID
   */
  static async getBankAccount(req, res) {
    try {
      const { id } = req.params;

      const account = await BankAccountService.getBankAccountById(id);

      if (!account) {
        return sendErrorResponse(res, 404, 'Cuenta bancaria no encontrada');
      }

      return sendSuccessResponse(res, account, 'Cuenta bancaria obtenida exitosamente');

    } catch (error) {
      logger.error('Error getting bank account:', error);
      return sendErrorResponse(res, 500, 'Error al obtener cuenta bancaria');
    }
  }

  /**
   * Crear nueva cuenta bancaria
   */
  static async createBankAccount(req, res) {
    try {
      const accountData = {
        ...req.body,
        created_by: req.user.id
      };

      // Validación básica
      if (!accountData.banco || accountData.banco.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre del banco es requerido');
      }

      if (!accountData.tipo_cuenta || accountData.tipo_cuenta.trim() === '') {
        return sendErrorResponse(res, 400, 'El tipo de cuenta es requerido');
      }

      if (!accountData.moneda || accountData.moneda.trim() === '') {
        return sendErrorResponse(res, 400, 'La moneda es requerida');
      }

      if (!accountData.numero_cuenta || accountData.numero_cuenta.trim() === '') {
        return sendErrorResponse(res, 400, 'El número de cuenta es requerido');
      }

      if (!accountData.titular || accountData.titular.trim() === '') {
        return sendErrorResponse(res, 400, 'El titular de la cuenta es requerido');
      }

      const account = await BankAccountService.createBankAccount(accountData);

      logger.info('Bank account created', {
        id: account.id,
        userId: req.user.id,
        banco: account.banco
      });

      return sendSuccessResponse(res, account, 'Cuenta bancaria creada exitosamente', 201);

    } catch (error) {
      logger.error('Error creating bank account:', error);

      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al crear cuenta bancaria');
    }
  }

  /**
   * Actualizar cuenta bancaria
   */
  static async updateBankAccount(req, res) {
    try {
      const { id } = req.params;
      const accountData = {
        ...req.body,
        updated_by: req.user.id
      };

      // Validación básica
      if (accountData.banco && accountData.banco.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre del banco no puede estar vacío');
      }

      if (accountData.numero_cuenta && accountData.numero_cuenta.trim() === '') {
        return sendErrorResponse(res, 400, 'El número de cuenta no puede estar vacío');
      }

      const account = await BankAccountService.updateBankAccount(id, accountData);

      logger.info('Bank account updated', {
        id: id,
        userId: req.user.id
      });

      return sendSuccessResponse(res, account, 'Cuenta bancaria actualizada exitosamente');

    } catch (error) {
      logger.error('Error updating bank account:', error);

      if (error.message.includes('no encontrada')) {
        return sendErrorResponse(res, 404, error.message);
      }

      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al actualizar cuenta bancaria');
    }
  }

  /**
   * Eliminar cuenta bancaria (soft delete)
   */
  static async deleteBankAccount(req, res) {
    try {
      const { id } = req.params;
      const deleted_by = req.user.id;

      await BankAccountService.deleteBankAccount(id, deleted_by);

      logger.info('Bank account deleted', {
        id: id,
        userId: deleted_by
      });

      return sendSuccessResponse(res, null, 'Cuenta bancaria eliminada exitosamente');

    } catch (error) {
      logger.error('Error deleting bank account:', error);

      if (error.message.includes('no encontrada')) {
        return sendErrorResponse(res, 404, error.message);
      }

      if (error.message.includes('No se puede eliminar')) {
        return sendErrorResponse(res, 409, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al eliminar cuenta bancaria');
    }
  }
}

module.exports = BankAccountController;
