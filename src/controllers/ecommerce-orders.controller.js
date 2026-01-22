// ===================================================================
// PROSPERPOS - CONTROLADOR DE PEDIDOS E-COMMERCE
// ===================================================================

const OrderService = require('../services/order.service');
const logger = require('../utils/logger');
const db = require('../utils/database');

class EcommerceOrdersController {

  /**
   * Crear nuevo pedido desde el carrito
   */
  static async createOrder(req, res) {
    try {
      const customerId = req.customer.id;
      const {
        delivery_address,
        department,
        city,
        receiver_name,
        receiver_phone,
        receiver_phone_country,
        customer_phone_country,
        items,
        notes,
        additional_comments,
        customer_dni,
        invoice_type,
        rtn,
        business_name,
        payment_method,
        coupon_code,
        coupon_name,
        coupon_discount,
        offers_discount,
        subtotal_before_discount,
        subtotal_after_discount,
        tax_amount
      } = req.body;

      // Validar dirección de envío
      if (!delivery_address || !city) {
        return res.status(400).json({
          success: false,
          message: 'Dirección y ciudad de envío son requeridas'
        });
      }

      // Validar items
      if (!items || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El pedido debe tener al menos un producto'
        });
      }

      // Obtener datos del cliente
      const customers = await db.query(
        'SELECT * FROM ecommerce_customers WHERE id = ?',
        [customerId]
      );

      if (customers.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      const customer = customers[0];

      // Calcular total (precios base + 15% impuesto)
      let subtotalAmount = 0;
      const orderItems = items.map(item => {
        const subtotal = parseFloat(item.unit_price) * parseFloat(item.quantity);
        subtotalAmount += subtotal;

        return {
          product_id: item.product_id,
          product_name: item.product_name,
          product_code: item.product_code || null,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price),
          subtotal: subtotal
        };
      });

      // Usar descuentos e impuesto del frontend si están presentes, o calcular
      const finalSubtotalBeforeDiscount = subtotal_before_discount || subtotalAmount;
      const finalCouponDiscount = parseFloat(coupon_discount) || 0;
      const finalOffersDiscount = parseFloat(offers_discount) || 0;
      const finalSubtotalAfterDiscount = subtotal_after_discount || (subtotalAmount - finalCouponDiscount - finalOffersDiscount);
      const finalTaxAmount = tax_amount || (finalSubtotalAfterDiscount * 0.15);
      const totalAmount = finalSubtotalAfterDiscount + finalTaxAmount;

      // Crear pedido
      const orderData = {
        customer_id: customerId,
        customer_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
        customer_email: customer.email || null,
        customer_phone: customer.phone || null,
        receiver_name: receiver_name || null,
        receiver_phone: receiver_phone || null,
        customer_dni: customer_dni || customer.dni || null,
        delivery_address: delivery_address || null,
        department: department || null,
        city: city || null,
        invoice_type: invoice_type || 'Consumidor Final',
        rtn: rtn || null,
        business_name: business_name || null,
        payment_method: payment_method || 'Efectivo',
        total_amount: totalAmount,
        coupon_code: coupon_code || null,
        coupon_name: coupon_name || null,
        coupon_discount: finalCouponDiscount,
        offers_discount: finalOffersDiscount,
        subtotal_before_discount: finalSubtotalBeforeDiscount,
        subtotal_after_discount: finalSubtotalAfterDiscount,
        tax_amount: finalTaxAmount,
        items: orderItems,
        notes: notes || null,
        additional_comments: additional_comments || null
      };

      logger.info('Order data to create:', JSON.stringify(orderData, null, 2));

      const result = await OrderService.createOrder(orderData);

      // Obtener el pedido completo
      const order = await OrderService.getOrderById(result.order_id);

