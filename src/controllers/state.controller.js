// ===================================================================
// PROSPERPOS - CONTROLADOR DE DEPARTAMENTOS
// ===================================================================

const StateService = require('../services/state.service');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class StateController {

  /**
   * Obtener todos los departamentos
   */
  static async getStates(req, res) {
    try {
      const { search = '', is_active, country_id } = req.query;

      const filters = {
        search,
        is_active: is_active === 'true' ? true : is_active === 'false' ? false : null,
        country_id: country_id || null
      };

      const states = await StateService.getStates(filters);

      return sendSuccessResponse(res, states, 'Departamentos obtenidos exitosamente');

    } catch (error) {
      logger.error('Error getting states:', error);
      return sendErrorResponse(res, 500, 'Error al obtener departamentos');
    }
  }

  /**
   * Obtener departamentos activos
   */
  static async getActiveStates(req, res) {
    try {
      const { country_id } = req.query;
      const states = await StateService.getActiveStates(country_id || null);
      return sendSuccessResponse(res, states, 'Departamentos activos obtenidos exitosamente');
    } catch (error) {
      logger.error('Error getting active states:', error);
      return sendErrorResponse(res, 500, 'Error al obtener departamentos activos');
    }
  }

  /**
   * Obtener departamento por ID
   */
  static async getState(req, res) {
    try {
      const { id } = req.params;

      const state = await StateService.getStateById(id);

      if (!state) {
        return sendErrorResponse(res, 404, 'Departamento no encontrado');
      }

      return sendSuccessResponse(res, state, 'Departamento obtenido exitosamente');

    } catch (error) {
      logger.error('Error getting state:', error);
      return sendErrorResponse(res, 500, 'Error al obtener departamento');
    }
  }

  /**
   * Crear nuevo departamento
   */
  static async createState(req, res) {
    try {
      const stateData = {
        ...req.body,
        created_by: req.user.id
      };

      // Validación básica
      if (!stateData.nombre || stateData.nombre.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre es requerido');
      }

      if (!stateData.country_id) {
        return sendErrorResponse(res, 400, 'El país es requerido');
      }

      const state = await StateService.createState(stateData);

      logger.info('State created', {
        id: state.id,
        userId: req.user.id,
        nombre: state.nombre
      });

      return sendSuccessResponse(res, state, 'Departamento creado exitosamente', 201);

    } catch (error) {
      logger.error('Error creating state:', error);

      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al crear departamento');
    }
  }

  /**
   * Actualizar departamento
   */
  static async updateState(req, res) {
    try {
      const { id } = req.params;
      const stateData = {
        ...req.body,
        updated_by: req.user.id
      };

      // Validación básica
      if (stateData.nombre && stateData.nombre.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre no puede estar vacío');
      }

      const state = await StateService.updateState(id, stateData);

      logger.info('State updated', {
        id: id,
        userId: req.user.id
      });

      return sendSuccessResponse(res, state, 'Departamento actualizado exitosamente');

    } catch (error) {
      logger.error('Error updating state:', error);

      if (error.message.includes('no encontrado')) {
        return sendErrorResponse(res, 404, error.message);
      }

      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al actualizar departamento');
    }
  }

  /**
   * Eliminar departamento (soft delete)
   */
  static async deleteState(req, res) {
    try {
      const { id } = req.params;
      const deleted_by = req.user.id;

      await StateService.deleteState(id, deleted_by);

      logger.info('State deleted', {
        id: id,
        userId: deleted_by
      });

      return sendSuccessResponse(res, null, 'Departamento eliminado exitosamente');

    } catch (error) {
      logger.error('Error deleting state:', error);

      if (error.message.includes('no encontrado')) {
        return sendErrorResponse(res, 404, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al eliminar departamento');
    }
  }
}

module.exports = StateController;
