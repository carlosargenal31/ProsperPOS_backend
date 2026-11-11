// ===================================================================
// PROSPERPOS - RUTAS DEL SISTEMA POS (SIMPLIFICADO)
// ===================================================================

const express = require('express');
const router = express.Router();
const db = require('../utils/database');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Middleware global de autenticación
router.use(authenticateToken);

/**
 * @route   GET /api/v1/pos/products/search
 * @desc    Buscar productos para POS
 * @access  Private (pos.access)
 */
router.get('/products/search',
  requirePermission('pos.access'),
  async (req, res) => {
    try {
      const { q = '', limit = 20 } = req.query;
      const store_id = req.user.store_id || 1;

      if (!q || q.length < 2) {
        return sendSuccessResponse(res, [], 'Ingrese al menos 2 caracteres para buscar');
      }

      const query = `
        SELECT 
          p.id,
          p.name,
          p.sku,
          p.barcode,
          p.sale_price,
          p.cost_price,
          p.image,
          c.name as category_name,
          b.name as brand_name,
          COALESCE(s.quantity, 0) as stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN stock s ON p.id = s.product_id AND s.store_id = ?
        WHERE p.deleted_at IS NULL 
          AND p.status = 'active'
          AND (
            p.name LIKE ? OR 
            p.sku LIKE ? OR 
            p.barcode LIKE ?
          )
        LIMIT ?
      `;

      const searchTerm = `%${q}%`;
      const products = await db.query(query, [
        store_id,
        searchTerm, searchTerm, searchTerm,
        parseInt(limit)
      ]);

      return sendSuccessResponse(res, products, 'Búsqueda completada');

    } catch (error) {
      logger.error('Error searching products for POS:', error);
      return sendErrorResponse(res, 500, 'Error al buscar productos');
    }
  }
);

/**
 * @route   GET /api/v1/pos/products/barcode/:barcode
 * @desc    Obtener producto por código de barras
 * @access  Private (pos.access)
 */
router.get('/products/barcode/:barcode',
  requirePermission('pos.access'),
  async (req, res) => {
    try {
      const { barcode } = req.params;
      const store_id = req.user.store_id || 1;

      const query = `
        SELECT 
          p.*,
          c.name as category_name,
          b.name as brand_name,
          COALESCE(s.quantity, 0) as stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN stock s ON p.id = s.product_id AND s.store_id = ?
        WHERE p.barcode = ? 
          AND p.deleted_at IS NULL 
          AND p.status = 'active'
        LIMIT 1
      `;

      const products = await db.query(query, [store_id, barcode]);

      if (products.length === 0) {
        return sendErrorResponse(res, 404, 'Producto no encontrado');
      }

      return sendSuccessResponse(res, products[0], 'Producto encontrado');

    } catch (error) {
      logger.error('Error getting product by barcode:', error);
      return sendErrorResponse(res, 500, 'Error al buscar producto');
    }
  }
);

/**
 * @route   GET /api/v1/pos/payment-methods
 * @desc    Obtener métodos de pago disponibles
 * @access  Private (pos.access)
 */
router.get('/payment-methods',
  requirePermission('pos.access'),
  async (req, res) => {
    try {
      const query = `
        SELECT * FROM payment_methods 
        WHERE is_active = true 
        ORDER BY name
      `;

      const methods = await db.query(query);

      return sendSuccessResponse(res, methods, 'Métodos de pago obtenidos');

    } catch (error) {
      logger.error('Error getting payment methods:', error);
      return sendErrorResponse(res, 500, 'Error al obtener métodos de pago');
    }
  }
);

/**
 * @route   POST /api/v1/pos/sale/quick
 * @desc    Procesar venta rápida
 * @access  Private (pos.sell)
 */
