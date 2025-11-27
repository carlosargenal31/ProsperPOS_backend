// ===================================================================
// PROSPERPOS - CONTROLADOR DE COTIZACIONES
// ===================================================================

const logger = require('../utils/logger');
const db = require('../utils/database');

class QuotesController {
  /**
   * Crear una cotización
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
        quote_date,
        valid_until,
        notes,
        terms_conditions
      } = req.body;

      const userId = req.user.id;

      // Generar número de cotización
      const countSql = 'SELECT COUNT(*) as total FROM quotes';
      const countResult = await db.query(countSql);
      const quoteCount = countResult[0].total + 1;
      const quoteNumber = `COTIZACION ${String(quoteCount).padStart(10, '0')}`;

      // Insertar cotización
      const insertSql = `
        INSERT INTO quotes (
          quote_number, customer_id, customer_name, customer_rtn, customer_phone,
          customer_email, branch_id, warehouse_id, seller_id, seller_name,
          subtotal, discount, tax, total, surcharge, quote_date, valid_until,
          notes, terms_conditions, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await db.query(insertSql, [
        quoteNumber, customer_id, customer_name, customer_rtn, customer_phone,
        customer_email, branch_id, warehouse_id, seller_id, seller_name,
        subtotal, discount, tax, total, surcharge || 0, quote_date, valid_until,
        notes, terms_conditions, userId
      ]);

      const quoteId = result.insertId;

      // Insertar items
      for (const item of items) {
        const itemSql = `
          INSERT INTO quote_items (
            quote_id, product_id, product_code, product_name,
            quantity, unit_price, discount_value, tax_rate, warehouse_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(itemSql, [
          quoteId,
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

      logger.info('Cotización creada', { quoteId, quoteNumber, userId });

      res.json({
        success: true,
        message: 'Cotización guardada exitosamente',
        data: {
          id: quoteId,
          quote_number: quoteNumber
        }
      });
    } catch (error) {
      logger.error('Error in QuotesController.create:', error);
      res.status(500).json({
        success: false,
        message: 'Error al guardar la cotización',
        error: error.message
      });
    }
  }

  /**
   * Obtener todas las cotizaciones
   */
  static async getAll(req, res) {
    try {
      const sql = `
        SELECT
          q.*,
          u.first_name, u.last_name
        FROM quotes q
        LEFT JOIN users u ON q.created_by = u.id
        WHERE q.deleted_at IS NULL
        ORDER BY q.created_at DESC
      `;

      const quotes = await db.query(sql);

      res.json({
        success: true,
        data: quotes
      });
    } catch (error) {
      logger.error('Error in QuotesController.getAll:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las cotizaciones',
        error: error.message
      });
    }
  }

  /**
   * Obtener una cotización por ID
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const sql = 'SELECT * FROM quotes WHERE id = ? AND deleted_at IS NULL';
      const results = await db.query(sql, [id]);

      if (!results || results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Cotización no encontrada'
        });
      }

      const quote = results[0];

      // Obtener items con códigos de producto
      const itemsSql = `
        SELECT
          qi.*,
          p.code as product_code
        FROM quote_items qi
        LEFT JOIN products p ON qi.product_id = p.id
        WHERE qi.quote_id = ?
      `;

      const items = await db.query(itemsSql, [id]);
      quote.items = items || [];

      res.json({
        success: true,
        data: quote
      });
    } catch (error) {
      logger.error('Error in QuotesController.getById:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la cotización',
        error: error.message
      });
    }
  }

  /**
   * Actualizar una cotización existente
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
        quote_date,
        valid_until,
        notes,
        terms_conditions
      } = req.body;

      const userId = req.user.id;

      // Verificar que existe
      const checkSql = 'SELECT id FROM quotes WHERE id = ? AND deleted_at IS NULL';
      const existing = await db.query(checkSql, [id]);

      if (!existing || existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Cotización no encontrada'
        });
      }

      // Actualizar cotización
      const updateSql = `
        UPDATE quotes SET
          customer_id = ?, customer_name = ?, customer_rtn = ?, customer_phone = ?,
          customer_email = ?, branch_id = ?, warehouse_id = ?, seller_id = ?, seller_name = ?,
          subtotal = ?, discount = ?, tax = ?, total = ?, surcharge = ?, quote_date = ?, valid_until = ?,
          notes = ?, terms_conditions = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await db.query(updateSql, [
        customer_id, customer_name, customer_rtn, customer_phone,
        customer_email, branch_id, warehouse_id, seller_id, seller_name,
        subtotal, discount, tax, total, surcharge || 0, quote_date, valid_until,
        notes, terms_conditions, id
      ]);

      // Eliminar items anteriores
      const deleteItemsSql = 'DELETE FROM quote_items WHERE quote_id = ?';
      await db.query(deleteItemsSql, [id]);

      // Insertar nuevos items
      for (const item of items) {
        const itemSql = `
          INSERT INTO quote_items (
            quote_id, product_id, product_code, product_name,
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

      logger.info('Cotización actualizada', { id, userId });

      res.json({
        success: true,
        message: 'Cotización actualizada exitosamente',
        data: { id }
      });
    } catch (error) {
      logger.error('Error in QuotesController.update:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar la cotización',
        error: error.message
      });
    }
  }

  /**
   * Actualizar estado de cotización
   */
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, converted_to_invoice_id } = req.body;

      const sql = `
        UPDATE quotes
        SET status = ?, converted_to_invoice_id = ?
        WHERE id = ?
      `;

      await db.query(sql, [status, converted_to_invoice_id || null, id]);

      logger.info('Estado de cotización actualizado', { id, status });

      res.json({
        success: true,
        message: 'Estado actualizado exitosamente'
      });
    } catch (error) {
      logger.error('Error in QuotesController.updateStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar el estado',
        error: error.message
      });
    }
  }

  /**
   * Eliminar (soft delete) una cotización
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const sql = 'UPDATE quotes SET deleted_at = NOW() WHERE id = ?';
      await db.query(sql, [id]);

      logger.info('Cotización eliminada', { id });

      res.json({
        success: true,
        message: 'Cotización eliminada exitosamente'
      });
    } catch (error) {
      logger.error('Error in QuotesController.delete:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar la cotización',
        error: error.message
      });
    }
  }
}

module.exports = QuotesController;
