// ===================================================================
// PROSPERPOS - CONTROLADORES COMPLETOS DEL SISTEMA POS
// ===================================================================

// src/controllers/pos.controller.js
const db = require('../utils/database');
const POSService = require('../services/pos.service');
const Sale = require('../models/Sale.model');
const Product = require('../models/Product.model');
const { successResponse, errorResponse } = require('../utils/response');
const { logError, logInfo } = require('../utils/logger');

class POSController {

  // ===================================================================
  // GESTIÓN DEL CARRITO
  // ===================================================================

  /**
   * Crear nuevo carrito
   */
  static async createCart(req, res) {
    try {
      const userId = req.user.id;
      const storeId = req.user.store_id || 1;

      const result = await POSService.createCart(userId, storeId);

      return successResponse(res, result, 'Carrito creado exitosamente');

    } catch (error) {
      logError('Error in createCart controller:', error);
      return errorResponse(res, 'Error al crear carrito', 500);
    }
  }

  /**
   * Agregar producto al carrito
   */
  static async addToCart(req, res) {
    try {
      const { cart, product_id, quantity = 1 } = req.body;
      const storeId = req.user.store_id || 1;

      if (!cart || !product_id) {
        return errorResponse(res, 'Datos del carrito y ID del producto son requeridos', 400);
      }

      if (quantity <= 0) {
        return errorResponse(res, 'La cantidad debe ser mayor a 0', 400);
      }

      const result = await POSService.addToCart(cart, product_id, quantity, storeId);

      return successResponse(res, result, 'Producto agregado al carrito');

    } catch (error) {
      logError('Error in addToCart controller:', error);
      return errorResponse(res, error.message || 'Error al agregar producto al carrito', 500);
    }
  }

  /**
   * Actualizar cantidad en carrito
   */
  static async updateCartItem(req, res) {
    try {
      const { cart, product_id, quantity } = req.body;
      const storeId = req.user.store_id || 1;

      if (!cart || !product_id || quantity === undefined) {
        return errorResponse(res, 'Datos del carrito, ID del producto y cantidad son requeridos', 400);
      }

      const result = await POSService.updateCartItem(cart, product_id, quantity, storeId);

      return successResponse(res, result, 'Cantidad actualizada');

    } catch (error) {
      logError('Error in updateCartItem controller:', error);
      return errorResponse(res, error.message || 'Error al actualizar cantidad', 500);
    }
  }

  /**
   * Remover producto del carrito
   */
  static async removeFromCart(req, res) {
    try {
      const { cart, product_id } = req.body;

      if (!cart || !product_id) {
        return errorResponse(res, 'Datos del carrito y ID del producto son requeridos', 400);
      }

      const result = await POSService.removeFromCart(cart, product_id);

      return successResponse(res, result, 'Producto removido del carrito');

    } catch (error) {
      logError('Error in removeFromCart controller:', error);
      return errorResponse(res, error.message || 'Error al remover producto', 500);
    }
  }

  /**
   * Aplicar descuento al carrito
   */
  static async applyDiscount(req, res) {
    try {
      const { cart, discount } = req.body;

      if (!cart || !discount) {
        return errorResponse(res, 'Datos del carrito y descuento son requeridos', 400);
      }

      if (!discount.type || !discount.value) {
        return errorResponse(res, 'Tipo y valor del descuento son requeridos', 400);
      }

      const result = await POSService.applyDiscount(cart, discount);

      return successResponse(res, result, 'Descuento aplicado');

    } catch (error) {
      logError('Error in applyDiscount controller:', error);
      return errorResponse(res, error.message || 'Error al aplicar descuento', 500);
    }
  }

  // ===================================================================
  // PROCESAMIENTO DE VENTAS
  // ===================================================================

