// ===================================================================
// PROSPERPOS - CONTROLADOR DE FACTURAS DE VENTAS
// ===================================================================

const InvoicesSalesService = require('../services/invoices-sales.service');
const logger = require('../utils/logger');

class InvoicesSalesController {
  /**
   * Obtener todas las facturas de ventas con paginación y filtros
   */
  static async getAll(req, res) {
    try {
      const { page = 1, limit = 50, search, status, payment_status, date_from, date_to } = req.query;

      const result = await InvoicesSalesService.getAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        payment_status,
        date_from,
        date_to
      });

      res.json({
        success: true,
        data: result.invoices,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error in InvoicesSalesController.getAll:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las facturas de ventas',
        error: error.message
      });
    }
  }

  /**
   * Obtener una factura específica por ID
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const invoice = await InvoicesSalesService.getById(id);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada'
        });
      }

      res.json({
        success: true,
        data: invoice
      });
    } catch (error) {
      logger.error('Error in InvoicesSalesController.getById:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la factura',
        error: error.message
      });
    }
  }

  /**
   * Obtener una factura por número de factura
   */
  static async getByInvoiceNumber(req, res) {
    try {
      const { invoice_number } = req.params;
      const invoice = await InvoicesSalesService.getByInvoiceNumber(invoice_number);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada'
        });
      }

      res.json({
        success: true,
        data: invoice
      });
    } catch (error) {
      logger.error('Error in InvoicesSalesController.getByInvoiceNumber:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la factura',
        error: error.message
      });
    }
  }

  /**
   * Obtener estadísticas de facturas
   */
  static async getStats(req, res) {
    try {
      const stats = await InvoicesSalesService.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error in InvoicesSalesController.getStats:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las estadísticas',
        error: error.message
      });
    }
  }
}

module.exports = InvoicesSalesController;
