// ===================================================================
// PROSPERPOS - CONTROLADOR DE LIBRO DE COMPRAS
// ===================================================================

const PurchaseBookService = require('../services/purchase-book.service');
const logger = require('../utils/logger');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');

class PurchaseBookController {
  /**
   * Obtener el libro de compras con filtros
   * @route GET /api/purchase-book
   */
  static async getPurchaseBook(req, res) {
    try {
      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        warehouse_id: req.query.warehouse_id,
        supplier_id: req.query.supplier_id,
        payment_status: req.query.payment_status,
        show_only_returns: req.query.show_only_returns === 'true'
      };

      const result = await PurchaseBookService.getPurchaseBook(filters);

      return sendSuccessResponse(res, result);
    } catch (error) {
      logger.error('Error in PurchaseBookController.getPurchaseBook:', error);
      return sendErrorResponse(res, 500, 'Error al obtener el libro de compras', error.message);
    }
  }

  /**
   * Obtener resumen agrupado del libro de compras
   * @route GET /api/purchase-book/summary
   */
  static async getPurchaseBookSummary(req, res) {
    try {
      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        warehouse_id: req.query.warehouse_id,
        supplier_id: req.query.supplier_id,
        payment_status: req.query.payment_status
      };

      const groupBy = req.query.group_by || 'day'; // day, week, month, warehouse, supplier

      const result = await PurchaseBookService.getPurchaseBookSummary(filters, groupBy);

      return sendSuccessResponse(res, result);
    } catch (error) {
      logger.error('Error in PurchaseBookController.getPurchaseBookSummary:', error);
      return sendErrorResponse(res, 500, 'Error al obtener el resumen del libro de compras', error.message);
    }
  }

  /**
   * Exportar libro de compras a Excel
   * @route GET /api/purchase-book/export
   */
  static async exportPurchaseBook(req, res) {
    try {
      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        warehouse_id: req.query.warehouse_id,
        supplier_id: req.query.supplier_id,
        payment_status: req.query.payment_status,
        show_only_returns: req.query.show_only_returns === 'true'
      };

      const result = await PurchaseBookService.exportPurchaseBook(filters);

      return sendSuccessResponse(res, result);
    } catch (error) {
      logger.error('Error in PurchaseBookController.exportPurchaseBook:', error);
      return sendErrorResponse(res, 500, 'Error al exportar el libro de compras', error.message);
    }
  }

  /**
   * Exportar libro de compras a PDF
   * @route GET /api/purchase-book/export-pdf
   */
  static async exportPurchaseBookPDF(req, res) {
    try {
      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        warehouse_id: req.query.warehouse_id,
        supplier_id: req.query.supplier_id,
        payment_status: req.query.payment_status,
        show_only_returns: req.query.show_only_returns === 'true'
      };

      await PurchaseBookService.exportPurchaseBookPDF(filters, res);
    } catch (error) {
      logger.error('Error in PurchaseBookController.exportPurchaseBookPDF:', error);
      return sendErrorResponse(res, 500, 'Error al exportar el libro de compras a PDF', error.message);
    }
  }
}

module.exports = PurchaseBookController;
