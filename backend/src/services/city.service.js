// ===================================================================
// PROSPERPOS - SERVICIO DE CIUDADES/MUNICIPIOS
// ===================================================================

const CityModel = require('../models/city.model');

class CityService {

  /**
   * Obtener todas las ciudades
   */
  static async getCities(filters = {}) {
    try {
      const cities = await CityModel.getAll(filters);
      return cities;
    } catch (error) {
      console.error('Error in CityService.getCities:', error);
      throw error;
    }
  }

  /**
   * Obtener ciudad por ID
   */
  static async getCityById(id) {
    try {
      const city = await CityModel.getById(id);

      if (!city) {
        throw new Error('Ciudad no encontrada');
      }

      return city;
    } catch (error) {
      console.error('Error in CityService.getCityById:', error);
      throw error;
    }
  }

  /**
   * Crear nueva ciudad
   */
  static async createCity(cityData) {
    try {
      const { nombre, state_id } = cityData;

      const result = await CityModel.create(cityData);

      return {
        id: result,
        nombre,
        state_id
      };
    } catch (error) {
      console.error('Error in CityService.createCity:', error);
      throw error;
    }
  }

  /**
   * Actualizar ciudad
   */
  static async updateCity(id, cityData) {
    try {
      // Verificar que existe
      const existing = await CityModel.getById(id);
      if (!existing) {
        throw new Error('Ciudad no encontrada');
      }

      await CityModel.update(id, cityData);

      // Obtener ciudad actualizada
      const updated = await CityModel.getById(id);
      return updated;
    } catch (error) {
      console.error('Error in CityService.updateCity:', error);
      throw error;
    }
  }

  /**
   * Eliminar ciudad (soft delete)
   */
  static async deleteCity(id, deleted_by) {
    try {
      // Verificar que existe
      const existing = await CityModel.getById(id);
      if (!existing) {
        throw new Error('Ciudad no encontrada');
      }

      await CityModel.delete(id, deleted_by);
      return true;
    } catch (error) {
      console.error('Error in CityService.deleteCity:', error);
      throw error;
    }
  }

  /**
   * Obtener ciudades activas
   */
  static async getActiveCities(state_id = null) {
    try {
      return await CityModel.getActive(state_id);
    } catch (error) {
      console.error('Error in CityService.getActiveCities:', error);
      throw error;
    }
  }
}

module.exports = CityService;
