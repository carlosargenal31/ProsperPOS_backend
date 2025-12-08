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
      // Filtrar por estado (por defecto solo mostrar activas)
      const status = req.query.status || 'active';

      let sql = `
        SELECT
          q.*,
          u.first_name, u.last_name
        FROM quotes q
        LEFT JOIN users u ON q.created_by = u.id
        WHERE q.deleted_at IS NULL
      `;

      // Si status es 'active', solo mostrar cotizaciones que no han sido procesadas
      if (status === 'active') {
        sql += ` AND (q.status IS NULL OR q.status = 'active' OR q.status = 'pending')`;
      } else if (status === 'all') {
        // Mostrar todas las cotizaciones
        // No agregar filtro adicional
      } else {
        // Filtrar por estado específico
        sql += ` AND q.status = ?`;
      }

      sql += ` ORDER BY q.created_at DESC`;

      const params = (status !== 'active' && status !== 'all') ? [status] : [];
      const quotes = await db.query(sql, params);

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
        terms_conditions,
        status,
        converted_to_type,
        converted_to_id,
        converted_to_number,
        original_consecutive,
        converted_at
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

      // Determinar si es actualización de estado (tracking) o actualización completa
      const isStatusUpdate = status !== undefined;

      let updateSql, params;

      if (isStatusUpdate) {
        // Solo actualizar campos de tracking
        updateSql = `
          UPDATE quotes SET
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
        // Actualizar cotización completa
        updateSql = `
          UPDATE quotes SET
            customer_id = ?, customer_name = ?, customer_rtn = ?, customer_phone = ?,
            customer_email = ?, branch_id = ?, warehouse_id = ?, seller_id = ?, seller_name = ?,
            subtotal = ?, discount = ?, tax = ?, total = ?, surcharge = ?, quote_date = ?, valid_until = ?,
            notes = ?, terms_conditions = ?, updated_at = NOW()
          WHERE id = ?
        `;

        params = [
          customer_id, customer_name, customer_rtn, customer_phone,
          customer_email, branch_id, warehouse_id, seller_id, seller_name,
          subtotal, discount, tax, total, surcharge || 0, quote_date, valid_until,
          notes, terms_conditions, id
        ];
      }

      await db.query(updateSql, params);

      // Solo actualizar items si NO es una actualización de estado
      if (!isStatusUpdate && items && items.length > 0) {
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
      }

      const updateType = isStatusUpdate ? 'estado' : 'datos';
      logger.info(`Cotización actualizada (${updateType})`, { id, userId, status });

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
