/**
 * Purchase Controller
 * Handles HTTP requests for purchase operations
 */

const purchaseService = require('../services/purchase.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class PurchaseController {
  /**
   * Get all purchases
   */
  async getAll(req, res) {
    try {
      const filters = {
        search: req.query.search,
        supplier_id: req.query.supplier_id,
        payment_status: req.query.payment_status,
        status: req.query.status,
        document_type: req.query.document_type,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        warehouse_id: req.query.warehouse_id,
        page: req.query.page || 1,
        limit: req.query.limit || 50
      };

      const result = await purchaseService.getAllPurchases(filters);
      return successResponse(res, result, 'Compras obtenidas exitosamente');
    } catch (error) {
      logger.error('Error in PurchaseController.getAll:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get purchase by ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const purchase = await purchaseService.getPurchaseById(id);
      return successResponse(res, purchase, 'Compra obtenida exitosamente');
    } catch (error) {
      logger.error('Error in PurchaseController.getById:', error);
      const statusCode = error.message === 'Compra no encontrada' ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  /**
   * Create purchase
   */
  async create(req, res) {
    try {
      const { items, ...purchaseData } = req.body;

      const result = await purchaseService.createPurchase(purchaseData, items);
      return successResponse(res, result, 'Compra creada exitosamente', 201);
    } catch (error) {
      logger.error('Error in PurchaseController.create:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Update purchase
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const result = await purchaseService.updatePurchase(id, req.body);
      return successResponse(res, result, 'Compra actualizada exitosamente');
    } catch (error) {
      logger.error('Error in PurchaseController.update:', error);
      const statusCode = error.message === 'Compra no encontrada' ? 404 : 400;
      return errorResponse(res, error.message, statusCode);
    }
  }

  /**
   * Delete purchase
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await purchaseService.deletePurchase(id);
      return successResponse(res, result, 'Compra eliminada exitosamente');
    } catch (error) {
      logger.error('Error in PurchaseController.delete:', error);
      const statusCode = error.message === 'Compra no encontrada' ? 404 : 400;
      return errorResponse(res, error.message, statusCode);
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
      return successResponse(res, result, 'Libro de Compras generado exitosamente');
    } catch (error) {
      logger.error('Error in PurchaseController.getPurchaseBookReport:', error);
      return errorResponse(res, error.message, 500);
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
      return successResponse(res, result, 'Estado de cuenta del proveedor obtenido exitosamente');
    } catch (error) {
      logger.error('Error in PurchaseController.getSupplierStatement:', error);
      const statusCode = error.message === 'Proveedor no encontrado' ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  }
}

module.exports = new PurchaseController();
