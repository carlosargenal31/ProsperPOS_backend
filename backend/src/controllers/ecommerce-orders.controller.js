// ===================================================================
// PROSPERPOS - CONTROLADOR DE PEDIDOS E-COMMERCE
// ===================================================================

const WebOrder = require('../models/web-order.model');
const WebCustomer = require('../models/web-customer.model');
const ShoppingCart = require('../models/shopping-cart.model');
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
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_country = 'Honduras',
        shipping_postal_code,
        customer_notes,
        payment_method = 'whatsapp'
      } = req.body;

      // Validar dirección de envío
      if (!shipping_address || !shipping_city) {
        return res.status(400).json({
          success: false,
          message: 'Dirección y ciudad de envío son requeridas'
        });
      }

      // Obtener carrito del cliente
      const cart = await ShoppingCart.getByCustomerId(customerId);

      if (!cart.items || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El carrito está vacío'
        });
      }

      // Obtener datos del cliente
      const customer = await WebCustomer.getById(customerId);

      // Preparar items del pedido
      const orderItems = cart.items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        product_code: item.product_code,
        product_image: item.product_image,
        quantity: item.quantity,
        unit_price: item.unit_price || 0,
        tax_rate: item.tax_rate || 0
      }));

      // Crear pedido
      const orderData = {
        customer_id: customerId,
        customer_name: `${customer.first_name} ${customer.last_name}`,
        customer_email: customer.email,
        customer_phone: customer.phone || '',
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_country,
        shipping_postal_code,
        items: orderItems,
        customer_notes,
        payment_method
      };

      const result = await WebOrder.create(orderData);

      // Obtener el pedido completo
      const order = await WebOrder.getById(result.id);

      // Enviar a WhatsApp
      try {
        await this.sendOrderToWhatsApp(order);
        await WebOrder.markWhatsAppSent(result.id);
      } catch (whatsappError) {
        logger.error('Error sending to WhatsApp:', whatsappError);
        // No fallar la creación del pedido si falla WhatsApp
      }

      res.status(201).json({
        success: true,
        message: 'Pedido creado exitosamente',
        data: {
          order_id: result.id,
          order_number: result.order_number,
          total: result.total
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

      const order = await WebOrder.getByOrderNumber(order_number);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
      }

      // Verificar que el pedido pertenece al cliente
      if (order.customer_id !== customerId) {
        return res.status(403).json({
          success: false,
          message: 'No autorizado para ver este pedido'
        });
      }

      res.json({
        success: true,
        data: order
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
      const { page = 1, limit = 10, status = null } = req.query;

      const orders = await WebCustomer.getOrders(customerId, {
        page,
        limit,
        status
      });

      res.json({
        success: true,
        data: orders
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
   * Cancelar pedido
   */
  static async cancelOrder(req, res) {
    try {
      const customerId = req.customer.id;
      const { order_number } = req.params;
      const { reason = 'Cancelado por el cliente' } = req.body;

      const order = await WebOrder.getByOrderNumber(order_number);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
      }

      // Verificar que el pedido pertenece al cliente
      if (order.customer_id !== customerId) {
        return res.status(403).json({
          success: false,
          message: 'No autorizado para cancelar este pedido'
        });
      }

      // Solo permitir cancelar si está en estado pending o confirmed
      if (!['pending', 'confirmed'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'Este pedido no puede ser cancelado'
        });
      }

      await WebOrder.cancel(order.id, reason, customerId);

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
   * Enviar pedido a WhatsApp
   */
  static async sendOrderToWhatsApp(order) {
    try {
      // Obtener número de WhatsApp de la configuración
      const [settings] = await db.execute(
        'SELECT setting_value FROM ecommerce_settings WHERE setting_key = "whatsapp_number"'
      );

      const whatsappNumber = settings[0]?.setting_value || '+504 0000-0000';

      // Formatear mensaje
      let message = `🛒 *NUEVO PEDIDO WEB*\n\n`;
      message += `📋 *Pedido:* ${order.order_number}\n`;
      message += `👤 *Cliente:* ${order.customer_name}\n`;
      message += `📧 *Email:* ${order.customer_email}\n`;
      message += `📱 *Teléfono:* ${order.customer_phone}\n\n`;

      message += `📦 *PRODUCTOS:*\n`;
      order.items.forEach((item, index) => {
        message += `${index + 1}. ${item.product_name}\n`;
        message += `   Cantidad: ${item.quantity} x L${item.unit_price.toFixed(2)}\n`;
        message += `   Subtotal: L${item.total.toFixed(2)}\n`;
      });

      message += `\n💰 *TOTAL: L${order.total.toFixed(2)}*\n\n`;

      message += `📍 *DIRECCIÓN DE ENVÍO:*\n`;
      message += `${order.shipping_address}\n`;
      message += `${order.shipping_city}, ${order.shipping_state || ''}\n`;
      message += `${order.shipping_country}\n`;

      if (order.customer_notes) {
        message += `\n📝 *Notas del cliente:*\n${order.customer_notes}\n`;
      }

      // Generar URL de WhatsApp
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodedMessage}`;

      // Log para debug (en producción, aquí se enviaría realmente)
      console.log('WhatsApp URL:', whatsappUrl);
      console.log('Message:', message);

      return { success: true, url: whatsappUrl };

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

      const order = await WebOrder.getByOrderNumber(order_number);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
      }

      // Verificar que el pedido pertenece al cliente
      if (order.customer_id !== customerId) {
        return res.status(403).json({
          success: false,
          message: 'No autorizado'
        });
      }

      const result = await this.sendOrderToWhatsApp(order);

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
}

module.exports = EcommerceOrdersController;
