// ===================================================================
// PROSPERPOS - CONTROLADOR DE PAÍSES
// ===================================================================

const CountryService = require('../services/country.service');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class CountryController {

  /**
   * Obtener todos los países
   */
  static async getCountries(req, res) {
    try {
      const { search = '', is_active } = req.query;

      const filters = {
        search,
        is_active: is_active === 'true' ? true : is_active === 'false' ? false : null
      };

      const countries = await CountryService.getCountries(filters);

      return sendSuccessResponse(res, countries, 'Países obtenidos exitosamente');

    } catch (error) {
      logger.error('Error getting countries:', error);
      return sendErrorResponse(res, 500, 'Error al obtener países');
    }
  }

  /**
   * Obtener países activos
   */
  static async getActiveCountries(req, res) {
    try {
      const countries = await CountryService.getActiveCountries();
      return sendSuccessResponse(res, countries, 'Países activos obtenidos exitosamente');
    } catch (error) {
      logger.error('Error getting active countries:', error);
      return sendErrorResponse(res, 500, 'Error al obtener países activos');
    }
  }

  /**
   * Obtener país por ID
   */
  static async getCountry(req, res) {
    try {
      const { id } = req.params;

      const country = await CountryService.getCountryById(id);

      if (!country) {
        return sendErrorResponse(res, 404, 'País no encontrado');
      }

      return sendSuccessResponse(res, country, 'País obtenido exitosamente');

    } catch (error) {
      logger.error('Error getting country:', error);
      return sendErrorResponse(res, 500, 'Error al obtener país');
    }
  }

  /**
   * Crear nuevo país
   */
  static async createCountry(req, res) {
    try {
      const countryData = {
        ...req.body,
        created_by: req.user.id
      };

      // Validación básica
      if (!countryData.nombre || countryData.nombre.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre es requerido');
      }

      const country = await CountryService.createCountry(countryData);

      logger.info('Country created', {
        id: country.id,
        userId: req.user.id,
        nombre: country.nombre
      });

      return sendSuccessResponse(res, country, 'País creado exitosamente', 201);

    } catch (error) {
      logger.error('Error creating country:', error);

      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al crear país');
    }
  }

  /**
   * Actualizar país
   */
  static async updateCountry(req, res) {
    try {
      const { id } = req.params;
      const countryData = {
        ...req.body,
        updated_by: req.user.id
      };

      // Validación básica
      if (countryData.nombre && countryData.nombre.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre no puede estar vacío');
      }

      const country = await CountryService.updateCountry(id, countryData);

      logger.info('Country updated', {
        id: id,
        userId: req.user.id
      });

      return sendSuccessResponse(res, country, 'País actualizado exitosamente');

    } catch (error) {
      logger.error('Error updating country:', error);

      if (error.message.includes('no encontrado')) {
        return sendErrorResponse(res, 404, error.message);
      }

      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al actualizar país');
    }
  }

  /**
   * Eliminar país (soft delete)
   */
  static async deleteCountry(req, res) {
    try {
      const { id } = req.params;
      const deleted_by = req.user.id;

      await CountryService.deleteCountry(id, deleted_by);

      logger.info('Country deleted', {
        id: id,
        userId: deleted_by
      });

      return sendSuccessResponse(res, null, 'País eliminado exitosamente');

    } catch (error) {
      logger.error('Error deleting country:', error);

      if (error.message.includes('no encontrado')) {
        return sendErrorResponse(res, 404, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al eliminar país');
    }
  }
}

module.exports = CountryController;
