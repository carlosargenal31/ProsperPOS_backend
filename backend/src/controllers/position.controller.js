// ===================================================================
// PROSPERPOS - CONTROLADOR DE CARGOS/PUESTOS (RH)
// ===================================================================

const PositionService = require('../services/position.service');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class PositionController {

  /**
   * Obtener todos los cargos
   */
  static async getPositions(req, res) {
    try {
      const { search = '', is_active, department_id } = req.query;

      const filters = {
        search,
        is_active: is_active === 'true' ? true : is_active === 'false' ? false : null,
        department_id: department_id || null
      };

      const positions = await PositionService.getPositions(filters);

      return sendSuccessResponse(res, positions, 'Cargos obtenidos exitosamente');

    } catch (error) {
      logger.error('Error getting positions:', error);
      return sendErrorResponse(res, 500, 'Error al obtener cargos');
    }
  }

  /**
   * Obtener cargos activos
   */
  static async getActivePositions(req, res) {
    try {
      const positions = await PositionService.getActivePositions();
      return sendSuccessResponse(res, positions, 'Cargos activos obtenidos exitosamente');
    } catch (error) {
      logger.error('Error getting active positions:', error);
      return sendErrorResponse(res, 500, 'Error al obtener cargos activos');
    }
  }

  /**
   * Obtener cargo por ID
   */
  static async getPosition(req, res) {
    try {
      const { id } = req.params;

      const position = await PositionService.getPositionById(id);

      if (!position) {
        return sendErrorResponse(res, 404, 'Cargo no encontrado');
      }

      return sendSuccessResponse(res, position, 'Cargo obtenido exitosamente');

    } catch (error) {
      logger.error('Error getting position:', error);
      return sendErrorResponse(res, 500, 'Error al obtener cargo');
    }
  }

  /**
   * Obtener cargos por departamento
   */
  static async getPositionsByDepartment(req, res) {
    try {
      const { departmentId } = req.params;

      const positions = await PositionService.getPositionsByDepartment(departmentId);

      return sendSuccessResponse(res, positions, 'Cargos del departamento obtenidos exitosamente');

    } catch (error) {
      logger.error('Error getting positions by department:', error);
      return sendErrorResponse(res, 500, 'Error al obtener cargos del departamento');
    }
  }

  /**
   * Crear nuevo cargo
   */
  static async createPosition(req, res) {
    try {
      const positionData = {
        ...req.body,
        created_by: req.user.id
      };

      // Validación básica
      if (!positionData.nombre || positionData.nombre.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre es requerido');
      }

      const position = await PositionService.createPosition(positionData);

      logger.info('Position created', {
        id: position.id,
        userId: req.user.id,
        nombre: position.nombre
      });

      return sendSuccessResponse(res, position, 'Cargo creado exitosamente', 201);

    } catch (error) {
      logger.error('Error creating position:', error);

      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al crear cargo');
    }
  }

  /**
   * Actualizar cargo
   */
  static async updatePosition(req, res) {
    try {
      const { id } = req.params;
      const positionData = {
        ...req.body,
        updated_by: req.user.id
      };

      // Validación básica
      if (positionData.nombre && positionData.nombre.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre no puede estar vacío');
      }

      const position = await PositionService.updatePosition(id, positionData);

      logger.info('Position updated', {
        id: id,
        userId: req.user.id
      });

      return sendSuccessResponse(res, position, 'Cargo actualizado exitosamente');

    } catch (error) {
      logger.error('Error updating position:', error);

      if (error.message.includes('no encontrado')) {
        return sendErrorResponse(res, 404, error.message);
      }

      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al actualizar cargo');
    }
  }

  /**
   * Eliminar cargo (soft delete)
   */
  static async deletePosition(req, res) {
    try {
      const { id } = req.params;
      const deleted_by = req.user.id;

      await PositionService.deletePosition(id, deleted_by);

      logger.info('Position deleted', {
        id: id,
        userId: deleted_by
      });

      return sendSuccessResponse(res, null, 'Cargo eliminado exitosamente');

    } catch (error) {
      logger.error('Error deleting position:', error);

      if (error.message.includes('no encontrado')) {
        return sendErrorResponse(res, 404, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al eliminar cargo');
    }
  }
}

module.exports = PositionController;
