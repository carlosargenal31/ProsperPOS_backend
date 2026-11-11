// ===================================================================
// PROSPERPOS - MODELO DE PEDIDOS WEB (E-COMMERCE)
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class WebOrder {

  /**
   * Generar número de pedido único
   */
  static async generateOrderNumber() {
    try {
      const [settings] = await db.execute(
        'SELECT setting_value FROM ecommerce_settings WHERE setting_key = "order_prefix"'
      );

      const prefix = settings[0]?.setting_value || 'WEB';
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

      return `${prefix}-${timestamp}-${random}`;

    } catch (error) {
      logger.error('Error generating order number:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo pedido
   */
  static async create(orderData) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const {
        customer_id,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_country,
        shipping_postal_code,
        items,
        customer_notes,
        payment_method = 'whatsapp'
      } = orderData;

      // Generar número de pedido
      const order_number = await this.generateOrderNumber();

      // Calcular totales
      let subtotal = 0;
      let tax_amount = 0;
      let total = 0;

      for (const item of items) {
        const itemSubtotal = item.quantity * item.unit_price;
        const itemTax = itemSubtotal * (item.tax_rate / 100);

        subtotal += itemSubtotal;
        tax_amount += itemTax;
      }

      total = subtotal + tax_amount;

      // Insertar pedido
      const orderQuery = `
        INSERT INTO web_orders (
          order_number, customer_id, customer_name, customer_email,
          customer_phone, shipping_address, shipping_city, shipping_state,
          shipping_country, shipping_postal_code, subtotal, tax_amount,
          total, status, payment_method, payment_status, customer_notes,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 'pending', ?, NOW())
      `;

      const [orderResult] = await connection.execute(orderQuery, [
        order_number, customer_id, customer_name, customer_email,
        customer_phone, shipping_address, shipping_city, shipping_state,
        shipping_country, shipping_postal_code, subtotal, tax_amount,
        total, payment_method, customer_notes
      ]);

      const orderId = orderResult.insertId;

      // Insertar items del pedido
      for (const item of items) {
        const itemSubtotal = item.quantity * item.unit_price;
        const itemTax = itemSubtotal * (item.tax_rate / 100);
        const itemTotal = itemSubtotal + itemTax;

        const itemQuery = `
          INSERT INTO web_order_items (
            order_id, product_id, product_name, product_code,
            product_image, quantity, unit_price, tax_rate,
            tax_amount, subtotal, total, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        await connection.execute(itemQuery, [
          orderId, item.product_id, item.product_name, item.product_code,
          item.product_image, item.quantity, item.unit_price, item.tax_rate,
          itemTax, itemSubtotal, itemTotal
        ]);
      }

      // Insertar historial de estado
      await connection.execute(
        `INSERT INTO web_order_status_history (order_id, status, notes, created_at)
         VALUES (?, 'pending', 'Pedido creado', NOW())`,
        [orderId]
      );

      // Limpiar carrito del cliente
      await connection.execute(
        'DELETE FROM shopping_cart WHERE customer_id = ?',
        [customer_id]
      );

      await connection.commit();

      return {
        id: orderId,
        order_number,
        total,
        message: 'Pedido creado exitosamente'
      };

    } catch (error) {
      await connection.rollback();
      logger.error('Error creating web order:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener pedido por ID con items
   */
  static async getById(orderId) {
    try {
      // Obtener pedido
      const orderQuery = `
        SELECT * FROM web_orders
        WHERE id = ?
      `;

      const [orders] = await db.execute(orderQuery, [orderId]);

      if (orders.length === 0) {
        return null;
      }

      const order = orders[0];

      // Obtener items
      const itemsQuery = `
        SELECT * FROM web_order_items
        WHERE order_id = ?
        ORDER BY id ASC
      `;

      const [items] = await db.execute(itemsQuery, [orderId]);
      order.items = items;

      // Obtener historial
      const historyQuery = `
        SELECT
          wosh.*,
          u.username as changed_by_name
        FROM web_order_status_history wosh
        LEFT JOIN users u ON wosh.changed_by = u.id
        WHERE wosh.order_id = ?
        ORDER BY wosh.created_at DESC
      `;

      const [history] = await db.execute(historyQuery, [orderId]);
      order.status_history = history;

      return order;

    } catch (error) {
      logger.error('Error getting order by ID:', error);
      throw error;
    }
  }

  /**
   * Obtener pedido por número
   */
  static async getByOrderNumber(orderNumber) {
    try {
      const [orders] = await db.execute(
        'SELECT id FROM web_orders WHERE order_number = ?',
        [orderNumber]
      );

      if (orders.length === 0) {
        return null;
      }

      return this.getById(orders[0].id);

    } catch (error) {
      logger.error('Error getting order by number:', error);
      throw error;
    }
  }

  /**
   * Actualizar estado del pedido
   */
  static async updateStatus(orderId, status, notes = null, changedBy = null) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Actualizar estado
      await connection.execute(
        'UPDATE web_orders SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, orderId]
      );

      // Insertar en historial
      await connection.execute(
        `INSERT INTO web_order_status_history (order_id, status, notes, changed_by, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [orderId, status, notes, changedBy]
      );

      await connection.commit();

      return { message: 'Estado actualizado exitosamente' };

    } catch (error) {
      await connection.rollback();
      logger.error('Error updating order status:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Marcar como enviado por WhatsApp
   */
  static async markWhatsAppSent(orderId, messageId = null) {
    try {
      await db.execute(
        `UPDATE web_orders SET
         whatsapp_sent = TRUE,
         whatsapp_sent_at = NOW(),
         whatsapp_message_id = ?
         WHERE id = ?`,
        [messageId, orderId]
      );

      return { message: 'Pedido marcado como enviado por WhatsApp' };

    } catch (error) {
      logger.error('Error marking order as WhatsApp sent:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los pedidos con filtros
   */
  static async getAll(filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status = null,
        customer_id = null,
        date_from = null,
        date_to = null
      } = filters;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      }

      if (customer_id) {
        whereClause += ' AND customer_id = ?';
        params.push(customer_id);
      }

      if (date_from) {
        whereClause += ' AND DATE(created_at) >= ?';
        params.push(date_from);
      }

      if (date_to) {
        whereClause += ' AND DATE(created_at) <= ?';
        params.push(date_to);
      }

      const query = `
        SELECT
          wo.*,
          wc.first_name as customer_first_name,
          wc.last_name as customer_last_name,
          (SELECT COUNT(*) FROM web_order_items WHERE order_id = wo.id) as items_count
        FROM web_orders wo
        LEFT JOIN web_customers wc ON wo.customer_id = wc.id
        ${whereClause}
        ORDER BY wo.created_at DESC
        LIMIT ? OFFSET ?
      `;

      params.push(parseInt(limit), offset);
      const [orders] = await db.execute(query, params);

      // Contar total
      const countQuery = `SELECT COUNT(*) as total FROM web_orders wo ${whereClause}`;
      const [countResult] = await db.execute(countQuery, params.slice(0, -2));

      return {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      };

    } catch (error) {
      logger.error('Error getting all orders:', error);
      throw error;
    }
  }

  /**
   * Cancelar pedido
   */
  static async cancel(orderId, reason, cancelledBy = null) {
    try {
      await db.execute(
        `UPDATE web_orders SET
         status = 'cancelled',
         cancelled_at = NOW(),
         cancelled_by = ?,
         cancelled_reason = ?,
         updated_at = NOW()
         WHERE id = ?`,
        [cancelledBy, reason, orderId]
      );

      // Insertar en historial
      await db.execute(
        `INSERT INTO web_order_status_history (order_id, status, notes, changed_by, created_at)
         VALUES (?, 'cancelled', ?, ?, NOW())`,
        [orderId, reason, cancelledBy]
      );

      return { message: 'Pedido cancelado exitosamente' };

    } catch (error) {
      logger.error('Error cancelling order:', error);
      throw error;
    }
  }
}

module.exports = WebOrder;
