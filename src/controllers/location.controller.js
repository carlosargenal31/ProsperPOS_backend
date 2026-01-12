const locationService = require('../services/location.service');

/**
 * Controlador para gestionar departamentos y municipios
 */
class LocationController {
  /**
   * Obtener todos los departamentos
   */
  async getStates(req, res) {
    try {
      const states = await locationService.getStates();

      res.json({
        success: true,
        data: states
      });
    } catch (error) {
      console.error('Error fetching states:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener departamentos',
        error: error.message
      });
    }
  }

  /**
   * Obtener municipios por departamento
   */
  async getCitiesByState(req, res) {
    try {
      const { stateId } = req.params;

      if (!stateId) {
        return res.status(400).json({
          success: false,
          message: 'El ID del departamento es requerido'
        });
      }

      const cities = await locationService.getCitiesByState(stateId);

      res.json({
        success: true,
        data: cities
      });
    } catch (error) {
      console.error('Error fetching cities:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener municipios',
        error: error.message
      });
    }
  }

  /**
   * Obtener todos los municipios (opcional)
   */
  async getAllCities(req, res) {
    try {
      const cities = await locationService.getAllCities();

      res.json({
        success: true,
        data: cities
      });
    } catch (error) {
      console.error('Error fetching all cities:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener todos los municipios',
        error: error.message
      });
    }
  }
}

module.exports = new LocationController();
