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
        expires_at,
        orden_compra,
        constancia_exonerado,
        registro_sag
      } = req.body;

      const userId = req.user.id;

      // Generar número de documento (usar el ID que se va a generar)
      const maxIdSql = 'SELECT COALESCE(MAX(id), 0) as max_id FROM pending_invoices';
      const maxIdResult = await db.query(maxIdSql);
      const nextId = maxIdResult[0].max_id + 1;
      const documentNumber = String(nextId).padStart(10, '0');

      // Insertar factura en espera
      const insertSql = `
        INSERT INTO pending_invoices (
          document_number, customer_id, customer_name, customer_rtn, customer_phone,
          customer_email, branch_id, warehouse_id, seller_id, seller_name,
          subtotal, discount, tax, total, surcharge, notes, internal_notes, expires_at,
          orden_compra, constancia_exonerado, registro_sag, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await db.query(insertSql, [
        documentNumber, customer_id, customer_name, customer_rtn, customer_phone,
        customer_email, branch_id, warehouse_id, seller_id, seller_name,
        subtotal, discount, tax, total, surcharge || 0, notes, internal_notes, expires_at,
        orden_compra || null, constancia_exonerado || null, registro_sag || null, userId
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
      // Filtrar por estado (por defecto solo mostrar pendientes)
      const status = req.query.status || 'pending';

      let sql = `
        SELECT
          pi.*,
          u.first_name, u.last_name
        FROM pending_invoices pi
        LEFT JOIN users u ON pi.created_by = u.id
        WHERE pi.deleted_at IS NULL
      `;

      // Si status es 'pending', solo mostrar facturas en espera que no han sido procesadas
      if (status === 'pending') {
        sql += ` AND (pi.status IS NULL OR pi.status = 'pending')`;
      } else if (status === 'all') {
        // Mostrar todas las facturas en espera
        // No agregar filtro adicional
      } else {
        // Filtrar por estado específico
        sql += ` AND pi.status = ?`;
      }

      sql += ` ORDER BY pi.created_at DESC`;

      const params = (status !== 'pending' && status !== 'all') ? [status] : [];
      const pendingInvoices = await db.query(sql, params);

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
        expires_at,
        status,
        converted_to_type,
        converted_to_id,
        converted_to_number,
        original_consecutive,
        converted_at
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

      // Determinar si es actualización de estado (tracking) o actualización completa
      const isStatusUpdate = status !== undefined;

      let updateSql, params;

      if (isStatusUpdate) {
        // Solo actualizar campos de tracking
        updateSql = `
          UPDATE pending_invoices SET
            status = ?,
            converted_to_type = ?,
            converted_to_id = ?,
            converted_to_number = ?,
            original_consecutive = ?,
            converted_at = ?,
            updated_at = NOW()
          WHERE id = ?
        `;

        // Convertir fecha ISO a formato MySQL si existe
        let convertedAtMysql = null;
        if (converted_at) {
          const date = new Date(converted_at);
          convertedAtMysql = date.toISOString().slice(0, 19).replace('T', ' ');
        }

        params = [
          status || null,
          converted_to_type || null,
          converted_to_id || null,
          converted_to_number || null,
          original_consecutive || null,
          convertedAtMysql,
          id
        ];
      } else {
        // Actualizar factura en espera completa (datos del cliente, items, etc.)
        updateSql = `
          UPDATE pending_invoices SET
            customer_id = ?, customer_name = ?, customer_rtn = ?, customer_phone = ?,
            customer_email = ?, branch_id = ?, warehouse_id = ?, seller_id = ?, seller_name = ?,
            subtotal = ?, discount = ?, tax = ?, total = ?, surcharge = ?, notes = ?, internal_notes = ?,
            expires_at = ?, updated_at = NOW()
          WHERE id = ?
        `;

        params = [
          customer_id, customer_name, customer_rtn, customer_phone,
          customer_email, branch_id, warehouse_id, seller_id, seller_name,
          subtotal, discount, tax, total, surcharge || 0, notes, internal_notes, expires_at, id
        ];
      }

      await db.query(updateSql, params);

      // Solo actualizar items si NO es una actualización de estado
      if (!isStatusUpdate && items && items.length > 0) {
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
      }

      const updateType = isStatusUpdate ? 'estado' : 'datos';
      logger.info(`Factura en espera actualizada (${updateType})`, { id, userId, status });

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