  /**
   * Procesar venta desde carrito
   */
  static async processSale(req, res) {
    try {
      const { cart, customer_id, payments, notes, invoice_required } = req.body;
      const cashierId = req.user.id;

      if (!cart || !cart.items || cart.items.length === 0) {
        return errorResponse(res, 'El carrito está vacío', 400);
      }

      if (!payments || payments.length === 0) {
        return errorResponse(res, 'Debe especificar al menos un método de pago', 400);
      }

      const saleDetails = {
        customer_id,
        cashier_id,
        payments,
        notes: notes || '',
        invoice_required: invoice_required || false
      };

      const result = await POSService.processSale(cart, saleDetails);

      return successResponse(res, result, 'Venta procesada exitosamente', 201);

    } catch (error) {
      logError('Error in processSale controller:', error);
      return errorResponse(res, error.message || 'Error al procesar venta', 500);
    }
  }

  /**
   * Procesar venta rápida
   */
  static async processQuickSale(req, res) {
    try {
      const {
        product_id,
        quantity = 1,
        customer_id,
        payment_method_id,
        payment_amount
      } = req.body;

      const cashierId = req.user.id;
      const storeId = req.user.store_id || 1;

      if (!product_id || !payment_method_id || !payment_amount) {
        return errorResponse(res, 'Producto, método de pago y monto son requeridos', 400);
      }

      if (quantity <= 0) {
        return errorResponse(res, 'La cantidad debe ser mayor a 0', 400);
      }

      if (payment_amount <= 0) {
        return errorResponse(res, 'El monto del pago debe ser mayor a 0', 400);
      }

      const saleData = {
        product_id,
        quantity,
        customer_id,
        cashier_id,
        payment_method_id,
        payment_amount,
        store_id
      };

      const result = await POSService.processQuickSale(saleData);

      return successResponse(res, result, 'Venta rápida procesada exitosamente', 201);

    } catch (error) {
      logError('Error in processQuickSale controller:', error);
      return errorResponse(res, error.message || 'Error al procesar venta rápida', 500);
    }
  }

  // ===================================================================
  // BÚSQUEDA Y PRODUCTOS
  // ===================================================================

  /**
   * Buscar productos para POS
   */
  static async searchProducts(req, res) {
    try {
      const { q: searchTerm, limit = 20 } = req.query;
      const storeId = req.user.store_id || 1;

      if (!searchTerm || searchTerm.trim().length < 2) {
        return errorResponse(res, 'El término de búsqueda debe tener al menos 2 caracteres', 400);
      }

      const products = await POSService.searchProducts(searchTerm.trim(), storeId, parseInt(limit));

      return successResponse(res, products, 'Productos encontrados');

    } catch (error) {
      logError('Error in searchProducts controller:', error);
      return errorResponse(res, 'Error al buscar productos', 500);
    }
  }

  /**
   * Obtener producto por código de barras
   */
  static async getProductByBarcode(req, res) {
    try {
      const { barcode } = req.params;
      const storeId = req.user.store_id || 1;

      if (!barcode) {
        return errorResponse(res, 'Código de barras requerido', 400);
      }

      const product = await POSService.getProductByBarcode(barcode, storeId);

      if (!product) {
        return errorResponse(res, 'Producto no encontrado', 404);
      }

      return successResponse(res, product, 'Producto encontrado');

    } catch (error) {
      logError('Error in getProductByBarcode controller:', error);
      return errorResponse(res, 'Error al buscar producto por código de barras', 500);
    }
  }

  // ===================================================================
  // GESTIÓN DE SESIONES DE CAJA
  // ===================================================================

  /**
   * Abrir sesión de caja
   */
  static async openCashSession(req, res) {
    try {
      const { opening_balance = 0, register_id = 1, notes = '' } = req.body;
      const cashierId = req.user.id;
      const storeId = req.user.store_id || 1;

      if (opening_balance < 0) {
        return errorResponse(res, 'El balance inicial no puede ser negativo', 400);
      }

      const sessionData = {
        cashier_id: cashierId,
        store_id: storeId,
        register_id,
        opening_balance: parseFloat(opening_balance),
        notes
      };

      const result = await POSService.openCashSession(sessionData);

      return successResponse(res, result, 'Sesión de caja abierta exitosamente');

    } catch (error) {
      logError('Error in openCashSession controller:', error);
      return errorResponse(res, error.message || 'Error al abrir sesión de caja', 500);
    }
  }

