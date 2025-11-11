// ===================================================================
// PROSPERPOS - SERVICIO DE DEPARTAMENTOS
// ===================================================================

const StateModel = require('../models/state.model');

class StateService {

  /**
   * Obtener todos los departamentos
   */
  static async getStates(filters = {}) {
    try {
      const states = await StateModel.getAll(filters);
      return states;
    } catch (error) {
      console.error('Error in StateService.getStates:', error);
      throw error;
    }
  }

  /**
   * Obtener departamento por ID
   */
  static async getStateById(id) {
    try {
      const state = await StateModel.getById(id);

      if (!state) {
        throw new Error('Departamento no encontrado');
      }

      return state;
    } catch (error) {
      console.error('Error in StateService.getStateById:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo departamento
   */
  static async createState(stateData) {
    try {
      const { nombre, country_id } = stateData;

      const result = await StateModel.create(stateData);

      return {
        id: result,
        nombre,
        country_id
      };
    } catch (error) {
      console.error('Error in StateService.createState:', error);
      throw error;
    }
  }

  /**
   * Actualizar departamento
   */
  static async updateState(id, stateData) {
    try {
      // Verificar que existe
      const existing = await StateModel.getById(id);
      if (!existing) {
        throw new Error('Departamento no encontrado');
      }

      await StateModel.update(id, stateData);

      // Obtener departamento actualizado
      const updated = await StateModel.getById(id);
      return updated;
    } catch (error) {
      console.error('Error in StateService.updateState:', error);
      throw error;
    }
  }

  /**
   * Eliminar departamento (soft delete)
   */
  static async deleteState(id, deleted_by) {
    try {
      // Verificar que existe
      const existing = await StateModel.getById(id);
      if (!existing) {
        throw new Error('Departamento no encontrado');
      }

      await StateModel.delete(id, deleted_by);
      return true;
    } catch (error) {
      console.error('Error in StateService.deleteState:', error);
      throw error;
    }
  }

  /**
   * Obtener departamentos activos
   */
  static async getActiveStates(country_id = null) {
    try {
      return await StateModel.getActive(country_id);
    } catch (error) {
      console.error('Error in StateService.getActiveStates:', error);
      throw error;
    }
  }
}

module.exports = StateService;
