// ===================================================================
// PROSPERPOS - CONTROLADOR DE HISTORIAL DE EXISTENCIAS
// ===================================================================

const StockHistoryService = require('../services/stock-history.service');
const logger = require('../utils/logger');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');

class StockHistoryController {
  /**
   * Obtener historial de existencias con filtros
   * @route GET /api/stock-history
   */
  static async getStockHistory(req, res) {
    try {
      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        category_id: req.query.category_id,
        subcategory_id: req.query.subcategory_id,
        product_id: req.query.product_id,
        warehouse_id: req.query.warehouse_id,
        branch_id: req.query.branch_id,
      };

      const result = await StockHistoryService.getStockHistory(filters);

      return sendSuccessResponse(res, result);
    } catch (error) {
      logger.error('Error in StockHistoryController.getStockHistory:', error);
      return sendErrorResponse(res, 500, 'Error al obtener historial de existencias', error.message);
    }
  }

  /**
   * Exportar historial de existencias
   * @route GET /api/stock-history/export
   */
  static async exportStockHistory(req, res) {
    try {
      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        category_id: req.query.category_id,
        subcategory_id: req.query.subcategory_id,
        product_id: req.query.product_id,
        warehouse_id: req.query.warehouse_id,
        branch_id: req.query.branch_id,
      };

      const format = req.query.format || 'excel'; // excel, pdf

      const result = await StockHistoryService.exportStockHistory(filters, format);

      return sendSuccessResponse(res, result);
    } catch (error) {
      logger.error('Error in StockHistoryController.exportStockHistory:', error);
      return sendErrorResponse(res, 500, 'Error al exportar historial de existencias', error.message);
    }
  }

  /**
   * Obtener lista de categorías para filtros
   * @route GET /api/stock-history/categories
   */
  static async getCategories(req, res) {
    try {
      const result = await StockHistoryService.getCategories();
      return sendSuccessResponse(res, result);
    } catch (error) {
      logger.error('Error in StockHistoryController.getCategories:', error);
      return sendErrorResponse(res, 500, 'Error al obtener categorías', error.message);
    }
  }

  /**
   * Obtener lista de subcategorías para filtros
   * @route GET /api/stock-history/subcategories
   */
  static async getSubcategories(req, res) {
    try {
      const categoryId = req.query.category_id;
      const result = await StockHistoryService.getSubcategories(categoryId);
      return sendSuccessResponse(res, result);
    } catch (error) {
      logger.error('Error in StockHistoryController.getSubcategories:', error);
      return sendErrorResponse(res, 500, 'Error al obtener subcategorías', error.message);
    }
  }

  /**
   * Obtener lista de productos para filtros
   * @route GET /api/stock-history/products
   */
  static async getProducts(req, res) {
    try {
      const categoryId = req.query.category_id;
      const subcategoryId = req.query.subcategory_id;
      const result = await StockHistoryService.getProducts(categoryId, subcategoryId);
      return sendSuccessResponse(res, result);
    } catch (error) {
      logger.error('Error in StockHistoryController.getProducts:', error);
      return sendErrorResponse(res, 500, 'Error al obtener productos', error.message);
    }
  }

  /**
   * Obtener lista de almacenes para filtros
   * @route GET /api/stock-history/warehouses
   */
  static async getWarehouses(req, res) {
    try {
      const result = await StockHistoryService.getWarehouses();
      return sendSuccessResponse(res, result);
    } catch (error) {
      logger.error('Error in StockHistoryController.getWarehouses:', error);
      return sendErrorResponse(res, 500, 'Error al obtener almacenes', error.message);
    }
  }
}

module.exports = StockHistoryController;
