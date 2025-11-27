/**
 * Billing Controller
 * Handles HTTP requests for billing and invoicing operations
 */

const Invoice = require('../models/invoice.model');
const BillingService = require('../services/billing.service');
const { sendSuccessResponse, sendErrorResponse, sendPaginatedResponse } = require('../utils/response');
const logger = require('../utils/logger');

class BillingController {
  /**
   * Get all invoices with filters
   * GET /api/v1/billing/invoices
   */
  static async getAllInvoices(req, res) {
    try {
      const filters = {
        search: req.query.search,
        customer_id: req.query.customer_id,
        payment_status: req.query.payment_status,
        status: req.query.status,
        invoice_type: req.query.invoice_type,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        warehouse_id: req.query.warehouse_id,
        page: req.query.page || 1,
        limit: req.query.limit || 50
      };

      const result = await Invoice.getAll(filters);

      sendPaginatedResponse(
        res,
        result.data,
        result.pagination,
        'Facturas obtenidas exitosamente'
      );
    } catch (error) {
      logger.error('Error in BillingController.getAllInvoices:', error);
      sendErrorResponse(res, 500, 'Error al obtener las facturas', error.message);
    }
  }

  /**
   * Get invoice by ID
   * GET /api/v1/billing/invoices/:id
   */
  static async getInvoiceById(req, res) {
    try {
      const { id } = req.params;
      const invoice = await Invoice.getById(id);

      if (!invoice) {
        return sendErrorResponse(res, 404, 'Factura no encontrada');
      }

      sendSuccessResponse(res, invoice, 'Factura obtenida exitosamente');
    } catch (error) {
      logger.error('Error in BillingController.getInvoiceById:', error);
      sendErrorResponse(res, 500, 'Error al obtener la factura', error.message);
    }
  }

  /**
   * Create invoice from sale
   * POST /api/v1/billing/invoices/from-sale
   */
  static async createInvoiceFromSale(req, res) {
    try {
      const { sale_id, invoice_type, due_date, is_credit, payment_terms_days, notes } = req.body;

      if (!sale_id) {
        return sendErrorResponse(res, 400, 'El ID de la venta es requerido');
      }

      const options = {
        invoice_type,
        due_date,
        is_credit,
        payment_terms_days,
        notes,
        created_by: req.user.userId
      };

      const result = await BillingService.createInvoiceFromSale(sale_id, options);

      sendSuccessResponse(res, result, 'Factura creada exitosamente desde la venta', 201);
    } catch (error) {
      logger.error('Error in BillingController.createInvoiceFromSale:', error);
      sendErrorResponse(res, 500, 'Error al crear la factura', error.message);
    }
  }

  /**
   * Create standalone invoice
   * POST /api/v1/billing/invoices
   */
  static async createInvoice(req, res) {
    try {
      const { invoice_data, items } = req.body;

      if (!invoice_data || !items || items.length === 0) {
        return sendErrorResponse(res, 400, 'Los datos de la factura y los artículos son requeridos');
      }

      // Add creator user
      invoice_data.created_by = req.user.id;
      invoice_data.updated_by = req.user.id;

      const result = await BillingService.createStandaloneInvoice(invoice_data, items);

      sendSuccessResponse(res, result, 'Factura creada exitosamente', 201);
    } catch (error) {
      logger.error('Error in BillingController.createInvoice:', error);
      sendErrorResponse(res, 500, 'Error al crear la factura', error.message);
    }
  }

