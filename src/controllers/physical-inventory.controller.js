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
      // Helper para convertir string a boolean
      const toBool = (value) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return Boolean(value);
      };

      const filters = {
        // Filtros de ID - convertir a número si existen y no están vacíos
        product_id: req.query.product_id && req.query.product_id !== '' ? parseInt(req.query.product_id) : null,
        category_id: req.query.category_id && req.query.category_id !== '' ? parseInt(req.query.category_id) : null,
        subcategory_id: req.query.subcategory_id && req.query.subcategory_id !== '' ? parseInt(req.query.subcategory_id) : null,
        warehouse_id: req.query.warehouse_id && req.query.warehouse_id !== '' ? parseInt(req.query.warehouse_id) : null,
        brand_id: req.query.brand_id && req.query.brand_id !== '' ? parseInt(req.query.brand_id) : null,

        // Filtros de texto
        article_name: req.query.article_name || null,

        // Filtro de existencias
        existence_filter: req.query.existence_filter || 'all',

        // Opciones de inclusión - convertir a boolean
        include_cost: toBool(req.query.include_cost),
        include_average_cost: toBool(req.query.include_average_cost),
        include_prices: toBool(req.query.include_prices),
        include_codes: toBool(req.query.include_codes),
        include_unit: toBool(req.query.include_unit),
        include_brand: toBool(req.query.include_brand),

        // Opciones de agrupación - convertir a boolean
        group_by_warehouses: req.query.group_by_warehouses !== 'false' && req.query.group_by_warehouses !== false,
        group_by_groups: toBool(req.query.group_by_groups),
        group_by_articles: toBool(req.query.group_by_articles),
        include_suspended: toBool(req.query.include_suspended),
        is_for_inventory_taking: toBool(req.query.is_for_inventory_taking)
      };

      logger.info('Physical Inventory Filters:', filters);

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
      // Helper para convertir string a boolean
      const toBool = (value) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return Boolean(value);
      };

      const filters = {
        // Filtros de ID - convertir a número si existen y no están vacíos
        product_id: req.query.product_id && req.query.product_id !== '' ? parseInt(req.query.product_id) : null,
        category_id: req.query.category_id && req.query.category_id !== '' ? parseInt(req.query.category_id) : null,
        subcategory_id: req.query.subcategory_id && req.query.subcategory_id !== '' ? parseInt(req.query.subcategory_id) : null,
        warehouse_id: req.query.warehouse_id && req.query.warehouse_id !== '' ? parseInt(req.query.warehouse_id) : null,
        brand_id: req.query.brand_id && req.query.brand_id !== '' ? parseInt(req.query.brand_id) : null,

        // Filtros de texto
        article_name: req.query.article_name || null,

        // Filtro de existencias
        existence_filter: req.query.existence_filter || 'all',

        // Opciones de inclusión - convertir a boolean
        include_cost: toBool(req.query.include_cost),
        include_average_cost: toBool(req.query.include_average_cost),
        include_prices: toBool(req.query.include_prices),
        include_codes: toBool(req.query.include_codes),
        include_unit: toBool(req.query.include_unit),
        include_brand: toBool(req.query.include_brand),

        // Opciones de agrupación - convertir a boolean
        group_by_warehouses: req.query.group_by_warehouses !== 'false' && req.query.group_by_warehouses !== false,
        group_by_groups: toBool(req.query.group_by_groups),
        group_by_articles: toBool(req.query.group_by_articles),
        include_suspended: toBool(req.query.include_suspended),
        is_for_inventory_taking: toBool(req.query.is_for_inventory_taking)
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