  /**
   * Cerrar sesión de caja
   */
  static async closeCashSession(req, res) {
    try {
      const { session_id, cash_counted, notes = '' } = req.body;

      if (!session_id || cash_counted === undefined) {
        return errorResponse(res, 'ID de sesión y efectivo contado son requeridos', 400);
      }

      if (cash_counted < 0) {
        return errorResponse(res, 'El efectivo contado no puede ser negativo', 400);
      }

      const sessionData = {
        session_id,
        closing_balance: parseFloat(cash_counted),
        cash_counted: parseFloat(cash_counted),
        notes
      };

      const result = await POSService.closeCashSession(sessionData);

      return successResponse(res, result, 'Sesión de caja cerrada exitosamente');

    } catch (error) {
      logError('Error in closeCashSession controller:', error);
      return errorResponse(res, error.message || 'Error al cerrar sesión de caja', 500);
    }
  }

  /**
   * Obtener sesión de caja activa
   */
  static async getActiveCashSession(req, res) {
    try {
      const cashierId = req.user.id;

      const query = `
        SELECT 
          cs.*,
          r.name as register_name,
          COUNT(s.id) as total_sales,
          COALESCE(SUM(s.total), 0) as total_revenue
        FROM cash_sessions cs
        LEFT JOIN registers r ON cs.register_id = r.id
        LEFT JOIN sales s ON s.cashier_id = cs.cashier_id 
          AND s.created_at >= cs.opened_at 
          AND s.status = 'completed'
        WHERE cs.cashier_id = ? AND cs.status = 'open'
        GROUP BY cs.id
      `;

      const [sessions] = await db.execute(query, [cashierId]);

      if (!sessions[0]) {
        return errorResponse(res, 'No hay sesión de caja activa', 404);
      }

      return successResponse(res, sessions[0], 'Sesión activa obtenida');

    } catch (error) {
      logError('Error in getActiveCashSession controller:', error);
      return errorResponse(res, 'Error al obtener sesión activa', 500);
    }
  }

  // ===================================================================
  // MÉTODOS DE PAGO
  // ===================================================================

  /**
   * Obtener métodos de pago disponibles
   */
  static async getPaymentMethods(req, res) {
    try {
      const storeId = req.user.store_id || 1;

      const methods = await POSService.getPaymentMethods(storeId);

      return successResponse(res, methods, 'Métodos de pago obtenidos');

    } catch (error) {
      logError('Error in getPaymentMethods controller:', error);
      return errorResponse(res, 'Error al obtener métodos de pago', 500);
    }
  }

  /**
   * Procesar pago con tarjeta
   */
  static async processCardPayment(req, res) {
    try {
      const {
        amount,
        card_number,
        expiry_month,
        expiry_year,
        cvv,
        cardholder_name
      } = req.body;

      if (!amount || !card_number || !expiry_month || !expiry_year || !cvv) {
        return errorResponse(res, 'Todos los datos de la tarjeta son requeridos', 400);
      }

      if (amount <= 0) {
        return errorResponse(res, 'El monto debe ser mayor a 0', 400);
      }

      // Validaciones básicas de tarjeta
      if (card_number.length < 13 || card_number.length > 19) {
        return errorResponse(res, 'Número de tarjeta inválido', 400);
      }

      if (cvv.length < 3 || cvv.length > 4) {
        return errorResponse(res, 'CVV inválido', 400);
      }

      const paymentData = {
        amount: parseFloat(amount),
        card_number,
        expiry_month: parseInt(expiry_month),
        expiry_year: parseInt(expiry_year),
        cvv,
        cardholder_name
      };

      const result = await POSService.processCardPayment(paymentData);

      return successResponse(res, result, 'Pago procesado exitosamente');

    } catch (error) {
      logError('Error in processCardPayment controller:', error);
      return errorResponse(res, error.message || 'Error al procesar pago con tarjeta', 500);
    }
  }