  /**
   * Update invoice
   * PUT /api/v1/billing/invoices/:id
   */
  static async updateInvoice(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      updateData.updated_by = req.user.userId;

      const result = await Invoice.update(id, updateData);

      sendSuccessResponse(res, result, 'Factura actualizada exitosamente');
    } catch (error) {
      logger.error('Error in BillingController.updateInvoice:', error);
      sendErrorResponse(res, 500, 'Error al actualizar la factura', error.message);
    }
  }

  /**
   * Delete invoice (soft delete)
   * DELETE /api/v1/billing/invoices/:id
   */
  static async deleteInvoice(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const result = await Invoice.delete(id, userId);

      sendSuccessResponse(res, result, 'Factura eliminada exitosamente');
    } catch (error) {
      logger.error('Error in BillingController.deleteInvoice:', error);
      sendErrorResponse(res, 500, 'Error al eliminar la factura', error.message);
    }
  }

  /**
   * Record payment for invoice
   * POST /api/v1/billing/invoices/:id/payment
   */
  static async recordPayment(req, res) {
    try {
      const { id } = req.params;
      const paymentData = req.body;

      paymentData.created_by = req.user.userId;

      const result = await BillingService.processPayment(id, paymentData);

      sendSuccessResponse(res, result, 'Pago registrado exitosamente', 201);
    } catch (error) {
      logger.error('Error in BillingController.recordPayment:', error);
      sendErrorResponse(res, 500, 'Error al registrar el pago', error.message);
    }
  }

  /**
   * Get invoice for printing
   * GET /api/v1/billing/invoices/:id/print
   */
  static async getInvoiceForPrint(req, res) {
    try {
      const { id } = req.params;

      const printData = await BillingService.getInvoiceForPrint(id);

      sendSuccessResponse(res, printData, 'Datos de impresión obtenidos exitosamente');
    } catch (error) {
      logger.error('Error in BillingController.getInvoiceForPrint:', error);
      sendErrorResponse(res, 500, 'Error al obtener los datos de impresión', error.message);
    }
  }

  /**
   * Get invoice statistics
   * GET /api/v1/billing/statistics
   */
  static async getStatistics(req, res) {
    try {
      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        warehouse_id: req.query.warehouse_id
      };

      const stats = await Invoice.getStatistics(filters);

      sendSuccessResponse(res, stats, 'Estadísticas obtenidas exitosamente');
    } catch (error) {
      logger.error('Error in BillingController.getStatistics:', error);
      sendErrorResponse(res, 500, 'Error al obtener las estadísticas', error.message);
    }
  }

  /**
   * Get aging report
   * GET /api/v1/billing/aging-report
   */
  static async getAgingReport(req, res) {
    try {
      const report = await Invoice.getAgingReport();

      sendSuccessResponse(res, report, 'Reporte de antigüedad obtenido exitosamente');
    } catch (error) {
      logger.error('Error in BillingController.getAgingReport:', error);
      sendErrorResponse(res, 500, 'Error al obtener el reporte de antigüedad', error.message);
    }
  }

  /**
   * Get dashboard data
   * GET /api/v1/billing/dashboard
   */
  static async getDashboard(req, res) {
    try {
      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        warehouse_id: req.query.warehouse_id
      };

      const dashboardData = await BillingService.getDashboardStats(filters);

      sendSuccessResponse(res, dashboardData, 'Dashboard obtenido exitosamente');
    } catch (error) {
      logger.error('Error in BillingController.getDashboard:', error);
      sendErrorResponse(res, 500, 'Error al obtener el dashboard', error.message);
    }
  }

  /**
   * Update overdue invoices
   * POST /api/v1/billing/update-overdue
   */
  static async updateOverdue(req, res) {
    try {
      const result = await BillingService.updateOverdueInvoices();

      sendSuccessResponse(res, result, 'Facturas vencidas actualizadas');
    } catch (error) {
      logger.error('Error in BillingController.updateOverdue:', error);
      sendErrorResponse(res, 500, 'Error al actualizar facturas vencidas', error.message);
    }
  }

  /**
   * Create credit note
   * POST /api/v1/billing/credit-notes
   */
  static async createCreditNote(req, res) {
    try {
      const { invoice_id, credit_note_data, items } = req.body;

      if (!invoice_id || !credit_note_data || !items || items.length === 0) {
        return sendErrorResponse(res, 400, 'Datos incompletos para crear la nota de crédito');
      }

      credit_note_data.created_by = req.user.userId;

      const result = await BillingService.createCreditNote(invoice_id, credit_note_data, items);

      sendSuccessResponse(res, result, 'Nota de crédito creada exitosamente', 201);
    } catch (error) {
      logger.error('Error in BillingController.createCreditNote:', error);
      sendErrorResponse(res, 500, 'Error al crear la nota de crédito', error.message);
    }
  }

  /**
   * Get billing settings
   * GET /api/v1/billing/settings
   */
  static async getSettings(req, res) {
    try {
      const settings = await BillingService.getSettings();

      sendSuccessResponse(res, settings, 'Configuración obtenida exitosamente');
    } catch (error) {
      logger.error('Error in BillingController.getSettings:', error);
      sendErrorResponse(res, 500, 'Error al obtener la configuración', error.message);
    }
  }

  /**
   * Update billing settings
   * PUT /api/v1/billing/settings
   */
  static async updateSettings(req, res) {
    try {
      const settingsData = req.body;
      settingsData.updated_by = req.user.userId;

      const result = await BillingService.updateSettings(settingsData);

      sendSuccessResponse(res, result, 'Configuración actualizada exitosamente');
    } catch (error) {
      logger.error('Error in BillingController.updateSettings:', error);
      sendErrorResponse(res, 500, 'Error al actualizar la configuración', error.message);
    }
  }

  /**
   * Get outstanding invoices
   * GET /api/v1/billing/outstanding
   */
  static async getOutstandingInvoices(req, res) {
    try {
      const filters = {
        payment_status: 'pending,partial,overdue',
        customer_id: req.query.customer_id,
        page: req.query.page || 1,
        limit: req.query.limit || 50
      };

      const result = await Invoice.getAll(filters);

      sendPaginatedResponse(
        res,
        result.data,
        result.pagination,
        'Facturas pendientes obtenidas exitosamente'
      );
    } catch (error) {
      logger.error('Error in BillingController.getOutstandingInvoices:', error);
      sendErrorResponse(res, 500, 'Error al obtener las facturas pendientes', error.message);
    }
  }
}

module.exports = BillingController;
