// ===================================================================
// PROSPERPOS - CONTROLADOR DE INVENTARIO FÍSICO
// ===================================================================

const PhysicalInventoryService = require('../services/physical-inventory.service');
const logger = require('../utils/logger');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');

class PhysicalInventoryController {
  /**
   * Obtener el inventario físico con filtros
   * @route GET /api/physical-inventory
   */
  static async getPhysicalInventory(req, res) {
    try {
      const filters = {
        product_id: req.query.product_id,
        article_name: req.query.article_name,
        category_id: req.query.category_id,
        subcategory_id: req.query.subcategory_id,
        warehouse_id: req.query.warehouse_id,
        brand_id: req.query.brand_id,
        existence_filter: req.query.existence_filter || 'all',
        include_cost: req.query.include_cost === 'true',
        include_average_cost: req.query.include_average_cost === 'true',
        include_prices: req.query.include_prices === 'true',
        include_codes: req.query.include_codes === 'true',
        include_unit: req.query.include_unit === 'true',
        include_brand: req.query.include_brand === 'true',
        include_images: req.query.include_images === 'true',
        group_by_warehouses: req.query.group_by_warehouses !== 'false',
        group_by_groups: req.query.group_by_groups === 'true',
        group_by_articles: req.query.group_by_articles === 'true',
        include_suspended: req.query.include_suspended === 'true',
        is_for_inventory_taking: req.query.is_for_inventory_taking === 'true'
      };

      const result = await PhysicalInventoryService.getPhysicalInventory(filters);

      return sendSuccessResponse(res, result);
    } catch (error) {
      logger.error('Error in PhysicalInventoryController.getPhysicalInventory:', error);
      return sendErrorResponse(res, 500, 'Error al obtener el inventario físico', error.message);
    }
  }

  /**
   * Exportar inventario físico
   * @route GET /api/physical-inventory/export
   */
  static async exportPhysicalInventory(req, res) {
    try {
      const filters = {
        product_id: req.query.product_id,
        article_name: req.query.article_name,
        category_id: req.query.category_id,
        subcategory_id: req.query.subcategory_id,
        warehouse_id: req.query.warehouse_id,
        brand_id: req.query.brand_id,
        existence_filter: req.query.existence_filter || 'all',
        include_cost: req.query.include_cost === 'true',
        include_average_cost: req.query.include_average_cost === 'true',
        include_prices: req.query.include_prices === 'true',
        include_codes: req.query.include_codes === 'true',
        include_unit: req.query.include_unit === 'true',
        include_brand: req.query.include_brand === 'true',
        include_images: req.query.include_images === 'true',
        group_by_warehouses: req.query.group_by_warehouses !== 'false',
        group_by_groups: req.query.group_by_groups === 'true',
        group_by_articles: req.query.group_by_articles === 'true',
        include_suspended: req.query.include_suspended === 'true',
        is_for_inventory_taking: req.query.is_for_inventory_taking === 'true'
      };

      const result = await PhysicalInventoryService.exportPhysicalInventory(filters);

      return sendSuccessResponse(res, result);
    } catch (error) {
      logger.error('Error in PhysicalInventoryController.exportPhysicalInventory:', error);
      return sendErrorResponse(res, 500, 'Error al exportar el inventario físico', error.message);
    }
  }

  /**
   * Obtener resumen de inventario por almacén
   * @route GET /api/physical-inventory/summary
   */
  static async getInventorySummary(req, res) {
    try {
      const filters = {
        group_id: req.query.group_id,
        brand_id: req.query.brand_id,
        existence_filter: req.query.existence_filter || 'all'
      };

      const result = await PhysicalInventoryService.getInventorySummaryByWarehouse(filters);

      return sendSuccessResponse(res, result);
    } catch (error) {
      logger.error('Error in PhysicalInventoryController.getInventorySummary:', error);
      return sendErrorResponse(res, 500, 'Error al obtener el resumen de inventario', error.message);
    }
  }
}

module.exports = PhysicalInventoryController;
