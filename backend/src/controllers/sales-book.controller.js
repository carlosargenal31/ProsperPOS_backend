// ===================================================================
// PROSPERPOS - CONTROLADOR DE LIBRO DE VENTAS
// ===================================================================

const SalesBookService = require('../services/sales-book.service');
const logger = require('../utils/logger');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');

class SalesBookController {
  /**
   * Obtener el libro de ventas con filtros
   * @route GET /api/sales-book
   */
  static async getSalesBook(req, res) {
    try {
      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        agency_id: req.query.agency_id,
        customer_id: req.query.customer_id,
        customer_type: req.query.customer_type,
        document_type: req.query.document_type || 'FACTURA',
        seller_id: req.query.seller_id,
        payment_status: req.query.payment_status,
        show_only_returns: req.query.show_only_returns === 'true'
      };

      const result = await SalesBookService.getSalesBook(filters);

      return sendSuccessResponse(res, result);
    } catch (error) {
      logger.error('Error in SalesBookController.getSalesBook:', error);
      return sendErrorResponse(res, 500, 'Error al obtener el libro de ventas', error.message);
    }
  }

  /**
   * Obtener resumen agrupado del libro de ventas
   * @route GET /api/sales-book/summary
   */
  static async getSalesBookSummary(req, res) {
    try {
      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        agency_id: req.query.agency_id,
        seller_id: req.query.seller_id,
        payment_status: req.query.payment_status
      };

      const groupBy = req.query.group_by || 'day'; // day, week, month, agency, seller, customer

      const result = await SalesBookService.getSalesBookSummary(filters, groupBy);

      return sendSuccessResponse(res, result);
    } catch (error) {
      logger.error('Error in SalesBookController.getSalesBookSummary:', error);
      return sendErrorResponse(res, 500, 'Error al obtener el resumen del libro de ventas', error.message);
    }
  }

  /**
   * Exportar libro de ventas
   * @route GET /api/sales-book/export
   */
  static async exportSalesBook(req, res) {
    try {
      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        agency_id: req.query.agency_id,
        customer_id: req.query.customer_id,
        customer_type: req.query.customer_type,
        document_type: req.query.document_type || 'FACTURA',
        seller_id: req.query.seller_id,
        payment_status: req.query.payment_status,
        show_only_returns: req.query.show_only_returns === 'true'
      };

      const result = await SalesBookService.exportSalesBook(filters);

      return sendSuccessResponse(res, result);
    } catch (error) {
      logger.error('Error in SalesBookController.exportSalesBook:', error);
      return sendErrorResponse(res, 500, 'Error al exportar el libro de ventas', error.message);
    }
  }
}

module.exports = SalesBookController;
