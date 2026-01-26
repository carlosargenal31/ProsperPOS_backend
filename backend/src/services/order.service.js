// ===================================================================
// PROSPERPOS - SERVICIO DE PEDIDOS EN LÍNEA
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');
const EmailService = require('./email.service');

class OrderService {

  // =================================================================
  // CREAR PEDIDO
  // =================================================================
  static async createOrder(orderData) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Generar número de pedido único
      const orderNumber = await this.generateOrderNumber(connection);

      // Insertar el pedido
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (
          order_number, customer_id, customer_name, customer_email,
          customer_phone, receiver_name, receiver_phone, customer_dni,
          delivery_address, department, city,
          invoice_type, rtn, business_name, payment_method,
          total_amount, coupon_code, coupon_name, coupon_discount,
          offers_discount, subtotal_before_discount, subtotal_after_discount,
          tax_amount, status, notes, additional_comments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderNumber,
          orderData.customer_id || null,
          orderData.customer_name || 'Cliente',
          orderData.customer_email || null,
          orderData.customer_phone || null,
          orderData.receiver_name || null,
          orderData.receiver_phone || null,
          orderData.customer_dni || null,
          orderData.delivery_address || null,
          orderData.department || null,
          orderData.city || null,
          orderData.invoice_type || 'Consumidor Final',
          orderData.rtn || null,
          orderData.business_name || null,
          orderData.payment_method || 'Efectivo',
          orderData.total_amount || 0,
          orderData.coupon_code || null,
          orderData.coupon_name || null,
          orderData.coupon_discount || 0,
          orderData.offers_discount || 0,
          orderData.subtotal_before_discount || 0,
          orderData.subtotal_after_discount || 0,
          orderData.tax_amount || 0,
          'pendiente',
          orderData.notes || null,
          orderData.additional_comments || null
        ]
      );

      const orderId = orderResult.insertId;

      // Insertar los items del pedido
      if (orderData.items && orderData.items.length > 0) {
        for (const item of orderData.items) {
          await connection.execute(
            `INSERT INTO order_items (
              order_id, product_id, product_name, product_code,
              quantity, unit_price, subtotal
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              orderId,
              item.product_id || null,
              item.product_name || 'Producto sin nombre',
              item.product_code || null,
              item.quantity || 1,
              item.unit_price || 0,
              item.subtotal || 0
            ]
          );
        }
      }

      await connection.commit();

      logger.info(`Pedido creado exitosamente: ${orderNumber}`);

      // Enviar notificación por email al administrador (no bloquear si falla)
      try {
        const fullOrder = await this.getOrderById(orderId);
        await EmailService.sendNewOrderNotification(fullOrder);
      } catch (emailError) {
        logger.error('Error enviando email de notificación:', emailError);
        // No lanzar el error, el pedido ya fue creado
      }

      return {
        success: true,
        order_id: orderId,
        order_number: orderNumber
      };

    } catch (error) {
      await connection.rollback();
      logger.error('Error al crear pedido:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // =================================================================
  // GENERAR NÚMERO DE PEDIDO
  // =================================================================
  static async generateOrderNumber(connection) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const prefix = `PED-${year}${month}${day}`;

    // Buscar el último número del día
    const [rows] = await connection.execute(
      `SELECT order_number FROM orders
       WHERE order_number LIKE ?
       ORDER BY id DESC LIMIT 1`,
      [`${prefix}%`]
    );

    let nextNumber = 1;
    if (rows.length > 0) {
      const lastNumber = rows[0].order_number.split('-').pop();
      nextNumber = parseInt(lastNumber) + 1;
    }

    return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
  }

  // =================================================================
  // OBTENER TODOS LOS PEDIDOS
  // =================================================================
  static async getAllOrders(filters = {}) {
    try {
      let sql = `
        SELECT
          o.*,
          COUNT(oi.id) as items_count,
          CONCAT(ec.first_name, ' ', ec.last_name) as customer_full_name,
          ec.email as customer_registered_email
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN ecommerce_customers ec ON o.customer_id = ec.id
        WHERE 1=1
      `;

      const params = [];

      // Filtrar por estado
      if (filters.status) {
        sql += ' AND o.status = ?';
        params.push(filters.status);
      }

      // Filtrar por rango de fechas
      if (filters.start_date) {
        sql += ' AND DATE(o.created_at) >= ?';
        params.push(filters.start_date);
      }

      if (filters.end_date) {
        sql += ' AND DATE(o.created_at) <= ?';
        params.push(filters.end_date);
      }

      // Buscar por nombre o email
      if (filters.search) {
        sql += ' AND (o.customer_name LIKE ? OR o.customer_email LIKE ? OR o.order_number LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      sql += ' GROUP BY o.id ORDER BY o.created_at DESC';

      // Paginación
      if (filters.limit) {
        sql += ' LIMIT ?';
        params.push(parseInt(filters.limit));

        if (filters.offset) {
          sql += ' OFFSET ?';
          params.push(parseInt(filters.offset));
        }
      }

      const orders = await db.query(sql, params);

      return orders;

    } catch (error) {
      logger.error('Error al obtener pedidos:', error);
      throw error;
    }
  }

  // =================================================================
  // OBTENER PEDIDO POR ID
  // =================================================================
  static async getOrderById(orderId) {
    try {
      // Obtener el pedido
      const orders = await db.query(
        `SELECT
          o.*,
          CONCAT(ec.first_name, ' ', ec.last_name) as customer_full_name,
          ec.email as customer_registered_email,
          ec.phone as customer_registered_phone
        FROM orders o
        LEFT JOIN ecommerce_customers ec ON o.customer_id = ec.id
        WHERE o.id = ?`,
        [orderId]
      );

      if (orders.length === 0) {
        return null;
      }

      const order = orders[0];

      // Obtener los items del pedido
      const items = await db.query(
        `SELECT
          oi.*,
          p.image as product_image,
          COALESCE(u.name, 'UNIDAD') as unit
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN units u ON p.unit_id = u.id
        WHERE oi.order_id = ?`,
        [orderId]
      );

      order.items = items;

      return order;

    } catch (error) {
      logger.error('Error al obtener pedido por ID:', error);
      throw error;
    }
  }

  // =================================================================
  // OBTENER PEDIDOS POR CLIENTE
  // =================================================================
  static async getOrdersByCustomerId(customerId) {
    try {
      const orders = await db.query(
        `SELECT
          o.*,
          COUNT(oi.id) as items_count
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.customer_id = ?
        GROUP BY o.id
        ORDER BY o.created_at DESC`,
        [customerId]
      );

      // Obtener items para cada pedido
      for (const order of orders) {
        const items = await db.query(
          `SELECT
            oi.*,
            p.image as product_image,
            COALESCE(u.name, 'UNIDAD') as unit
          FROM order_items oi
          LEFT JOIN products p ON oi.product_id = p.id
          LEFT JOIN units u ON p.unit_id = u.id
          WHERE oi.order_id = ?`,
          [order.id]
        );
        order.items = items;
      }

      return orders;

    } catch (error) {
      logger.error('Error al obtener pedidos por cliente:', error);
      throw error;
    }
  }

  // =================================================================
  // ACTUALIZAR ESTADO DEL PEDIDO
  // =================================================================
  static async updateOrderStatus(orderId, newStatus, processNotes = null, userId = null) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const validStatuses = ['pendiente', 'cotizado', 'cobrado', 'cancelado'];

      if (!validStatuses.includes(newStatus)) {
        throw new Error('Estado de pedido inválido');
      }

      // Obtener el estado actual del pedido
      const [currentOrder] = await connection.execute(
        'SELECT status FROM orders WHERE id = ?',
        [orderId]
      );

      if (!currentOrder || currentOrder.length === 0) {
        throw new Error('Pedido no encontrado');
      }

      const previousStatus = currentOrder[0].status;

      // Actualizar el estado del pedido
      await connection.execute(
        'UPDATE orders SET status = ? WHERE id = ?',
        [newStatus, orderId]
      );

      // Guardar en el historial de cambios de estado
      if (userId) {
        await connection.execute(
          `INSERT INTO order_status_history
          (order_id, previous_status, new_status, notes, changed_by)
          VALUES (?, ?, ?, ?, ?)`,
          [orderId, previousStatus, newStatus, processNotes, userId]
        );
      }

      await connection.commit();

      logger.info(`Pedido ${orderId} actualizado de ${previousStatus} a ${newStatus}`);

      // Enviar notificación por email al cliente (no bloquear si falla)
      try {
        const order = await this.getOrderById(orderId);
        await EmailService.sendOrderStatusUpdate(order, newStatus, processNotes);
      } catch (emailError) {
        logger.error('Error enviando email de actualización al cliente:', emailError);
        // No lanzar el error, el estado ya fue actualizado
      }

      return {
        success: true,
        order_id: orderId,
        previous_status: previousStatus,
        new_status: newStatus
      };

    } catch (error) {
      await connection.rollback();
      logger.error('Error al actualizar estado del pedido:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // =================================================================
  // OBTENER HISTORIAL DE CAMBIOS DE ESTADO
  // =================================================================
  static async getOrderStatusHistory(orderId) {
    try {
      const history = await db.query(
        `SELECT
          osh.*,
          CONCAT(u.first_name, ' ', u.last_name) as changed_by_name
        FROM order_status_history osh
        LEFT JOIN users u ON osh.changed_by = u.id
        WHERE osh.order_id = ?
        ORDER BY osh.changed_at DESC`,
        [orderId]
      );

      return history;

    } catch (error) {
      logger.error('Error al obtener historial de estados:', error);
      throw error;
    }
  }

  // =================================================================
  // ELIMINAR PEDIDO
  // =================================================================
  static async deleteOrder(orderId) {
    try {
      // Los items se eliminarán automáticamente por CASCADE
      const result = await db.query(
        'DELETE FROM orders WHERE id = ?',
        [orderId]
      );

      if (result.affectedRows === 0) {
        throw new Error('Pedido no encontrado');
      }

      logger.info(`Pedido ${orderId} eliminado`);

      return {
        success: true,
        order_id: orderId
      };

    } catch (error) {
      logger.error('Error al eliminar pedido:', error);
      throw error;
    }
  }

  // =================================================================
  // OBTENER ESTADÍSTICAS DE PEDIDOS
  // =================================================================
  static async getOrderStats() {
    try {
      const stats = await db.query(`
        SELECT
          COUNT(*) as total_orders,
          SUM(CASE WHEN status = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
          SUM(CASE WHEN status = 'cotizado' THEN 1 ELSE 0 END) as cotizados,
          SUM(CASE WHEN status = 'cobrado' THEN 1 ELSE 0 END) as cobrados,
          SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END) as cancelados,
          SUM(CASE WHEN status = 'cobrado' THEN total_amount ELSE 0 END) as total_cobrado
        FROM orders
      `);

      return stats[0];

    } catch (error) {
      logger.error('Error al obtener estadísticas de pedidos:', error);
      throw error;
    }
  }

  // =================================================================
  // ACTUALIZAR NOTAS DEL PEDIDO
  // =================================================================
  static async updateOrderNotes(orderId, notes) {
    try {
      const result = await db.query(
        'UPDATE orders SET notes = ? WHERE id = ?',
        [notes, orderId]
      );

      if (result.affectedRows === 0) {
        throw new Error('Pedido no encontrado');
      }

      return {
        success: true,
        order_id: orderId
      };

    } catch (error) {
      logger.error('Error al actualizar notas del pedido:', error);
      throw error;
    }
  }

  // =================================================================
  // CONVERTIR PEDIDO A FACTURA
  // =================================================================
  static async convertToInvoice(orderId, billingData) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Obtener el pedido completo
      const [orders] = await connection.execute(
        `SELECT o.*, ec.email, ec.phone
         FROM orders o
         LEFT JOIN ecommerce_customers ec ON o.customer_id = ec.id
         WHERE o.id = ?`,
        [orderId]
      );

      if (orders.length === 0) {
        throw new Error('Pedido no encontrado');
      }

      const order = orders[0];

      // Verificar que el pedido esté en estado cobrado
      if (order.status !== 'cobrado') {
        throw new Error('Solo se pueden facturar pedidos cobrados');
      }

      // Obtener items del pedido
      const [items] = await connection.execute(
        `SELECT oi.*, p.id as product_id, p.tax_id
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [orderId]
      );

      // Preparar datos para la factura
      const invoiceData = {
        customer_id: billingData.customer_id || null,
        customer_name: order.customer_name,
        customer_email: order.customer_email || billingData.customer_email,
        customer_phone: order.customer_phone || billingData.customer_phone,
        customer_address: order.delivery_address,
        payment_method: billingData.payment_method || 'cash',
        branch_id: billingData.branch_id || 1,
        user_id: billingData.user_id,
        warehouse_id: billingData.warehouse_id || 1,
        resolution_id: billingData.resolution_id,
        order_id: orderId,
        items: items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_id: item.tax_id || 1
        }))
      };

      // Aquí se integraría con el servicio de facturación
      // Por ahora, guardamos una referencia en el pedido

      await connection.execute(
        `UPDATE orders
         SET notes = CONCAT(IFNULL(notes, ''), '\nFacturado el: ', NOW())
         WHERE id = ?`,
        [orderId]
      );

      await connection.commit();

      logger.info(`Pedido ${orderId} marcado para facturación`);

      return {
        success: true,
        order_id: orderId,
        invoice_data: invoiceData
      };

    } catch (error) {
      await connection.rollback();
      logger.error('Error al convertir pedido a factura:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // =================================================================
  // CANCELAR PEDIDO POR CLIENTE
  // =================================================================
  static async cancelOrderByCustomer(orderId, customerId, cancellationReason) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Verificar que el pedido existe y pertenece al cliente
      const [order] = await connection.execute(
        'SELECT id, status, customer_id FROM orders WHERE id = ?',
        [orderId]
      );

      if (!order || order.length === 0) {
        throw new Error('Pedido no encontrado');
      }

      if (order[0].customer_id !== customerId) {
        throw new Error('No tienes permiso para cancelar este pedido');
      }

      // Solo se pueden cancelar pedidos pendientes
      if (order[0].status !== 'pendiente') {
        throw new Error('Solo se pueden cancelar pedidos en estado pendiente');
      }

      // Actualizar el pedido a cancelado
      await connection.execute(
        `UPDATE orders
         SET status = 'cancelado',
             cancellation_reason = ?,
             cancelled_by = 'cliente',
             cancelled_at = NOW()
         WHERE id = ?`,
        [cancellationReason, orderId]
      );

      // Registrar en el historial de cambios de estado
      await connection.execute(
        `INSERT INTO order_status_history
         (order_id, previous_status, new_status, notes, changed_by)
         VALUES (?, 'pendiente', 'cancelado', ?, ?)`,
        [orderId, `Cancelado por cliente: ${cancellationReason}`, customerId]
      );

      await connection.commit();

      return {
        success: true,
        message: 'Pedido cancelado exitosamente'
      };

    } catch (error) {
      await connection.rollback();
      logger.error('Error al cancelar pedido:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = OrderService;