      res.status(201).json({
        success: true,
        message: 'Pedido creado exitosamente',
        data: {
          order_id: result.order_id,
          order_number: result.order_number,
          total: totalAmount,
          status: 'pendiente'
        }
      });

    } catch (error) {
      logger.error('Error in createOrder:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al crear pedido'
      });
    }
  }

  /**
   * Obtener pedido por número
   */
  static async getOrderByNumber(req, res) {
    try {
      const customerId = req.customer.id;
      const { order_number } = req.params;

      // Buscar el pedido por número
      const orders = await db.query(
        'SELECT * FROM orders WHERE order_number = ?',
        [order_number]
      );

      if (orders.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
      }

      const order = orders[0];

      // Verificar que el pedido pertenece al cliente
      if (order.customer_id !== customerId) {
        return res.status(403).json({
          success: false,
          message: 'No autorizado para ver este pedido'
        });
      }

      // Obtener el pedido completo con items
      const fullOrder = await OrderService.getOrderById(order.id);

      res.json({
        success: true,
        data: fullOrder
      });

    } catch (error) {
      logger.error('Error in getOrderByNumber:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener pedido'
      });
    }
  }

  /**
   * Obtener historial de pedidos del cliente
   */
  static async getMyOrders(req, res) {
    try {
      const customerId = req.customer.id;
      const { status = null } = req.query;

      const orders = await OrderService.getOrdersByCustomerId(customerId);

      // Filtrar por estado si se proporciona
      let filteredOrders = orders;
      if (status) {
        filteredOrders = orders.filter(order => order.status === status);
      }

      res.json({
        success: true,
        data: filteredOrders
      });

    } catch (error) {
      logger.error('Error in getMyOrders:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener pedidos'
      });
    }
  }

  /**
   * Cancelar pedido (solo si está pendiente)
   */
  static async cancelOrder(req, res) {
    try {
      const customerId = req.customer.id;
      const { order_number } = req.params;

      // Buscar el pedido por número
      const orders = await db.query(
        'SELECT * FROM orders WHERE order_number = ?',
        [order_number]
      );

      if (orders.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
      }

      const order = orders[0];

      // Verificar que el pedido pertenece al cliente
      if (order.customer_id !== customerId) {
        return res.status(403).json({
          success: false,
          message: 'No autorizado para cancelar este pedido'
        });
      }

      // Solo permitir cancelar si está en estado pendiente
      if (order.status !== 'pendiente') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden cancelar pedidos pendientes'
        });
      }

      // Eliminar el pedido
      await OrderService.deleteOrder(order.id);

      res.json({
        success: true,
        message: 'Pedido cancelado exitosamente'
      });

    } catch (error) {
      logger.error('Error in cancelOrder:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al cancelar pedido'
      });
    }
  }

  /**
   * Generar mensaje de WhatsApp para un pedido
   */
  static async sendOrderToWhatsApp(order) {
    try {
      // Obtener número de WhatsApp de la configuración
      const settings = await db.query(
        'SELECT setting_value FROM ecommerce_settings WHERE setting_key = ?',
        ['whatsapp_number']
      );

      const whatsappNumber = settings[0]?.setting_value || '+504 0000-0000';

      // Formatear mensaje
      let message = `🛒 *NUEVO PEDIDO EN LÍNEA*\n\n`;
      message += `📋 *Pedido:* ${order.order_number}\n`;
      message += `👤 *Cliente:* ${order.customer_name}\n`;

      if (order.customer_email) {
        message += `📧 *Email:* ${order.customer_email}\n`;
      }

      if (order.customer_phone) {
        message += `📱 *Teléfono:* ${order.customer_phone}\n`;
      }

      message += `\n📦 *PRODUCTOS:*\n`;
      order.items.forEach((item, index) => {
        message += `${index + 1}. ${item.product_name}\n`;
        message += `   Cantidad: ${item.quantity} x L${parseFloat(item.unit_price).toFixed(2)}\n`;
        message += `   Subtotal: L${parseFloat(item.subtotal).toFixed(2)}\n`;
      });

      message += `\n💰 *TOTAL: L${parseFloat(order.total_amount).toFixed(2)}*\n\n`;

      message += `📍 *DIRECCIÓN DE ENVÍO:*\n`;
      message += `${order.delivery_address}\n`;

      if (order.department) {
        message += `${order.city}, ${order.department}\n`;
      } else {
        message += `${order.city}\n`;
      }

      if (order.notes) {
        message += `\n📝 *Notas del cliente:*\n${order.notes}\n`;
      }

      // Generar URL de WhatsApp
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodedMessage}`;

      return { success: true, url: whatsappUrl, message };

    } catch (error) {
      logger.error('Error in sendOrderToWhatsApp:', error);
      throw error;
    }
  }

  /**
   * Obtener URL de WhatsApp para un pedido
   */
  static async getWhatsAppUrl(req, res) {
    try {
      const customerId = req.customer.id;
      const { order_number } = req.params;

      // Buscar el pedido por número
      const orders = await db.query(
        'SELECT * FROM orders WHERE order_number = ?',
        [order_number]
      );

      if (orders.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
      }

      const order = orders[0];

      // Verificar que el pedido pertenece al cliente
      if (order.customer_id !== customerId) {
        return res.status(403).json({
          success: false,
          message: 'No autorizado'
        });
      }

      // Obtener el pedido completo con items
      const fullOrder = await OrderService.getOrderById(order.id);

      const result = await this.sendOrderToWhatsApp(fullOrder);

      res.json({
        success: true,
        data: {
          whatsapp_url: result.url
        }
      });

    } catch (error) {
      logger.error('Error in getWhatsAppUrl:', error);
      res.status(500).json({
        success: false,
        message: 'Error al generar URL de WhatsApp'
      });
    }
  }

  /**
   * Obtener historial de cambios de estado de un pedido
   */
  static async getOrderStatusHistory(req, res) {
    try {
      const customerId = req.customer.id;
      const orderId = req.params.id;

      // Verificar que el pedido existe y pertenece al cliente
      const orders = await db.query(
        'SELECT id FROM orders WHERE id = ? AND customer_id = ?',
        [orderId, customerId]
      );

      if (orders.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
      }

      // Obtener el historial
      const history = await OrderService.getOrderStatusHistory(orderId);

      res.json({
        success: true,
        data: history
      });

    } catch (error) {
      logger.error('Error in getOrderStatusHistory:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener historial de cambios de estado'
      });
    }
  }

  /**
   * Cancelar pedido por el cliente
   */
  static async cancelOrder(req, res) {
    try {
      const customerId = req.customer.id;
      const { order_number } = req.params;
      const { cancellation_reason } = req.body;

      // Obtener el ID del pedido por el order_number
      const orders = await db.query(
        'SELECT id FROM orders WHERE order_number = ?',
        [order_number]
      );

      if (!orders || orders.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
      }

      const orderId = orders[0].id;

      // Validar motivo de cancelación
      if (!cancellation_reason || cancellation_reason.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar un motivo de cancelación'
        });
      }

      // Cancelar el pedido
      const result = await OrderService.cancelOrderByCustomer(
        orderId,
        customerId,
        cancellation_reason.trim()
      );

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('Error in cancelOrder:', error);

      if (error.message.includes('No tienes permiso') ||
          error.message.includes('Solo se pueden cancelar') ||
          error.message.includes('no encontrado')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al cancelar el pedido'
      });
    }
  }
}

module.exports = EcommerceOrdersController;
