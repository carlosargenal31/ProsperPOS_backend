// ===================================================================
// PROSPERPOS - CONTROLADOR DE PEDIDOS EN LÍNEA
// ===================================================================

const OrderService = require('../services/order.service');
const logger = require('../utils/logger');

class OrderController {

  // =================================================================
  // CREAR PEDIDO
  // =================================================================
  static async createOrder(req, res) {
    try {
      const orderData = req.body;

      // Validaciones básicas
      if (!orderData.customer_name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del cliente es requerido'
        });
      }

      if (!orderData.items || orderData.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El pedido debe tener al menos un producto'
        });
      }

      if (!orderData.total_amount || orderData.total_amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El monto total debe ser mayor a cero'
        });
      }

      const result = await OrderService.createOrder(orderData);

      res.status(201).json({
        success: true,
        message: 'Pedido creado exitosamente',
        data: result
      });

    } catch (error) {
      logger.error('Error en createOrder:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear el pedido',
        error: error.message
      });
    }
  }

  // =================================================================
  // OBTENER TODOS LOS PEDIDOS
  // =================================================================
  static async getAllOrders(req, res) {
    try {
      const filters = {
        status: req.query.status,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        search: req.query.search,
        limit: req.query.limit,
        offset: req.query.offset
      };

      const orders = await OrderService.getAllOrders(filters);

      res.json({
        success: true,
        data: orders
      });

    } catch (error) {
      logger.error('Error en getAllOrders:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener pedidos',
        error: error.message
      });
    }
  }

  // =================================================================
  // OBTENER PEDIDO POR ID
  // =================================================================
  static async getOrderById(req, res) {
    try {
      const { id } = req.params;

      const order = await OrderService.getOrderById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
      }

      res.json({
        success: true,
        data: order
      });

    } catch (error) {
      logger.error('Error en getOrderById:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener el pedido',
        error: error.message
      });
    }
  }

  // =================================================================
  // OBTENER PEDIDOS POR CLIENTE
  // =================================================================
  static async getOrdersByCustomer(req, res) {
    try {
      const customerId = req.user?.id || req.params.customer_id;

      if (!customerId) {
        return res.status(400).json({
          success: false,
          message: 'ID de cliente no proporcionado'
        });
      }

      const orders = await OrderService.getOrdersByCustomerId(customerId);

      res.json({
        success: true,
        data: orders
      });

    } catch (error) {
      logger.error('Error en getOrdersByCustomer:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener pedidos del cliente',
        error: error.message
      });
    }
  }

  // =================================================================
  // ACTUALIZAR ESTADO DEL PEDIDO
  // =================================================================
  static async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'El estado es requerido'
        });
      }

      const result = await OrderService.updateOrderStatus(id, status, notes);

      res.json({
        success: true,
        message: 'Estado del pedido actualizado exitosamente',
        data: result
      });

    } catch (error) {
      logger.error('Error en updateOrderStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar el estado del pedido',
        error: error.message
      });
    }
  }

  // =================================================================
  // ELIMINAR PEDIDO
  // =================================================================
  static async deleteOrder(req, res) {
    try {
      const { id } = req.params;

      const result = await OrderService.deleteOrder(id);

      res.json({
        success: true,
        message: 'Pedido eliminado exitosamente',
        data: result
      });

    } catch (error) {
      logger.error('Error en deleteOrder:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar el pedido',
        error: error.message
      });
    }
  }

  // =================================================================
  // OBTENER ESTADÍSTICAS DE PEDIDOS
  // =================================================================
  static async getOrderStats(req, res) {
    try {
      const stats = await OrderService.getOrderStats();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Error en getOrderStats:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.message
      });
    }
  }

  // =================================================================
  // ACTUALIZAR NOTAS DEL PEDIDO
  // =================================================================
  static async updateOrderNotes(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const result = await OrderService.updateOrderNotes(id, notes);

      res.json({
        success: true,
        message: 'Notas del pedido actualizadas exitosamente',
        data: result
      });

    } catch (error) {
      logger.error('Error en updateOrderNotes:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar notas del pedido',
        error: error.message
      });
    }
  }

  // =================================================================
  // CONVERTIR PEDIDO A FACTURA
  // =================================================================
  static async convertToInvoice(req, res) {
    try {
      const { id } = req.params;
      const billingData = {
        ...req.body,
        user_id: req.user?.id
      };

      const result = await OrderService.convertToInvoice(id, billingData);

      res.json({
        success: true,
        message: 'Pedido convertido a factura exitosamente',
        data: result
      });

    } catch (error) {
      logger.error('Error en convertToInvoice:', error);
      res.status(500).json({
        success: false,
        message: 'Error al convertir pedido a factura',
        error: error.message
      });
    }
  }

  // =================================================================
  // EXPORTAR PEDIDOS A EXCEL
  // =================================================================
  static async exportToExcel(req, res) {
    try {
      const filters = {
        status: req.query.status,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        search: req.query.search
      };

      const orders = await OrderService.getAllOrders(filters);

      // Preparar datos para Excel
      const excelData = orders.map(order => ({
        'Número de Pedido': order.order_number,
        'Cliente': order.customer_name,
        'Email': order.customer_email || '',
        'Teléfono': order.customer_phone || '',
        'Ciudad': order.city || '',
        'Departamento': order.department || '',
        'Total': parseFloat(order.total_amount).toFixed(2),
        'Estado': order.status,
        'Fecha': new Date(order.created_at).toLocaleDateString('es-HN')
      }));

      res.json({
        success: true,
        data: excelData,
        filename: `pedidos_${new Date().toISOString().split('T')[0]}.xlsx`
      });

    } catch (error) {
      logger.error('Error en exportToExcel:', error);
      res.status(500).json({
        success: false,
        message: 'Error al exportar pedidos',
        error: error.message
      });
    }
  }

  // =================================================================
  // EXPORTAR PEDIDO INDIVIDUAL A PDF
  // =================================================================
  static async exportOrderToPDF(req, res) {
    try {
      const { id } = req.params;

      const order = await OrderService.getOrderById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
      }

      // Preparar datos para PDF
      const pdfData = {
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        delivery_address: order.delivery_address,
        city: order.city,
        department: order.department,
        total_amount: parseFloat(order.total_amount).toFixed(2),
        status: order.status,
        created_at: new Date(order.created_at).toLocaleString('es-HN'),
        items: order.items.map(item => ({
          product_name: item.product_name,
          product_code: item.product_code,
          quantity: item.quantity,
          unit_price: parseFloat(item.unit_price).toFixed(2),
          subtotal: parseFloat(item.subtotal).toFixed(2)
        })),
        notes: order.notes
      };

      res.json({
        success: true,
        data: pdfData
      });

    } catch (error) {
      logger.error('Error en exportOrderToPDF:', error);
      res.status(500).json({
        success: false,
        message: 'Error al exportar pedido a PDF',
        error: error.message
      });
    }
  }
}

module.exports = OrderController;