  // ===================================================================
  // REPORTES Y ESTADÍSTICAS
  // ===================================================================

  /**
   * Obtener resumen diario del POS
   */
  static async getDailySummary(req, res) {
    try {
      const { date } = req.query;
      const storeId = req.user.store_id || 1;

      // Validar formato de fecha si se proporciona
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return errorResponse(res, 'Formato de fecha inválido (YYYY-MM-DD)', 400);
      }

      const summary = await POSService.getDailySummary(storeId, date);

      return successResponse(res, summary, 'Resumen diario obtenido');

    } catch (error) {
      logError('Error in getDailySummary controller:', error);
      return errorResponse(res, 'Error al obtener resumen diario', 500);
    }
  }

  /**
   * Obtener sesiones de caja del día
   */
  static async getDailyCashSessions(req, res) {
    try {
      const { date } = req.query;
      const storeId = req.user.store_id || 1;

      // Validar formato de fecha si se proporciona
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return errorResponse(res, 'Formato de fecha inválido (YYYY-MM-DD)', 400);
      }

      const sessions = await POSService.getDailyCashSessions(storeId, date);

      return successResponse(res, sessions, 'Sesiones de caja obtenidas');

    } catch (error) {
      logError('Error in getDailyCashSessions controller:', error);
      return errorResponse(res, 'Error al obtener sesiones de caja', 500);
    }
  }

  /**
   * Obtener dashboard del POS
   */
  static async getPOSDashboard(req, res) {
    try {
      const storeId = req.user.store_id || 1;
      const cashierId = req.user.id;
      const today = new Date().toISOString().slice(0, 10);

      // Obtener múltiples métricas en paralelo
      const [
        dailySummary,
        activeCashSession,
        topProducts,
        recentSales
      ] = await Promise.all([
        POSService.getDailySummary(storeId, today),
        POSController.getActiveCashSessionData(cashierId),
        Sale.getTopSellingProducts(storeId, 5, 30),
        Sale.getAll({
          store_id: storeId,
          limit: 10,
          status: 'completed'
        })
      ]);

      const dashboard = {
        daily_summary: dailySummary.summary,
        hourly_sales: dailySummary.hourly_sales,
        active_cash_session: activeCashSession,
        top_products: topProducts,
        recent_sales: recentSales.sales,
        alerts: await POSController.getPOSAlerts(storeId)
      };

      return successResponse(res, dashboard, 'Dashboard POS obtenido');

    } catch (error) {
      logError('Error in getPOSDashboard controller:', error);
      return errorResponse(res, 'Error al obtener dashboard POS', 500);
    }
  }

  // ===================================================================
  // GESTIÓN DE VENTAS
  // ===================================================================

  /**
   * Obtener ventas del POS
   */
  static async getSales(req, res) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        search: req.query.search || '',
        status: req.query.status || 'completed',
        payment_status: req.query.payment_status || null,
        date_from: req.query.date_from || null,
        date_to: req.query.date_to || null,
        store_id: req.user.store_id || 1,
        cashier_id: req.query.cashier_id || null
      };

      const result = await Sale.getAll(filters);

      return successResponse(res, result, 'Ventas obtenidas exitosamente');

    } catch (error) {
      logError('Error in getSales controller:', error);
      return errorResponse(res, 'Error al obtener ventas', 500);
    }
  }

  /**
   * Obtener venta por ID
   */
  static async getSaleById(req, res) {
    try {
      const { id } = req.params;
      const storeId = req.user.store_id || 1;

      const sale = await Sale.getById(id, storeId);

      if (!sale) {
        return errorResponse(res, 'Venta no encontrada', 404);
      }

      return successResponse(res, sale, 'Venta obtenida exitosamente');

    } catch (error) {
      logError('Error in getSaleById controller:', error);
      return errorResponse(res, 'Error al obtener venta', 500);
    }
  }

  /**
   * Cancelar venta
   */
  static async cancelSale(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const cancelledBy = req.user.id;

      if (!reason || reason.trim().length < 5) {
        return errorResponse(res, 'La razón de cancelación debe tener al menos 5 caracteres', 400);
      }

      const result = await Sale.cancel(id, reason.trim(), cancelledBy);

      return successResponse(res, result, 'Venta cancelada exitosamente');

    } catch (error) {
      logError('Error in cancelSale controller:', error);
      return errorResponse(res, error.message || 'Error al cancelar venta', 500);
    }
  }

  /**
   * Reimprimir recibo de venta
   */
  static async reprintReceipt(req, res) {
    try {
      const { id } = req.params;
      const storeId = req.user.store_id || 1;

      const sale = await Sale.getById(id, storeId);

      if (!sale) {
        return errorResponse(res, 'Venta no encontrada', 404);
      }

      // Aquí se generaría el recibo para impresión
      // Por ahora retornamos los datos de la venta
      return successResponse(res, {
        sale,
        print_ready: true,
        message: 'Recibo listo para impresión'
      }, 'Recibo generado exitosamente');

    } catch (error) {
      logError('Error in reprintReceipt controller:', error);
      return errorResponse(res, 'Error al generar recibo', 500);
    }
  }

  // ===================================================================
  // VENTAS EN ESPERA
  // ===================================================================

  /**
   * Guardar venta en espera
   */
  static async holdSale(req, res) {
    try {
      const { cart, notes = '' } = req.body;
      const userId = req.user.id;

      if (!cart || !cart.items || cart.items.length === 0) {
        return errorResponse(res, 'El carrito está vacío', 400);
      }

      // Simular guardado de venta en espera
      const holdId = `HOLD_${Date.now()}_${userId}`;
      
      // En producción, esto se guardaría en base de datos o cache
      const heldSale = {
        id: holdId,
        cart,
        notes,
        held_by: userId,
        held_at: new Date().toISOString()
      };

      logInfo(`Sale held: ${holdId} by user ${userId}`);

      return successResponse(res, heldSale, 'Venta guardada en espera');

    } catch (error) {
      logError('Error holding sale:', error);
      return errorResponse(res, 'Error al guardar venta en espera', 500);
    }
  }

  /**
   * Obtener ventas en espera
   */
  static async getHeldSales(req, res) {
    try {
      const userId = req.user.id;
      
      // En producción, obtener de base de datos
      // Simulamos con datos vacíos por ahora
      const heldSales = [];

      return successResponse(res, heldSales, 'Ventas en espera obtenidas');

    } catch (error) {
      logError('Error getting held sales:', error);
      return errorResponse(res, 'Error al obtener ventas en espera', 500);
    }
  }

  /**
   * Recuperar venta en espera
   */
  static async recallSale(req, res) {
    try {
      const { holdId } = req.params;
      const userId = req.user.id;

      // En producción, buscar en base de datos
      // Por ahora simulamos respuesta
      const recalledSale = {
        cart: {
          items: [],
          total: 0
        }
      };

      logInfo(`Sale recalled: ${holdId} by user ${userId}`);

      return successResponse(res, recalledSale, 'Venta recuperada de espera');

    } catch (error) {
      logError('Error recalling held sale:', error);
      return errorResponse(res, 'Error al recuperar venta en espera', 500);
    }
  }

  // ===================================================================
  // FUNCIONALIDADES ADICIONALES
  // ===================================================================

  /**
   * Obtener configuración del POS
   */
  static async getPOSSettings(req, res) {
    try {
      const storeId = req.user.store_id || 1;

      const query = `
        SELECT 
          s.key_name,
          s.value,
          s.data_type
        FROM settings s
        WHERE s.category = 'pos' 
          AND (s.store_id = ? OR s.store_id IS NULL)
        ORDER BY s.sort_order, s.key_name
      `;

      const [settings] = await db.execute(query, [storeId]);

      // Convertir array a objeto
      const posSettings = {};
      settings.forEach(setting => {
        let value = setting.value;
        
        // Convertir tipos de datos
        if (setting.data_type === 'boolean') {
          value = value === 'true' || value === '1';
        } else if (setting.data_type === 'number') {
          value = parseFloat(value);
        } else if (setting.data_type === 'json') {
          try {
            value = JSON.parse(value);
          } catch (e) {
            // Mantener como string si no es JSON válido
          }
        }
        
        posSettings[setting.key_name] = value;
      });

      return successResponse(res, posSettings, 'Configuración POS obtenida');

    } catch (error) {
      logError('Error getting POS settings:', error);
      return errorResponse(res, 'Error al obtener configuración', 500);
    }
  }

  /**
   * Obtener cajeros activos
   */
  static async getActiveCashiers(req, res) {
    try {
      const storeId = req.user.store_id || 1;

      const query = `
        SELECT 
          u.id,
          u.name,
          u.email,
          cs.id as session_id,
          cs.opened_at,
          cs.opening_balance,
          COUNT(s.id) as sales_today,
          COALESCE(SUM(s.total), 0) as revenue_today
        FROM users u
        LEFT JOIN cash_sessions cs ON u.id = cs.cashier_id AND cs.status = 'open'
        LEFT JOIN sales s ON u.id = s.cashier_id 
          AND DATE(s.created_at) = CURDATE() 
          AND s.status = 'completed'
        WHERE u.store_id = ? 
          AND u.status = 'active'
          AND EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN roles r ON ur.role_id = r.id 
            WHERE ur.user_id = u.id 
              AND r.name IN ('cashier', 'manager', 'admin')
          )
        GROUP BY u.id
        ORDER BY cs.opened_at DESC, u.name
      `;

      const [cashiers] = await db.execute(query, [storeId]);

      return successResponse(res, cashiers, 'Cajeros activos obtenidos');

    } catch (error) {
      logError('Error getting active cashiers:', error);
      return errorResponse(res, 'Error al obtener cajeros activos', 500);
    }
  }

  // ===================================================================
  // MÉTODOS AUXILIARES PRIVADOS
  // ===================================================================

  /**
   * Obtener datos de sesión de caja activa
   */
  static async getActiveCashSessionData(cashierId) {
    try {
      const query = `
        SELECT 
          cs.*,
          r.name as register_name,
          COUNT(s.id) as session_sales,
          COALESCE(SUM(s.total), 0) as session_revenue
        FROM cash_sessions cs
        LEFT JOIN registers r ON cs.register_id = r.id
        LEFT JOIN sales s ON s.cashier_id = cs.cashier_id 
          AND s.created_at >= cs.opened_at 
          AND s.status = 'completed'
        WHERE cs.cashier_id = ? AND cs.status = 'open'
        GROUP BY cs.id
      `;

      const [sessions] = await db.execute(query, [cashierId]);
      return sessions[0] || null;

    } catch (error) {
      logError('Error getting active cash session:', error);
      return null;
    }
  }

  /**
   * Obtener alertas del POS
   */
  static async getPOSAlerts(storeId) {
    try {
      const alerts = [];

      // Verificar productos con stock bajo
      const lowStockProducts = await Product.getLowStockProducts(storeId, 5);
      
      if (lowStockProducts.length > 0) {
        alerts.push({
          type: 'low_stock',
          severity: 'warning',
          count: lowStockProducts.length,
          message: `${lowStockProducts.length} productos con stock bajo`,
          products: lowStockProducts.map(p => p.name).slice(0, 3)
        });
      }

      // Verificar sesiones de caja abiertas por mucho tiempo
      const query = `
        SELECT 
          cs.id,
          cs.opened_at,
          u.name as cashier_name,
          TIMESTAMPDIFF(HOUR, cs.opened_at, NOW()) as hours_open
        FROM cash_sessions cs
        LEFT JOIN users u ON cs.cashier_id = u.id
        WHERE cs.store_id = ? 
          AND cs.status = 'open'
          AND TIMESTAMPDIFF(HOUR, cs.opened_at, NOW()) >= 12
      `;

      const [longSessions] = await db.execute(query, [storeId]);
      
      if (longSessions.length > 0) {
        alerts.push({
          type: 'long_cash_session',
          severity: 'warning',
          count: longSessions.length,
          message: `${longSessions.length} sesiones de caja abiertas por más de 12 horas`,
          sessions: longSessions
        });
      }

      // Verificar ventas sin procesar pagos
      const pendingPaymentsQuery = `
        SELECT COUNT(*) as count
        FROM sales s
        WHERE s.store_id = ? 
          AND s.payment_status = 'pending'
          AND s.created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
      `;

      const [pendingPayments] = await db.execute(pendingPaymentsQuery, [storeId]);
      
      if (pendingPayments[0].count > 0) {
        alerts.push({
          type: 'pending_payments',
          severity: 'error',
          count: pendingPayments[0].count,
          message: `${pendingPayments[0].count} ventas con pagos pendientes`
        });
      }

      return alerts;

    } catch (error) {
      logError('Error getting POS alerts:', error);
      return [];
    }
  }

  /**
   * Obtener estadísticas de rendimiento del cajero
   */
  static async getCashierPerformance(req, res) {
    try {
      const { cashier_id, date_from, date_to } = req.query;
      const storeId = req.user.store_id || 1;
      const targetCashierId = cashier_id || req.user.id;

      let whereClause = 'WHERE s.store_id = ? AND s.cashier_id = ? AND s.status = "completed"';
      const params = [storeId, targetCashierId];

      if (date_from) {
        whereClause += ' AND DATE(s.created_at) >= ?';
        params.push(date_from);
      }

      if (date_to) {
        whereClause += ' AND DATE(s.created_at) <= ?';
        params.push(date_to);
      }

      const query = `
        SELECT 
          COUNT(*) as total_sales,
          SUM(s.total) as total_revenue,
          AVG(s.total) as average_sale,
          MAX(s.total) as highest_sale,
          MIN(s.total) as lowest_sale,
          COUNT(DISTINCT DATE(s.created_at)) as active_days,
          AVG(TIME_TO_SEC(TIMEDIFF(s.updated_at, s.created_at))) as avg_processing_time,
          SUM(CASE WHEN s.discount_amount > 0 THEN 1 ELSE 0 END) as sales_with_discount,
          SUM(s.discount_amount) as total_discounts
        FROM sales s
        ${whereClause}
      `;

      const [performance] = await db.execute(query, params);

      // Obtener ventas por día
      const dailyQuery = `
        SELECT 
          DATE(s.created_at) as sale_date,
          COUNT(*) as daily_sales,
          SUM(s.total) as daily_revenue
        FROM sales s
        ${whereClause}
        GROUP BY DATE(s.created_at)
        ORDER BY sale_date DESC
      `;

      const [dailyPerformance] = await db.execute(dailyQuery, params);

      const result = {
        summary: performance[0],
        daily_performance: dailyPerformance
      };

      return successResponse(res, result, 'Rendimiento del cajero obtenido');

    } catch (error) {
      logError('Error getting cashier performance:', error);
      return errorResponse(res, 'Error al obtener rendimiento del cajero', 500);
    }
  }
}

module.exports = POSController;