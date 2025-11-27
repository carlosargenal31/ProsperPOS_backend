// ===================================================================
// PROSPERPOS - CONTROLADOR DE FACTURAS EN ESPERA
// ===================================================================

const logger = require('../utils/logger');
const db = require('../utils/database');

class PendingInvoicesController {
  /**
   * Crear una factura en espera
   */
  static async create(req, res) {
    try {
      const {
        customer_id,
        customer_name,
        customer_rtn,
        customer_phone,
        customer_email,
        branch_id,
        warehouse_id,
        seller_id,
        seller_name,
        items,
        subtotal,
        discount,
        tax,
        total,
        surcharge,
        notes,
        internal_notes,
        expires_at
      } = req.body;

      const userId = req.user.id;

      // Generar número de documento
      const countSql = 'SELECT COUNT(*) as total FROM pending_invoices';
      const countResult = await db.query(countSql);
      const docCount = countResult[0].total + 1;
      const documentNumber = `FACT EN ESPERA ${String(docCount).padStart(10, '0')}`;

      // Insertar factura en espera
      const insertSql = `
        INSERT INTO pending_invoices (
          document_number, customer_id, customer_name, customer_rtn, customer_phone,
          customer_email, branch_id, warehouse_id, seller_id, seller_name,
          subtotal, discount, tax, total, surcharge, notes, internal_notes, expires_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await db.query(insertSql, [
        documentNumber, customer_id, customer_name, customer_rtn, customer_phone,
        customer_email, branch_id, warehouse_id, seller_id, seller_name,
        subtotal, discount, tax, total, surcharge || 0, notes, internal_notes, expires_at, userId
      ]);

      const pendingInvoiceId = result.insertId;

      // Insertar items
      for (const item of items) {
        const itemSql = `
          INSERT INTO pending_invoice_items (
            pending_invoice_id, product_id, product_code, product_name,
            quantity, unit_price, discount_value, tax_rate, warehouse_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(itemSql, [
          pendingInvoiceId,
          item.product_id,
          item.product_code,
          item.product_name,
          item.quantity,
          item.unit_price,
          item.discount_value || 0,
          item.tax_rate || 0,
          item.warehouse_id
        ]);
      }

      logger.info('Factura en espera creada', { pendingInvoiceId, documentNumber, userId });

      res.json({
        success: true,
        message: 'Factura en espera guardada exitosamente',
        data: {
          id: pendingInvoiceId,
          document_number: documentNumber
        }
      });
    } catch (error) {
      logger.error('Error in PendingInvoicesController.create:', error);
      res.status(500).json({
        success: false,
        message: 'Error al guardar la factura en espera',
        error: error.message
      });
    }
  }

  /**
   * Obtener todas las facturas en espera
   */
  static async getAll(req, res) {
    try {
      const sql = `
        SELECT
          pi.*,
          u.first_name, u.last_name
        FROM pending_invoices pi
        LEFT JOIN users u ON pi.created_by = u.id
        WHERE pi.deleted_at IS NULL
        ORDER BY pi.created_at DESC
      `;

      const pendingInvoices = await db.query(sql);

      res.json({
        success: true,
        data: pendingInvoices
      });
    } catch (error) {
      logger.error('Error in PendingInvoicesController.getAll:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las facturas en espera',
        error: error.message
      });
    }
  }

  /**
   * Obtener una factura en espera por ID
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const sql = 'SELECT * FROM pending_invoices WHERE id = ? AND deleted_at IS NULL';
      const results = await db.query(sql, [id]);

      if (!results || results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Factura en espera no encontrada'
        });
      }

      const pendingInvoice = results[0];

      // Obtener items con códigos de producto
      const itemsSql = `
        SELECT
          pii.*,
          p.code as product_code
        FROM pending_invoice_items pii
        LEFT JOIN products p ON pii.product_id = p.id
        WHERE pii.pending_invoice_id = ?
      `;

      const items = await db.query(itemsSql, [id]);
      pendingInvoice.items = items || [];

      res.json({
        success: true,
        data: pendingInvoice
      });
    } catch (error) {
      logger.error('Error in PendingInvoicesController.getById:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la factura en espera',
        error: error.message
      });
    }
  }

  /**
   * Actualizar una factura en espera existente
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const {
        customer_id,
        customer_name,
        customer_rtn,
        customer_phone,
        customer_email,
        branch_id,
        warehouse_id,
        seller_id,
        seller_name,
        items,
        subtotal,
        discount,
        tax,
        total,
        surcharge,
        notes,
        internal_notes,
        expires_at
      } = req.body;

      const userId = req.user.id;

      // Verificar que existe
      const checkSql = 'SELECT id FROM pending_invoices WHERE id = ? AND deleted_at IS NULL';
      const existing = await db.query(checkSql, [id]);

      if (!existing || existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Factura en espera no encontrada'
        });
      }

      // Actualizar factura en espera
      const updateSql = `
        UPDATE pending_invoices SET
          customer_id = ?, customer_name = ?, customer_rtn = ?, customer_phone = ?,
          customer_email = ?, branch_id = ?, warehouse_id = ?, seller_id = ?, seller_name = ?,
          subtotal = ?, discount = ?, tax = ?, total = ?, surcharge = ?, notes = ?, internal_notes = ?,
          expires_at = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await db.query(updateSql, [
        customer_id, customer_name, customer_rtn, customer_phone,
        customer_email, branch_id, warehouse_id, seller_id, seller_name,
        subtotal, discount, tax, total, surcharge || 0, notes, internal_notes, expires_at, id
      ]);

      // Eliminar items anteriores
      const deleteItemsSql = 'DELETE FROM pending_invoice_items WHERE pending_invoice_id = ?';
      await db.query(deleteItemsSql, [id]);

      // Insertar nuevos items
      for (const item of items) {
        const itemSql = `
          INSERT INTO pending_invoice_items (
            pending_invoice_id, product_id, product_code, product_name,
            quantity, unit_price, discount_value, tax_rate, warehouse_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(itemSql, [
          id,
          item.product_id,
          item.product_code,
          item.product_name,
          item.quantity,
          item.unit_price,
          item.discount_value || 0,
          item.tax_rate || 0,
          item.warehouse_id
        ]);
      }

      logger.info('Factura en espera actualizada', { id, userId });

      res.json({
        success: true,
        message: 'Factura en espera actualizada exitosamente',
        data: { id }
      });
    } catch (error) {
      logger.error('Error in PendingInvoicesController.update:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar la factura en espera',
        error: error.message
      });
    }
  }

  /**
   * Eliminar (soft delete) una factura en espera
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const sql = 'UPDATE pending_invoices SET deleted_at = NOW() WHERE id = ?';
      await db.query(sql, [id]);

      logger.info('Factura en espera eliminada', { id });

      res.json({
        success: true,
        message: 'Factura en espera eliminada exitosamente'
      });
    } catch (error) {
      logger.error('Error in PendingInvoicesController.delete:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar la factura en espera',
        error: error.message
      });
    }
  }
}

module.exports = PendingInvoicesController;
