// ===================================================================
// PROSPERPOS - CONTROLADOR DE AJUSTE DE INVENTARIO
// ===================================================================

const InventoryAdjustmentService = require('../services/inventory-adjustment.service');
const logger = require('../utils/logger');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');

class InventoryAdjustmentController {
  /**
   * Obtener siguiente consecutivo
   * @route GET /api/inventory-adjustments/next-consecutive
   */
  static async getNextConsecutive(req, res) {
    try {
      const consecutive = await InventoryAdjustmentService.getNextConsecutive();
      return sendSuccessResponse(res, { consecutive });
    } catch (error) {
      logger.error('Error in getNextConsecutive:', error);
      return sendErrorResponse(res, 500, 'Error al obtener consecutivo', error.message);
    }
  }

  /**
   * Obtener datos de inventario para ajuste
   * @route GET /api/inventory-adjustments/inventory
   */
  static async getInventoryForAdjustment(req, res) {
    try {
      const filters = {
        warehouse_id: req.query.warehouse_id,
        store_id: req.query.store_id,
        product_id: req.query.product_id,
        product_code: req.query.product_code,
        product_name: req.query.product_name,
        category_id: req.query.category_id,
        subcategory_id: req.query.subcategory_id,
        existence_filter: req.query.existence_filter || 'all'
      };

      console.log('getInventoryForAdjustment filters:', filters);

      const items = await InventoryAdjustmentService.getInventoryForAdjustment(filters);

      console.log('Stock items returned:', items.length);
      if (items.length > 0) {
        console.log('Sample item:', items[0]);
      }

      return sendSuccessResponse(res, items);
    } catch (error) {
      logger.error('Error in getInventoryForAdjustment:', error);
      return sendErrorResponse(res, 500, 'Error al obtener inventario', error.message);
    }
  }

  /**
   * Listar ajustes de inventario
   * @route GET /api/inventory-adjustments
   */
  static async listAdjustments(req, res) {
    try {
      const filters = {
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        warehouse_id: req.query.warehouse_id,
        status: req.query.status,
        search: req.query.search,
        page: req.query.page || 1,
        limit: req.query.limit || 50
      };

      const result = await InventoryAdjustmentService.listAdjustments(filters);
      return sendSuccessResponse(res, result);
    } catch (error) {
      logger.error('Error in listAdjustments:', error);
      return sendErrorResponse(res, 500, 'Error al listar ajustes', error.message);
    }
  }

  /**
   * Crear ajuste de inventario
   * @route POST /api/inventory-adjustments
   */
  static async createAdjustment(req, res) {
    try {
      const userId = req.user?.id;
      const result = await InventoryAdjustmentService.createAdjustment(req.body, userId);
      return sendSuccessResponse(res, result, 201);
    } catch (error) {
      logger.error('Error in createAdjustment:', error);
      return sendErrorResponse(res, 500, 'Error al crear ajuste', error.message);
    }
  }

  /**
   * Aplicar ajuste al inventario
   * @route POST /api/inventory-adjustments/:id/apply
   */
  static async applyAdjustment(req, res) {
    try {
      const userId = req.user?.id;
      const adjustmentId = req.params.id;
      const result = await InventoryAdjustmentService.applyAdjustment(adjustmentId, userId);
      return sendSuccessResponse(res, result);
    } catch (error) {
      logger.error('Error in applyAdjustment:', error);
      return sendErrorResponse(res, 500, 'Error al aplicar ajuste', error.message);
    }
  }

  /**
   * Obtener detalle de ajuste
   * @route GET /api/inventory-adjustments/:id
   */
  static async getAdjustmentDetail(req, res) {
    try {
      const adjustmentId = req.params.id;
      const result = await InventoryAdjustmentService.getAdjustmentDetail(adjustmentId);
      return sendSuccessResponse(res, result);
    } catch (error) {
      logger.error('Error in getAdjustmentDetail:', error);
      return sendErrorResponse(res, 500, 'Error al obtener detalle', error.message);
    }
  }
}

module.exports = InventoryAdjustmentController;
