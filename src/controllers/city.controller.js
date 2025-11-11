// ===================================================================
// PROSPERPOS - CONTROLADOR DE CIUDADES/MUNICIPIOS
// ===================================================================

const CityService = require('../services/city.service');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class CityController {

  /**
   * Obtener todas las ciudades
   */
  static async getCities(req, res) {
    try {
      const { search = '', is_active, state_id } = req.query;

      const filters = {
        search,
        is_active: is_active === 'true' ? true : is_active === 'false' ? false : null,
        state_id: state_id || null
      };

      const cities = await CityService.getCities(filters);

      return sendSuccessResponse(res, cities, 'Ciudades obtenidas exitosamente');

    } catch (error) {
      logger.error('Error getting cities:', error);
      return sendErrorResponse(res, 500, 'Error al obtener ciudades');
    }
  }

  /**
   * Obtener ciudades activas
   */
  static async getActiveCities(req, res) {
    try {
      const { state_id } = req.query;
      const cities = await CityService.getActiveCities(state_id || null);
      return sendSuccessResponse(res, cities, 'Ciudades activas obtenidas exitosamente');
    } catch (error) {
      logger.error('Error getting active cities:', error);
      return sendErrorResponse(res, 500, 'Error al obtener ciudades activas');
    }
  }

  /**
   * Obtener ciudad por ID
   */
  static async getCity(req, res) {
    try {
      const { id } = req.params;

      const city = await CityService.getCityById(id);

      if (!city) {
        return sendErrorResponse(res, 404, 'Ciudad no encontrada');
      }

      return sendSuccessResponse(res, city, 'Ciudad obtenida exitosamente');

    } catch (error) {
      logger.error('Error getting city:', error);
      return sendErrorResponse(res, 500, 'Error al obtener ciudad');
    }
  }

  /**
   * Crear nueva ciudad
   */
  static async createCity(req, res) {
    try {
      const cityData = {
        ...req.body,
        created_by: req.user.id
      };

      // Validación básica
      if (!cityData.nombre || cityData.nombre.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre es requerido');
      }

      if (!cityData.state_id) {
        return sendErrorResponse(res, 400, 'El departamento es requerido');
      }

      const city = await CityService.createCity(cityData);

      logger.info('City created', {
        id: city.id,
        userId: req.user.id,
        nombre: city.nombre
      });

      return sendSuccessResponse(res, city, 'Ciudad creada exitosamente', 201);

    } catch (error) {
      logger.error('Error creating city:', error);

      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al crear ciudad');
    }
  }

  /**
   * Actualizar ciudad
   */
  static async updateCity(req, res) {
    try {
      const { id } = req.params;
      const cityData = {
        ...req.body,
        updated_by: req.user.id
      };

      // Validación básica
      if (cityData.nombre && cityData.nombre.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre no puede estar vacío');
      }

      const city = await CityService.updateCity(id, cityData);

      logger.info('City updated', {
        id: id,
        userId: req.user.id
      });

      return sendSuccessResponse(res, city, 'Ciudad actualizada exitosamente');

    } catch (error) {
      logger.error('Error updating city:', error);

      if (error.message.includes('no encontrada')) {
        return sendErrorResponse(res, 404, error.message);
      }

      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al actualizar ciudad');
    }
  }

  /**
   * Eliminar ciudad (soft delete)
   */
  static async deleteCity(req, res) {
    try {
      const { id } = req.params;
      const deleted_by = req.user.id;

      await CityService.deleteCity(id, deleted_by);

      logger.info('City deleted', {
        id: id,
        userId: deleted_by
      });

      return sendSuccessResponse(res, null, 'Ciudad eliminada exitosamente');

    } catch (error) {
      logger.error('Error deleting city:', error);

      if (error.message.includes('no encontrada')) {
        return sendErrorResponse(res, 404, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al eliminar ciudad');
    }
  }
}

module.exports = CityController;
