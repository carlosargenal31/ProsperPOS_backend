// ===================================================================
// PROSPERPOS - CONTROLADOR DE UNIDADES
// ===================================================================

const UnitService = require('../services/unit.service');
const logger = require('../utils/logger');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');

class UnitController {

  /**
   * Obtener todas las unidades
   */
  static async getUnits(req, res) {
    try {
      const { search, is_active } = req.query;

      const filters = {
        search: search || '',
        is_active: is_active !== undefined ? is_active === 'true' : null
      };

      const units = await UnitService.getUnits(filters);

      return sendSuccessResponse(res, units, 'Unidades obtenidas exitosamente', 200);

    } catch (error) {
      logger.error('Error getting units:', error);
      return sendErrorResponse(res, 500, 'Error al obtener unidades');
    }
  }

  /**
   * Obtener unidad por ID
   */
  static async getUnitById(req, res) {
    try {
      const { id } = req.params;

      const unit = await UnitService.getUnitById(id);

      if (!unit) {
        return sendErrorResponse(res, 404, 'Unidad no encontrada');
      }

      return sendSuccessResponse(res, unit, 'Unidad obtenida exitosamente', 200);

    } catch (error) {
      logger.error('Error getting unit by ID:', error);
      return sendErrorResponse(res, 500, 'Error al obtener unidad');
    }
  }

  /**
   * Crear nueva unidad
   */
  static async createUnit(req, res) {
    try {
      const unitData = {
        ...req.body,
        created_by: req.user.id
      };

      // Validación básica
      if (!unitData.name || unitData.name.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre de la unidad es requerido');
      }

      const unit = await UnitService.createUnit(unitData);

      logger.info('Unit created', {
        unitId: unit.id,
        userId: req.user.id,
        name: unit.name
      });

      return sendSuccessResponse(res, unit, 'Unidad creada exitosamente', 201);

    } catch (error) {
      logger.error('Error creating unit:', error);

      if (error.message.includes('Ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al crear unidad');
    }
  }

  /**
   * Actualizar unidad
   */
  static async updateUnit(req, res) {
    try {
      const { id } = req.params;
      const unitData = {
        ...req.body,
        updated_by: req.user.id
      };

      // Validación básica
      if (!unitData.name || unitData.name.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre de la unidad es requerido');
      }

      const unit = await UnitService.updateUnit(id, unitData);

      logger.info('Unit updated', {
        unitId: id,
        userId: req.user.id,
        name: unit.name
      });

      return sendSuccessResponse(res, unit, 'Unidad actualizada exitosamente', 200);

    } catch (error) {
      logger.error('Error updating unit:', error);

      if (error.message === 'Unidad no encontrada') {
        return sendErrorResponse(res, 404, error.message);
      }

      if (error.message.includes('Ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al actualizar unidad');
    }
  }

  /**
   * Eliminar unidad
   */
  static async deleteUnit(req, res) {
    try {
      const { id } = req.params;

      await UnitService.deleteUnit(id, req.user.id);

      logger.info('Unit deleted', {
        unitId: id,
        userId: req.user.id
      });

      return sendSuccessResponse(res, null, 'Unidad eliminada exitosamente', 200);

    } catch (error) {
      logger.error('Error deleting unit:', error);

      if (error.message === 'Unidad no encontrada') {
        return sendErrorResponse(res, 404, error.message);
      }

      if (error.message.includes('No se puede eliminar')) {
        return sendErrorResponse(res, 400, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al eliminar unidad');
    }
  }

  /**
   * Obtener unidades activas
   */
  static async getActiveUnits(req, res) {
    try {
      const units = await UnitService.getActiveUnits();

      return sendSuccessResponse(res, units, 'Unidades activas obtenidas exitosamente', 200);

    } catch (error) {
      logger.error('Error getting active units:', error);
      return sendErrorResponse(res, 500, 'Error al obtener unidades activas');
    }
  }
}

module.exports = UnitController;
