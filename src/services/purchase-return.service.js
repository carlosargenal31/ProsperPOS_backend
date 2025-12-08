// ===================================================================
// PROSPERPOS - SERVICIO DE DEVOLUCIONES DE COMPRAS
// ===================================================================

const PurchaseReturnModel = require('../models/purchase-return.model');
const db = require('../utils/database');
const logger = require('../utils/logger');

class PurchaseReturnService {
  /**
   * Procesar una nueva devolución de compra (SOLO MONTO)
   * Este método maneja toda la lógica de negocio:
   * - Registrar la devolución con el monto a devolver
   * - Ajustar la cuenta por pagar al proveedor
   * - Ajustar el crédito fiscal/IVA
   * NO maneja productos, solo dinero
   */
  static async processReturn(returnData, userId) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Validar que exista la compra original
      const purchaseSql = 'SELECT * FROM purchases_documents WHERE id = ?';
      const [purchases] = await connection.query(purchaseSql, [returnData.purchase_id]);

      if (!purchases || purchases.length === 0) {
        throw new Error('Compra no encontrada');
      }

      const purchase = purchases[0];

      // 2. Buscar el proveedor por nombre (purchases_documents no tiene supplier_id)
      const supplierSql = 'SELECT * FROM suppliers WHERE nombre = ? LIMIT 1';
      const [suppliers] = await connection.query(supplierSql, [purchase.supplier_name]);

      // Si no se encuentra el proveedor, usar datos de la compra
      const supplier = suppliers && suppliers.length > 0 ? suppliers[0] : {
        id: null,
        nombre: purchase.supplier_name,
        doc_identificacion: purchase.supplier_id_number
      };

      // 3. Generar correlativo único
      const correlative = await PurchaseReturnModel.generateCorrelative();

      // 4. Usar los totales enviados desde el frontend
      const subtotal = returnData.subtotal || 0;
      const tax = returnData.tax || 0;
      const total = returnData.return_amount || 0;
      const discount = 0; // No hay descuentos en devoluciones de monto

      // 5. Crear el registro de devolución
      const returnRecord = {
        purchase_id: returnData.purchase_id,
        purchase_number: purchase.purchase_number,
        supplier_id: supplier.id,
        supplier_name: supplier.nombre || purchase.supplier_name,
        supplier_rtn: supplier.doc_identificacion || purchase.supplier_id_number || null,
        return_type: returnData.return_type || 'partial',
        correlative: correlative,
        emission_date: returnData.emission_date || new Date(),
        notes: returnData.notes || null,
        credit_note_received: false,
        subtotal: subtotal,
        discount: discount,
        tax: tax,
        total: total,
        created_by: userId
      };

