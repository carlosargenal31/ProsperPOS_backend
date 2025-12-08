// ===================================================================
// PROSPERPOS - CONTROLADOR DE DEVOLUCIONES DE COMPRAS
// ===================================================================

const PurchaseReturnService = require('../services/purchase-return.service');
const logger = require('../utils/logger');

class PurchaseReturnController {
  /**
   * Procesar una nueva devolución de compra (SOLO MONTO, NO PRODUCTOS)
   */
  static async processReturn(req, res) {
    try {
      const returnData = req.body;
      const userId = req.user.id;

      // Validaciones básicas
      if (!returnData.purchase_id) {
        return res.status(400).json({
          success: false,
          message: 'El ID de la compra es requerido'
        });
      }

      if (!returnData.return_amount || returnData.return_amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El monto a devolver debe ser mayor a 0'
        });
      }

      if (!returnData.emission_date) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de emisión es requerida'
        });
      }

      const result = await PurchaseReturnService.processReturn(returnData, userId);

      res.status(201).json({
        success: true,
        message: 'Devolución de compra procesada exitosamente',
        data: result
      });
    } catch (error) {
      logger.error('Error en PurchaseReturnController.processReturn:', error);
      res.status(500).json({
        success: false,
        message: 'Error al procesar la devolución de compra',
        error: error.message
      });
    }
  }

  /**
   * Registrar la Nota de Crédito del proveedor
   */
  static async registerCreditNote(req, res) {
    try {
      const { id } = req.params;
      const creditNoteData = req.body;
      const userId = req.user.id;

      // Validaciones
      if (!creditNoteData.credit_note_number) {
        return res.status(400).json({
          success: false,
          message: 'El número de Nota de Crédito es requerido'
        });
      }

      if (!creditNoteData.credit_note_date) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de la Nota de Crédito es requerida'
        });
      }

      const result = await PurchaseReturnService.registerSupplierCreditNote(
        id,
        creditNoteData,
        userId
      );

      res.json({
        success: true,
        message: 'Nota de Crédito del proveedor registrada exitosamente',
        data: result
      });
    } catch (error) {
      logger.error('Error en PurchaseReturnController.registerCreditNote:', error);
      const statusCode = error.message.includes('no encontrada') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtener todas las devoluciones de compras
   */
  static async getAll(req, res) {
    try {
      const filters = {
        supplier_id: req.query.supplier_id,
        return_type: req.query.return_type,
        credit_note_received: req.query.credit_note_received,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        search: req.query.search,
        page: req.query.page || 1,
        limit: req.query.limit || 50
      };

      const result = await PurchaseReturnService.getAllReturns(filters);

      res.json({
        success: true,
        data: result.returns,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: Math.ceil(result.total / result.limit)
        }
      });
    } catch (error) {
      logger.error('Error en PurchaseReturnController.getAll:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las devoluciones de compras',
        error: error.message
      });
    }
  }

  /**
   * Obtener una devolución por ID con sus items
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const result = await PurchaseReturnService.getReturnById(id);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error en PurchaseReturnController.getById:', error);
      const statusCode = error.message === 'Devolución de compra no encontrada' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Actualizar una devolución
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      const userId = req.user.id;

      const result = await PurchaseReturnService.updateReturn(id, data, userId);

      res.json({
        success: true,
        message: 'Devolución actualizada exitosamente',
        data: result
      });
    } catch (error) {
      logger.error('Error en PurchaseReturnController.update:', error);
      const statusCode = error.message === 'Devolución de compra no encontrada' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Eliminar una devolución
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await PurchaseReturnService.deleteReturn(id, userId);

      res.json({
        success: true,
        message: 'Devolución eliminada exitosamente',
        data: result
      });
    } catch (error) {
      logger.error('Error en PurchaseReturnController.delete:', error);
      const statusCode = error.message === 'Devolución de compra no encontrada' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtener devoluciones pendientes de NC (sin Nota de Crédito registrada)
   */
  static async getPendingCreditNotes(req, res) {
    try {
      const filters = {
        credit_note_received: false,
        page: req.query.page || 1,
        limit: req.query.limit || 50
      };

      const result = await PurchaseReturnService.getAllReturns(filters);

      res.json({
        success: true,
        data: result.returns,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: Math.ceil(result.total / result.limit)
        }
      });
    } catch (error) {
      logger.error('Error en PurchaseReturnController.getPendingCreditNotes:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener devoluciones pendientes',
        error: error.message
      });
    }
  }
}

module.exports = PurchaseReturnController;