router.post('/sale/quick',
  requirePermission('pos.sell'),
  async (req, res) => {
    try {
      const {
        product_id,
        quantity = 1,
        customer_id = null,
        payment_method_id = 1,
        payment_amount
      } = req.body;

      const user_id = req.user.id;
      const store_id = req.user.store_id || 1;

      // Validaciones
      if (!product_id || !payment_amount) {
        return sendErrorResponse(res, 400, 'Producto y monto de pago son requeridos');
      }

      // Verificar producto y stock
      const products = await db.query(`
        SELECT p.*, COALESCE(s.quantity, 0) as stock
        FROM products p
        LEFT JOIN stock s ON p.id = s.product_id AND s.store_id = ?
        WHERE p.id = ? AND p.deleted_at IS NULL
      `, [store_id, product_id]);

      if (products.length === 0) {
        return sendErrorResponse(res, 404, 'Producto no encontrado');
      }

      const product = products[0];

      if (product.stock < quantity) {
        return sendErrorResponse(res, 400, 'Stock insuficiente');
      }

      const subtotal = product.sale_price * quantity;
      const tax = subtotal * 0.15; // 15% impuesto
      const total = subtotal + tax;

      if (payment_amount < total) {
        return sendErrorResponse(res, 400, 'Monto de pago insuficiente');
      }

      const change = payment_amount - total;

      // Simular creación de venta (en producción, usar transacción)
      const saleData = {
        id: Date.now(),
        product_id,
        product_name: product.name,
        quantity,
        unit_price: product.sale_price,
        subtotal,
        tax,
        total,
        payment_method_id,
        payment_amount,
        change,
        customer_id,
        user_id,
        store_id,
        created_at: new Date().toISOString()
      };

      logger.info('Quick sale processed', {
        saleId: saleData.id,
        userId: user_id,
        total
      });

      return sendSuccessResponse(res, saleData, 'Venta procesada exitosamente', 201);

    } catch (error) {
      logger.error('Error processing quick sale:', error);
      return sendErrorResponse(res, 500, 'Error al procesar venta');
    }
  }
);

/**
 * @route   GET /api/v1/pos/dashboard
 * @desc    Dashboard del POS
 * @access  Private (pos.access)
 */
router.get('/dashboard',
  requirePermission('pos.access'),
  async (req, res) => {
    try {
      const store_id = req.user.store_id || 1;
      const today = new Date().toISOString().split('T')[0];

      // Simular datos del dashboard
      const dashboard = {
        today_sales: {
          count: 0,
          total: 0
        },
        cash_in_register: 0,
        pending_orders: 0,
        low_stock_products: 0
      };

      return sendSuccessResponse(res, dashboard, 'Dashboard obtenido');

    } catch (error) {
      logger.error('Error getting POS dashboard:', error);
      return sendErrorResponse(res, 500, 'Error al obtener dashboard');
    }
  }
);

/**
 * @route   POST /api/v1/pos/cart/create
 * @desc    Crear nuevo carrito
 * @access  Private (pos.access)
 */
router.post('/cart/create',
  requirePermission('pos.access'),
  async (req, res) => {
    try {
      const cart = {
        id: `CART_${Date.now()}_${req.user.id}`,
        items: [],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        created_at: new Date().toISOString(),
        user_id: req.user.id
      };

      return sendSuccessResponse(res, cart, 'Carrito creado', 201);

    } catch (error) {
      logger.error('Error creating cart:', error);
      return sendErrorResponse(res, 500, 'Error al crear carrito');
    }
  }
);

/**
 * @route   GET /api/v1/pos/sales
 * @desc    Obtener ventas del POS
 * @access  Private (pos.access)
 */
router.get('/sales',
  requirePermission('pos.access'),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, date_from, date_to } = req.query;
      const offset = (page - 1) * limit;
      const store_id = req.user.store_id || 1;

      let query = `
        SELECT 
          s.*,
          u.first_name as cashier_name,
          c.first_name as customer_name
        FROM sales s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE s.store_id = ?
      `;
      const params = [store_id];

      if (date_from) {
        query += ' AND DATE(s.created_at) >= ?';
        params.push(date_from);
      }

      if (date_to) {
        query += ' AND DATE(s.created_at) <= ?';
        params.push(date_to);
      }

      query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const sales = await db.query(query, params);

      return sendSuccessResponse(res, { sales }, 'Ventas obtenidas');

    } catch (error) {
      logger.error('Error getting sales:', error);
      return sendErrorResponse(res, 500, 'Error al obtener ventas');
    }
  }
);

/**
 * @route   GET /api/v1/pos/sales/:id
 * @desc    Obtener venta por ID
 * @access  Private (pos.access)
 */
router.get('/sales/:id',
  requirePermission('pos.access'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const sales = await db.query(`
        SELECT 
          s.*,
          u.first_name as cashier_name,
          c.first_name as customer_name
        FROM sales s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE s.id = ?
      `, [id]);

      if (sales.length === 0) {
        return sendErrorResponse(res, 404, 'Venta no encontrada');
      }

      // Obtener items de la venta
      const items = await db.query(`
        SELECT si.*, p.name as product_name
        FROM sale_items si
        LEFT JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
      `, [id]);

      const sale = {
        ...sales[0],
        items
      };

      return sendSuccessResponse(res, sale, 'Venta obtenida');

    } catch (error) {
      logger.error('Error getting sale:', error);
      return sendErrorResponse(res, 500, 'Error al obtener venta');
    }
  }
);

module.exports = router;