// ===================================================================
// PROSPERPOS - CONTROLADOR DE TASAS DE IMPUESTO
// ===================================================================

const TaxRateService = require('../services/taxRate.service');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class TaxRateController {

  /**
   * Obtener todas las tasas de impuesto
   */
  static async getTaxRates(req, res) {
    try {
      const { search = '', is_active } = req.query;

      const filters = {
        search,
        is_active: is_active === 'true' ? true : is_active === 'false' ? false : null
      };

      const taxRates = await TaxRateService.getTaxRates(filters);

      return sendSuccessResponse(res, taxRates, 'Tasas de impuesto obtenidas exitosamente');

    } catch (error) {
      logger.error('Error getting tax rates:', error);
      return sendErrorResponse(res, 500, 'Error al obtener tasas de impuesto');
    }
  }

  /**
   * Obtener tasas activas
   */
  static async getActiveTaxRates(req, res) {
    try {
      const taxRates = await TaxRateService.getActiveTaxRates();
      return sendSuccessResponse(res, taxRates, 'Tasas activas obtenidas exitosamente');
    } catch (error) {
      logger.error('Error getting active tax rates:', error);
      return sendErrorResponse(res, 500, 'Error al obtener tasas activas');
    }
  }

  /**
   * Obtener tasa por defecto
   */
  static async getDefaultTaxRate(req, res) {
    try {
      const taxRate = await TaxRateService.getDefaultTaxRate();
      return sendSuccessResponse(res, taxRate, 'Tasa por defecto obtenida exitosamente');
    } catch (error) {
      logger.error('Error getting default tax rate:', error);
      return sendErrorResponse(res, 500, 'Error al obtener tasa por defecto');
    }
  }

  /**
   * Obtener tasa de impuesto por ID
   */
  static async getTaxRate(req, res) {
    try {
      const { id } = req.params;

      const taxRate = await TaxRateService.getTaxRateById(id);

      if (!taxRate) {
        return sendErrorResponse(res, 404, 'Tasa de impuesto no encontrada');
      }

      return sendSuccessResponse(res, taxRate, 'Tasa de impuesto obtenida exitosamente');

    } catch (error) {
      logger.error('Error getting tax rate:', error);
      return sendErrorResponse(res, 500, 'Error al obtener tasa de impuesto');
    }
  }

  /**
   * Crear nueva tasa de impuesto
   */
  static async createTaxRate(req, res) {
    try {
      const taxRateData = {
        ...req.body,
        created_by: req.user.id
      };

      // Validación básica
      if (!taxRateData.name || taxRateData.name.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre de la tasa es requerido');
      }

      if (taxRateData.rate === undefined || taxRateData.rate === null) {
        return sendErrorResponse(res, 400, 'La tasa de impuesto es requerida');
      }

      const taxRate = await TaxRateService.createTaxRate(taxRateData);

      logger.info('Tax rate created', {
        taxRateId: taxRate.id,
        userId: req.user.id,
        name: taxRate.name,
        rate: taxRate.rate
      });

      return sendSuccessResponse(res, taxRate, 'Tasa de impuesto creada exitosamente', 201);

    } catch (error) {
      logger.error('Error creating tax rate:', error);

      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }

      if (error.message.includes('debe estar entre')) {
        return sendErrorResponse(res, 400, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al crear tasa de impuesto');
    }
  }

  /**
   * Actualizar tasa de impuesto
   */
  static async updateTaxRate(req, res) {
    try {
      const { id } = req.params;
      const taxRateData = {
        ...req.body,
        updated_by: req.user.id
      };

      // Validación básica
      if (taxRateData.name && taxRateData.name.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre de la tasa no puede estar vacío');
      }

      if (taxRateData.rate !== undefined && (taxRateData.rate < 0 || taxRateData.rate > 100)) {
        return sendErrorResponse(res, 400, 'La tasa debe estar entre 0 y 100');
      }

      const taxRate = await TaxRateService.updateTaxRate(id, taxRateData);

      logger.info('Tax rate updated', {
        taxRateId: id,
        userId: req.user.id
      });

      return sendSuccessResponse(res, taxRate, 'Tasa de impuesto actualizada exitosamente');

    } catch (error) {
      logger.error('Error updating tax rate:', error);

      if (error.message.includes('no encontrada')) {
        return sendErrorResponse(res, 404, error.message);
      }

      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }

      if (error.message.includes('debe estar entre')) {
        return sendErrorResponse(res, 400, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al actualizar tasa de impuesto');
    }
  }

  /**
   * Eliminar tasa de impuesto (soft delete)
   */
  static async deleteTaxRate(req, res) {
    try {
      const { id } = req.params;
      const deleted_by = req.user.id;

      await TaxRateService.deleteTaxRate(id, deleted_by);

      logger.info('Tax rate deleted', {
        taxRateId: id,
        userId: deleted_by
      });

      return sendSuccessResponse(res, null, 'Tasa de impuesto eliminada exitosamente');

    } catch (error) {
      logger.error('Error deleting tax rate:', error);

      if (error.message.includes('no encontrada')) {
        return sendErrorResponse(res, 404, error.message);
      }

      if (error.message.includes('No se puede eliminar')) {
        return sendErrorResponse(res, 409, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al eliminar tasa de impuesto');
    }
  }
}

module.exports = TaxRateController;