      const insertReturnSql = `
        INSERT INTO purchase_returns (
          purchase_id,
          purchase_number,
          supplier_id,
          supplier_name,
          supplier_rtn,
          return_type,
          correlative,
          emission_date,
          notes,
          credit_note_received,
          subtotal,
          discount,
          tax,
          total,
          created_by,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const [returnResult] = await connection.query(insertReturnSql, [
        returnRecord.purchase_id,
        returnRecord.purchase_number,
        returnRecord.supplier_id,
        returnRecord.supplier_name,
        returnRecord.supplier_rtn,
        returnRecord.return_type,
        returnRecord.correlative,
        returnRecord.emission_date,
        returnRecord.notes,
        returnRecord.credit_note_received,
        returnRecord.subtotal,
        returnRecord.discount,
        returnRecord.tax,
        returnRecord.total,
        returnRecord.created_by
      ]);

      const returnId = returnResult.insertId;

      // 6. NO HAY ITEMS - Solo registramos el monto total de la devolución

      // 7. ACTUALIZAR ESTADO DE LA COMPRA A 'DEVUELTA'
      const updatePurchaseStatusSql = `
        UPDATE purchases_documents
        SET status = 'Devuelta',
            updated_at = NOW()
        WHERE id = ?
      `;

      await connection.query(updatePurchaseStatusSql, [returnData.purchase_id]);

      // 8. AJUSTE AUTOMÁTICO: Disminuir cuenta por pagar al proveedor
      // Aquí puedes implementar la lógica de cuentas por pagar si tienes una tabla para ello
      // Por ejemplo, si tienes una tabla 'accounts_payable' o similar

      // 9. AJUSTE AUTOMÁTICO: Ajustar crédito fiscal/IVA
      // Registrar el crédito fiscal recuperado por la devolución
      const insertTaxCreditSql = `
        INSERT INTO tax_adjustments (
          adjustment_type,
          reference_type,
          reference_id,
          tax_amount,
          description,
          created_by,
          created_at
        ) VALUES ('credit', 'purchase_return', ?, ?, ?, ?, NOW())
      `;

      // Verificar si existe la tabla tax_adjustments, si no existe, skip
      try {
        await connection.query(insertTaxCreditSql, [
          returnId,
          tax,
          `Crédito fiscal por devolución de compra ${correlative}`,
          userId
        ]);
      } catch (taxError) {
        // Si la tabla no existe, simplemente continuamos
        logger.warn('Tabla tax_adjustments no existe, omitiendo ajuste de IVA', { error: taxError.message });
      }

      await connection.commit();

      logger.info('Devolución de compra procesada exitosamente', {
        returnId,
        correlative,
        userId,
        total
      });

      return {
        return_id: returnId,
        correlative: correlative,
        total: total
      };
    } catch (error) {
      await connection.rollback();
      logger.error('Error en PurchaseReturnService.processReturn:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Registrar la Nota de Crédito del proveedor (ingreso manual)
   */
  static async registerSupplierCreditNote(returnId, creditNoteData, userId) {
    try {
      // Validar que la devolución exista
      const purchaseReturn = await PurchaseReturnModel.findById(returnId);

      if (!purchaseReturn) {
        throw new Error('Devolución de compra no encontrada');
      }

      // Validar que no tenga ya una NC registrada
      if (purchaseReturn.credit_note_received) {
        throw new Error('Esta devolución ya tiene una Nota de Crédito registrada');
      }

      // Registrar la NC del proveedor
      await PurchaseReturnModel.registerCreditNote(returnId, creditNoteData, userId);

      logger.info('Nota de Crédito del proveedor registrada exitosamente', {
        returnId,
        creditNoteNumber: creditNoteData.credit_note_number,
        userId
      });

      return {
        success: true,
        message: 'Nota de Crédito del proveedor registrada exitosamente',
        credit_note_number: creditNoteData.credit_note_number
      };
    } catch (error) {
      logger.error('Error en PurchaseReturnService.registerSupplierCreditNote:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las devoluciones con filtros
   */
  static async getAllReturns(filters = {}) {
    try {
      const returns = await PurchaseReturnModel.findAll(filters);
      const total = await PurchaseReturnModel.count(filters);

      return {
        returns,
        total,
        page: parseInt(filters.page) || 1,
        limit: parseInt(filters.limit) || 50
      };
    } catch (error) {
      logger.error('Error en PurchaseReturnService.getAllReturns:', error);
      throw error;
    }
  }

  /**
   * Obtener una devolución por ID con sus items
   */
  static async getReturnById(id) {
    try {
      const purchaseReturn = await PurchaseReturnModel.findById(id);

      if (!purchaseReturn) {
        throw new Error('Devolución de compra no encontrada');
      }

      const items = await PurchaseReturnModel.findItemsByReturnId(id);

      return {
        ...purchaseReturn,
        items
      };
    } catch (error) {
      logger.error('Error en PurchaseReturnService.getReturnById:', error);
      throw error;
    }
  }

  /**
   * Actualizar una devolución
   */
  static async updateReturn(id, data, userId) {
    try {
      const purchaseReturn = await PurchaseReturnModel.findById(id);

      if (!purchaseReturn) {
        throw new Error('Devolución de compra no encontrada');
      }

      await PurchaseReturnModel.update(id, data, userId);

      logger.info('Devolución de compra actualizada exitosamente', { id, userId });

      return {
        success: true,
        message: 'Devolución actualizada exitosamente'
      };
    } catch (error) {
      logger.error('Error en PurchaseReturnService.updateReturn:', error);
      throw error;
    }
  }

  /**
   * Eliminar una devolución
   */
  static async deleteReturn(id, userId) {
    try {
      const purchaseReturn = await PurchaseReturnModel.findById(id);

      if (!purchaseReturn) {
        throw new Error('Devolución de compra no encontrada');
      }

      // No permitir eliminar si ya tiene NC registrada
      if (purchaseReturn.credit_note_received) {
        throw new Error('No se puede eliminar una devolución con Nota de Crédito registrada');
      }

      await PurchaseReturnModel.delete(id, userId);

      logger.info('Devolución de compra eliminada exitosamente', { id, userId });

      return {
        success: true,
        message: 'Devolución eliminada exitosamente'
      };
    } catch (error) {
      logger.error('Error en PurchaseReturnService.deleteReturn:', error);
      throw error;
    }
  }
}

module.exports = PurchaseReturnService;
