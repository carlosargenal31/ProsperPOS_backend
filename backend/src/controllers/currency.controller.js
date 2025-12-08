// ===================================================================
// PROSPERPOS - CONTROLADOR DE MONEDAS
// ===================================================================

const CurrencyService = require('../services/currency.service');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class CurrencyController {

  /**
   * Obtener todas las monedas
   */
  static async getCurrencies(req, res) {
    try {
      const { search = '', is_active } = req.query;

      const filters = {
        search,
        is_active: is_active === 'true' ? true : is_active === 'false' ? false : null
      };

      const currencies = await CurrencyService.getCurrencies(filters);

      return sendSuccessResponse(res, currencies, 'Monedas obtenidas exitosamente');

    } catch (error) {
      logger.error('Error getting currencies:', error);
      return sendErrorResponse(res, 500, 'Error al obtener monedas');
    }
  }

  /**
   * Obtener monedas activas
   */
  static async getActiveCurrencies(req, res) {
    try {
      const currencies = await CurrencyService.getActiveCurrencies();
      return sendSuccessResponse(res, currencies, 'Monedas activas obtenidas exitosamente');
    } catch (error) {
      logger.error('Error getting active currencies:', error);
      return sendErrorResponse(res, 500, 'Error al obtener monedas activas');
    }
  }

  /**
   * Obtener moneda por defecto
   */
  static async getDefaultCurrency(req, res) {
    try {
      const currency = await CurrencyService.getDefaultCurrency();
      return sendSuccessResponse(res, currency, 'Moneda por defecto obtenida exitosamente');
    } catch (error) {
      logger.error('Error getting default currency:', error);
      return sendErrorResponse(res, 500, 'Error al obtener moneda por defecto');
    }
  }

  /**
   * Obtener moneda por ID
   */
  static async getCurrency(req, res) {
    try {
      const { id } = req.params;

      const currency = await CurrencyService.getCurrencyById(id);

      if (!currency) {
        return sendErrorResponse(res, 404, 'Moneda no encontrada');
      }

      return sendSuccessResponse(res, currency, 'Moneda obtenida exitosamente');

    } catch (error) {
      logger.error('Error getting currency:', error);
      return sendErrorResponse(res, 500, 'Error al obtener moneda');
    }
  }

  /**
   * Crear nueva moneda
   */
  static async createCurrency(req, res) {
    try {
      const currencyData = {
        ...req.body,
        created_by: req.user.id
      };

      // Validación básica
      if (!currencyData.simbolo || currencyData.simbolo.trim() === '') {
        return sendErrorResponse(res, 400, 'El símbolo de la moneda es requerido');
      }

      if (!currencyData.plural || currencyData.plural.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre plural es requerido');
      }

      if (!currencyData.singular || currencyData.singular.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre singular es requerido');
      }

      const currency = await CurrencyService.createCurrency(currencyData);

      logger.info('Currency created', {
        id: currency.id,
        userId: req.user.id,
        simbolo: currency.simbolo
      });

      return sendSuccessResponse(res, currency, 'Moneda creada exitosamente', 201);

    } catch (error) {
      logger.error('Error creating currency:', error);

      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al crear moneda');
    }
  }

  /**
   * Actualizar moneda
   */
  static async updateCurrency(req, res) {
    try {
      const { id } = req.params;
      const currencyData = {
        ...req.body,
        updated_by: req.user.id
      };

      // Validación básica
      if (currencyData.simbolo && currencyData.simbolo.trim() === '') {
        return sendErrorResponse(res, 400, 'El símbolo no puede estar vacío');
      }

      const currency = await CurrencyService.updateCurrency(id, currencyData);

      logger.info('Currency updated', {
        id: id,
        userId: req.user.id
      });

      return sendSuccessResponse(res, currency, 'Moneda actualizada exitosamente');

    } catch (error) {
      logger.error('Error updating currency:', error);

      if (error.message.includes('no encontrada')) {
        return sendErrorResponse(res, 404, error.message);
      }

      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al actualizar moneda');
    }
  }

  /**
   * Eliminar moneda (soft delete)
   */
  static async deleteCurrency(req, res) {
    try {
      const { id } = req.params;
      const deleted_by = req.user.id;

      await CurrencyService.deleteCurrency(id, deleted_by);

      logger.info('Currency deleted', {
        id: id,
        userId: deleted_by
      });

      return sendSuccessResponse(res, null, 'Moneda eliminada exitosamente');

    } catch (error) {
      logger.error('Error deleting currency:', error);

      if (error.message.includes('no encontrada')) {
        return sendErrorResponse(res, 404, error.message);
      }

      if (error.message.includes('No se puede eliminar')) {
        return sendErrorResponse(res, 409, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al eliminar moneda');
    }
  }
}

module.exports = CurrencyController;
