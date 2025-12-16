// ===================================================================
// PROSPERPOS - CONTROLADOR DE PRODUCTOS VENDIDOS
// ===================================================================

const SoldItemsService = require('../services/sold-items.service');
const logger = require('../utils/logger');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');

class SoldItemsController {
  /**
   * Obtener reporte de productos vendidos con filtros
   * @route GET /api/sold-items
   */
  static async getSoldItems(req, res) {
    try {
      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        customer_id: req.query.customer_id,
        customer_group_id: req.query.customer_group_id,
        seller_id: req.query.seller_id,
        customer_type: req.query.customer_type,
        category_id: req.query.category_id,
        subcategory_id: req.query.subcategory_id,
        product_id: req.query.product_id,
        branch_id: req.query.branch_id,
        brand_id: req.query.brand_id,
        warehouse_id: req.query.warehouse_id,
        include_categories: req.query.include_categories === 'true',
        include_subcategories: req.query.include_subcategories === 'true',
        include_brands: req.query.include_brands === 'true',
        show_costs: req.query.show_costs === 'true',
        show_utility: req.query.show_utility === 'true'
      };

      const result = await SoldItemsService.getSoldItems(filters);

      return sendSuccessResponse(res, result);
    } catch (error) {
      logger.error('Error in SoldItemsController.getSoldItems:', error);
      return sendErrorResponse(res, 500, 'Error al obtener productos vendidos', error.message);
    }
  }

  /**
   * Exportar reporte de productos vendidos
   * @route GET /api/sold-items/export
   */
  static async exportSoldItems(req, res) {
    try {
      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        customer_id: req.query.customer_id,
        customer_group_id: req.query.customer_group_id,
        seller_id: req.query.seller_id,
        customer_type: req.query.customer_type,
        category_id: req.query.category_id,
        subcategory_id: req.query.subcategory_id,
        product_id: req.query.product_id,
        branch_id: req.query.branch_id,
        brand_id: req.query.brand_id,
        warehouse_id: req.query.warehouse_id,
        include_categories: req.query.include_categories === 'true',
        include_subcategories: req.query.include_subcategories === 'true',
        include_brands: req.query.include_brands === 'true',
        show_costs: req.query.show_costs === 'true',
        show_utility: req.query.show_utility === 'true'
      };

      const format = req.query.format || 'excel'; // excel, pdf

      const result = await SoldItemsService.exportSoldItems(filters, format);

      return sendSuccessResponse(res, result);
    } catch (error) {
      logger.error('Error in SoldItemsController.exportSoldItems:', error);
      return sendErrorResponse(res, 500, 'Error al exportar productos vendidos', error.message);
    }
  }

  /**
   * Obtener lista de productos para filtros
   * @route GET /api/sold-items/products
   */
  static async getProducts(req, res) {
    try {
      const result = await SoldItemsService.getProducts();
      return sendSuccessResponse(res, result);
    } catch (error) {
      logger.error('Error in SoldItemsController.getProducts:', error);
      return sendErrorResponse(res, 500, 'Error al obtener productos', error.message);
    }
  }

  /**
   * Obtener lista de grupos para filtros
   * @route GET /api/sold-items/groups
   */
  static async getGroups(req, res) {
    try {
      const result = await SoldItemsService.getGroups();
      return sendSuccessResponse(res, result);
    } catch (error) {
      logger.error('Error in SoldItemsController.getGroups:', error);
      return sendErrorResponse(res, 500, 'Error al obtener grupos', error.message);
    }
  }

  /**
   * Obtener lista de subgrupos para filtros
   * @route GET /api/sold-items/subgroups
   */
  static async getSubgroups(req, res) {
    try {
      const groupId = req.query.group_id;
      const result = await SoldItemsService.getSubgroups(groupId);
      return sendSuccessResponse(res, result);
    } catch (error) {
      logger.error('Error in SoldItemsController.getSubgroups:', error);
      return sendErrorResponse(res, 500, 'Error al obtener subgrupos', error.message);
    }
  }
}

module.exports = SoldItemsController;
