/**
 * Purchase Controller
 * Handles HTTP requests for purchase operations
 */

const purchaseService = require('../services/purchase.service');
const ocrService = require('../services/ocr.service');
const {
  sendSuccessResponse,
  sendErrorResponse,
  sendCreatedResponse,
  sendNotFoundResponse
} = require('../utils/response');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

class PurchaseController {
  /**
   * Get all purchases
   */
  async getAll(req, res) {
    try {
      const filters = {
        search: req.query.search,
        supplier_id: req.query.supplier_id,
        status: req.query.status,
        document_type: req.query.document_type,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        page: req.query.page || 1,
        limit: req.query.limit || 50
      };

      const result = await purchaseService.getAllPurchases(filters);
      return sendSuccessResponse(res, result, 'Compras obtenidas exitosamente');
    } catch (error) {
      logger.error('Error in PurchaseController.getAll:', error);
      return sendErrorResponse(res, 500, error.message);
    }
  }

  /**
   * Get purchase by ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const purchase = await purchaseService.getPurchaseById(id);
      return sendSuccessResponse(res, purchase, 'Compra obtenida exitosamente');
    } catch (error) {
      logger.error('Error in PurchaseController.getById:', error);
      const statusCode = error.message === 'Compra no encontrada' ? 404 : 500;
      return sendErrorResponse(res, statusCode, error.message);
    }
  }

  /**
   * Create purchase
   */
  async create(req, res) {
    try {
      const { items, ...purchaseData } = req.body;

      const result = await purchaseService.createPurchase(purchaseData, items);
      return sendSuccessResponse(res, result, 'Compra creada exitosamente', 201);
    } catch (error) {
      logger.error('Error in PurchaseController.create:', error);
      return sendErrorResponse(res, 500, error.message);
    }
  }

  /**
   * Update purchase
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const result = await purchaseService.updatePurchase(id, req.body);
      return sendSuccessResponse(res, result, 'Compra actualizada exitosamente');
    } catch (error) {
      logger.error('Error in PurchaseController.update:', error);
      const statusCode = error.message === 'Compra no encontrada' ? 404 : 400;
      return sendErrorResponse(res, statusCode, error.message);
    }
  }

  /**
   * Delete purchase
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await purchaseService.deletePurchase(id);
      return sendSuccessResponse(res, result, 'Compra eliminada exitosamente');
    } catch (error) {
      logger.error('Error in PurchaseController.delete:', error);
      const statusCode = error.message === 'Compra no encontrada' ? 404 : 400;
      return sendErrorResponse(res, statusCode, error.message);
    }
  }

  /**
   * Get Purchase Book Report
   */
  async getPurchaseBookReport(req, res) {
    try {
      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        supplier_id: req.query.supplier_id,
        document_type: req.query.document_type
      };

      const result = await purchaseService.getPurchaseBookReport(filters);
      return sendSuccessResponse(res, result, 'Libro de Compras generado exitosamente');
    } catch (error) {
      logger.error('Error in PurchaseController.getPurchaseBookReport:', error);
      return sendErrorResponse(res, 500, error.message);
    }
  }

  /**
   * Get Supplier Statement
   */
  async getSupplierStatement(req, res) {
    try {
      const { supplierId } = req.params;
      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to
      };

      const result = await purchaseService.getSupplierStatement(supplierId, filters);
      return sendSuccessResponse(res, result, 'Estado de cuenta del proveedor obtenido exitosamente');
    } catch (error) {
      logger.error('Error in PurchaseController.getSupplierStatement:', error);
      const statusCode = error.message === 'Proveedor no encontrado' ? 404 : 500;
      return sendErrorResponse(res, statusCode, error.message);
    }
  }

  /**
   * Process invoice image with OCR
   * Extracts data from uploaded invoice image (without saving the file)
   */
  async processInvoiceOCR(req, res) {
    try {
      if (!req.file) {
        return sendErrorResponse(res, 400, 'No se ha cargado ninguna imagen');
      }

      logger.info('Processing invoice OCR from buffer');

      // Process image buffer directly without saving
      const invoiceData = await ocrService.processInvoice(req.file.buffer);

      // Validate extracted data
      const validation = ocrService.validateInvoiceData(invoiceData);

      // Return extracted data with validation results (no image path - not saved)
      return sendSuccessResponse(res, {
        data: invoiceData,
        validation
      }, 'Factura procesada exitosamente');
    } catch (error) {
      logger.error('Error in PurchaseController.processInvoiceOCR:', error);
      return sendErrorResponse(res, 500, error.message);
    }
  }

  /**
   * Create purchase from OCR data
   * Creates a purchase record with extracted invoice data (no image saving)
   */
  async createFromOCR(req, res) {
    try {
      const { ocrData, items } = req.body;

      // Build purchase data from OCR results
      const purchaseData = {
        document_type: 'FACTURA',
        purchase_date: ocrData.invoice_date || new Date(),
        supplier_name: ocrData.supplier_name,
        supplier_id_number: ocrData.supplier_id,
        invoice_number: ocrData.invoice_number,
        net_amount: ocrData.subtotal || 0,
        tax_amount: ocrData.tax || 0,
        discount_amount: ocrData.discount || 0,
        total_amount: ocrData.total || 0,
        notes: 'Factura procesada con OCR',
        status: 'Completed'
      };

      const result = await purchaseService.createPurchase(purchaseData, items || []);
      return sendSuccessResponse(res, result, 'Compra creada exitosamente desde OCR', 201);
    } catch (error) {
      logger.error('Error in PurchaseController.createFromOCR:', error);
      return sendErrorResponse(res, 500, error.message);
    }
  }

  /**
   * Upload invoice image
   * Uploads invoice image and returns the filename
   */
  async uploadInvoiceImage(req, res) {
    try {
      if (!req.file) {
        return sendErrorResponse(res, 400, 'No se ha cargado ninguna imagen');
      }

      return sendSuccessResponse(res, {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      }, 'Imagen de factura cargada exitosamente');
    } catch (error) {
      logger.error('Error in PurchaseController.uploadInvoiceImage:', error);
      return sendErrorResponse(res, 500, error.message);
    }
  }

  /**
   * Get invoice image
   * Returns the invoice image file
   */
  async getInvoiceImage(req, res) {
    try {
      const { filename } = req.params;
      const uploadsDir = path.join(__dirname, '../../uploads/invoices');
      const imagePath = path.join(uploadsDir, filename);

      // Check if file exists
      try {
        await fs.access(imagePath);
      } catch {
        return sendErrorResponse(res, 404, 'Imagen no encontrada');
      }

      return res.sendFile(imagePath);
    } catch (error) {
      logger.error('Error in PurchaseController.getInvoiceImage:', error);
      return sendErrorResponse(res, 500, error.message);
    }
  }
}

module.exports = new PurchaseController();
