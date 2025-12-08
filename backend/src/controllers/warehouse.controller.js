// ===================================================================
// PROSPERPOS - CONTROLADOR DE BODEGAS
// ===================================================================

const WarehouseService = require('../services/warehouse.service');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class WarehouseController {

  /**
   * Obtener todas las bodegas
   */
  static async getWarehouses(req, res) {
    try {
      const { search = '', is_active } = req.query;

      const filters = {
        search,
        is_active: is_active === 'true' ? true : is_active === 'false' ? false : null
      };

      const warehouses = await WarehouseService.getWarehouses(filters);

      return sendSuccessResponse(res, warehouses, 'Bodegas obtenidas exitosamente');

    } catch (error) {
      logger.error('Error getting warehouses:', error);
      return sendErrorResponse(res, 500, 'Error al obtener bodegas');
    }
  }

  /**
   * Obtener bodegas activas
   */
  static async getActiveWarehouses(req, res) {
    try {
      const warehouses = await WarehouseService.getActiveWarehouses();
      return sendSuccessResponse(res, warehouses, 'Bodegas activas obtenidas exitosamente');
    } catch (error) {
      logger.error('Error getting active warehouses:', error);
      return sendErrorResponse(res, 500, 'Error al obtener bodegas activas');
    }
  }

  /**
   * Obtener bodega por ID
   */
  static async getWarehouse(req, res) {
    try {
      const { id } = req.params;

      const warehouse = await WarehouseService.getWarehouseById(id);

      if (!warehouse) {
        return sendErrorResponse(res, 404, 'Bodega no encontrada');
      }

      return sendSuccessResponse(res, warehouse, 'Bodega obtenida exitosamente');

    } catch (error) {
      logger.error('Error getting warehouse:', error);
      return sendErrorResponse(res, 500, 'Error al obtener bodega');
    }
  }

  /**
   * Crear nueva bodega
   */
  static async createWarehouse(req, res) {
    try {
      const warehouseData = {
        ...req.body,
        created_by: req.user.id
      };

      // Validación básica
      if (!warehouseData.nombre || warehouseData.nombre.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre es requerido');
      }

      const warehouse = await WarehouseService.createWarehouse(warehouseData);

      logger.info('Warehouse created', {
        id: warehouse.id,
        userId: req.user.id,
        nombre: warehouse.nombre
      });

      return sendSuccessResponse(res, warehouse, 'Bodega creada exitosamente', 201);

    } catch (error) {
      logger.error('Error creating warehouse:', error);

      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al crear bodega');
    }
  }

  /**
   * Actualizar bodega
   */
  static async updateWarehouse(req, res) {
    try {
      const { id } = req.params;
      const warehouseData = {
        ...req.body,
        updated_by: req.user.id
      };

      // Validación básica
      if (warehouseData.nombre && warehouseData.nombre.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre no puede estar vacío');
      }

      const warehouse = await WarehouseService.updateWarehouse(id, warehouseData);

      logger.info('Warehouse updated', {
        id: id,
        userId: req.user.id
      });

      return sendSuccessResponse(res, warehouse, 'Bodega actualizada exitosamente');

    } catch (error) {
      logger.error('Error updating warehouse:', error);

      if (error.message.includes('no encontrada')) {
        return sendErrorResponse(res, 404, error.message);
      }

      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al actualizar bodega');
    }
  }

  /**
   * Eliminar bodega (soft delete)
   */
  static async deleteWarehouse(req, res) {
    try {
      const { id } = req.params;
      const deleted_by = req.user.id;

      await WarehouseService.deleteWarehouse(id, deleted_by);

      logger.info('Warehouse deleted', {
        id: id,
        userId: deleted_by
      });

      return sendSuccessResponse(res, null, 'Bodega eliminada exitosamente');

    } catch (error) {
      logger.error('Error deleting warehouse:', error);

      if (error.message.includes('no encontrada')) {
        return sendErrorResponse(res, 404, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al eliminar bodega');
    }
  }
}

module.exports = WarehouseController;
