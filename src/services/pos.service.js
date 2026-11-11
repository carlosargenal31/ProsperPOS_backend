// ===================================================================
// PROSPERPOS - SERVICIO DEL SISTEMA POS
// ===================================================================

// src/services/pos.service.js
const db = require('../utils/database');
const Sale = require('../models/sale.model');
const Product = require('../models/product.model');
const InventoryService = require('./inventory.service');
const { logError, logInfo } = require('../utils/logger');

class POSService {

  // ===================================================================
  // GESTIÓN DEL CARRITO
  // ===================================================================

  /**
   * Crear nueva sesión de carrito
   */
  static async createCart(userId, storeId) {
    try {
      const cartData = {
        user_id: userId,
        store_id: storeId,
        status: 'active',
        items: [],
        subtotal: 0,
        tax_amount: 0,
        discount_amount: 0,
        total: 0
      };

      // En producción, esto se guardaría en Redis o en memoria
      // Por ahora simulamos con estructura en memoria
      const cartId = `cart_${userId}_${Date.now()}`;
      
      return {
        cart_id: cartId,
        ...cartData,
        message: 'Carrito creado exitosamente'
      };
      
    } catch (error) {
      logError('Error creating cart:', error);
      throw error;
    }
  }

  /**
   * Agregar producto al carrito
   */
  static async addToCart(cartData, productId, quantity = 1, storeId = 1) {
    try {
      // Obtener información del producto
      const product = await Product.getById(productId, storeId);
      if (!product) {
        throw new Error('Producto no encontrado');
      }

      if (product.status !== 'active') {
        throw new Error('El producto no está disponible para venta');
      }

      // Verificar stock disponible
      const stockCheck = await Product.checkStock(productId, quantity, storeId);
      if (!stockCheck.available) {
        throw new Error(stockCheck.message);
      }

      // Buscar si el producto ya está en el carrito
      const existingItemIndex = cartData.items.findIndex(item => item.product_id === productId);
      
      if (existingItemIndex >= 0) {
        // Actualizar cantidad existente
        const newQuantity = cartData.items[existingItemIndex].quantity + quantity;
        
        // Verificar stock para nueva cantidad
        const newStockCheck = await Product.checkStock(productId, newQuantity, storeId);
        if (!newStockCheck.available) {
          throw new Error(`Stock insuficiente. Disponible: ${newStockCheck.currentStock}, Total requerido: ${newQuantity}`);
        }
        
        cartData.items[existingItemIndex].quantity = newQuantity;
        cartData.items[existingItemIndex].total = newQuantity * cartData.items[existingItemIndex].unit_price;
      } else {
        // Agregar nuevo item
        const unitPrice = parseFloat(product.sale_price) || 0;
        const taxRate = parseFloat(product.tax_rate) || 0;
        
        const newItem = {
          product_id: productId,
          product_name: product.name,
          product_code: product.code,
          product_barcode: product.barcode,
          quantity: quantity,
          unit_price: unitPrice,
          tax_rate: taxRate,
          discount_amount: 0,
          total: quantity * unitPrice
        };
        
        cartData.items.push(newItem);
      }

      // Recalcular totales
      this.recalculateCart(cartData);

      return {
        cart: cartData,
        message: 'Producto agregado al carrito'
      };

    } catch (error) {
      logError('Error adding to cart:', error);
      throw error;
    }
  }

  /**
   * Actualizar cantidad de producto en carrito
   */
  static async updateCartItem(cartData, productId, newQuantity, storeId = 1) {
    try {
      const itemIndex = cartData.items.findIndex(item => item.product_id === productId);
      
      if (itemIndex === -1) {
        throw new Error('Producto no encontrado en el carrito');
      }

      if (newQuantity <= 0) {
        // Remover item si cantidad es 0 o negativa
        return this.removeFromCart(cartData, productId);
      }

      // Verificar stock disponible
      const stockCheck = await Product.checkStock(productId, newQuantity, storeId);
      if (!stockCheck.available) {
        throw new Error(stockCheck.message);
      }

      // Actualizar cantidad y total
      cartData.items[itemIndex].quantity = newQuantity;
      cartData.items[itemIndex].total = newQuantity * cartData.items[itemIndex].unit_price;

      // Recalcular totales
      this.recalculateCart(cartData);

      return {
        cart: cartData,
        message: 'Cantidad actualizada'
      };

    } catch (error) {
      logError('Error updating cart item:', error);
      throw error;
    }
  }

  /**
   * Remover producto del carrito
   */
  static async removeFromCart(cartData, productId) {
    try {
      const itemIndex = cartData.items.findIndex(item => item.product_id === productId);
      
      if (itemIndex === -1) {
        throw new Error('Producto no encontrado en el carrito');
      }

      cartData.items.splice(itemIndex, 1);

      // Recalcular totales
      this.recalculateCart(cartData);

      return {
        cart: cartData,
        message: 'Producto removido del carrito'
      };

    } catch (error) {
      logError('Error removing from cart:', error);
      throw error;
    }
  }

  /**
   * Aplicar descuento al carrito
   */
  static async applyDiscount(cartData, discountData) {
    try {
      const { type, value, applies_to = 'total' } = discountData;

      if (type === 'percentage') {
        if (applies_to === 'total') {
          cartData.discount_amount = cartData.subtotal * (value / 100);
        } else {
          // Aplicar descuento a productos específicos
          cartData.items.forEach(item => {
            if (applies_to === 'all' || applies_to.includes(item.product_id)) {
              item.discount_amount = item.total * (value / 100);
            }
          });
        }
      } else if (type === 'fixed') {
        cartData.discount_amount = Math.min(value, cartData.subtotal);
      }

      // Recalcular totales
      this.recalculateCart(cartData);

      return {
        cart: cartData,
        message: 'Descuento aplicado'
      };

    } catch (error) {
      logError('Error applying discount:', error);
      throw error;
    }
  }

  /**
   * Recalcular totales del carrito
   */
  static recalculateCart(cartData) {
    try {
      let subtotal = 0;
      let totalTax = 0;
      let totalDiscount = cartData.discount_amount || 0;

      // Calcular subtotal y impuestos por item
      cartData.items.forEach(item => {
        const itemSubtotal = item.quantity * item.unit_price;
        const itemDiscount = item.discount_amount || 0;
        const taxableAmount = itemSubtotal - itemDiscount;
        const itemTax = taxableAmount * (item.tax_rate / 100);

        item.tax_amount = itemTax;
        item.total = itemSubtotal - itemDiscount + itemTax;

        subtotal += itemSubtotal;
        totalTax += itemTax;
        totalDiscount += itemDiscount;
      });

      cartData.subtotal = subtotal;
      cartData.tax_amount = totalTax;
      cartData.discount_amount = totalDiscount;
      cartData.total = subtotal - totalDiscount + totalTax;

      // Asegurar que el total no sea negativo
      cartData.total = Math.max(0, cartData.total);

    } catch (error) {
      logError('Error recalculating cart:', error);
      throw error;
    }
  }

  // ===================================================================
  // PROCESAMIENTO DE VENTAS
  // ===================================================================

  /**
   * Procesar venta desde carrito
   */
  static async processSale(cartData, saleDetails) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const {
        customer_id = null,
        cashier_id,
        payments = [],
        notes = '',
        invoice_required = false
      } = saleDetails;

      // Validaciones previas
      if (!cartData.items || cartData.items.length === 0) {
        throw new Error('El carrito está vacío');
      }

      if (!payments || payments.length === 0) {
        throw new Error('Debe especificar al menos un método de pago');
      }

      // Validar que el total de pagos sea correcto
      const totalPayments = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      if (Math.abs(totalPayments - cartData.total) > 0.01) {
        throw new Error('El total de pagos no coincide con el total de la venta');
      }

      // Validar stock una vez más antes de procesar
      const stockValidation = await Sale.validateStock(cartData.items, cartData.store_id);
      if (!stockValidation.valid) {
        const invalidItems = stockValidation.items.filter(item => !item.available);
        throw new Error(`Stock insuficiente para: ${invalidItems.map(item => item.product_name || item.product_id).join(', ')}`);
      }

      // Crear la venta
      const saleData = {
        store_id: cartData.store_id,
        customer_id,
        cashier_id,
        items: cartData.items,
        payments,
        subtotal: cartData.subtotal,
        tax_amount: cartData.tax_amount,
        discount_amount: cartData.discount_amount,
        total: cartData.total,
        notes,
        invoice_required
      };

      const saleResult = await Sale.create(saleData);

      await connection.commit();

      logInfo(`POS sale processed successfully: ${saleResult.sale_number}`);

      return {
        sale_id: saleResult.id,
        sale_number: saleResult.sale_number,
        total: cartData.total,
        change: totalPayments - cartData.total,
        message: 'Venta procesada exitosamente'
      };

    } catch (error) {
      await connection.rollback();
      logError('Error processing POS sale:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Procesar venta rápida (un solo producto)
   */
  static async processQuickSale(saleData) {
    try {
      const {
        product_id,
        quantity = 1,
        customer_id = null,
        cashier_id,
        payment_method_id,
        payment_amount,
        store_id = 1
      } = saleData;

      // Obtener producto
      const product = await Product.getById(product_id, store_id);
      if (!product) {
        throw new Error('Producto no encontrado');
      }

      // Verificar stock
      const stockCheck = await Product.checkStock(product_id, quantity, store_id);
      if (!stockCheck.available) {
        throw new Error(stockCheck.message);
      }

      // Calcular totales
      const unitPrice = parseFloat(product.sale_price);
      const subtotal = unitPrice * quantity;
      const taxRate = parseFloat(product.tax_rate) || 0;
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;

      // Validar pago
      if (payment_amount < total) {
        throw new Error('El monto del pago es insuficiente');
      }

      // Crear venta
      const quickSaleData = {
        store_id,
        customer_id,
        cashier_id,
        items: [{
          product_id,
          quantity,
          unit_price: unitPrice,
          tax_rate: taxRate
        }],
        payments: [{
          payment_method_id,
          amount: payment_amount
        }],
        subtotal,
        tax_amount: taxAmount,
        discount_amount: 0,
        total
      };

      const result = await Sale.create(quickSaleData);

      return {
        ...result,
        total,
        change: payment_amount - total
      };

    } catch (error) {
      logError('Error processing quick sale:', error);
      throw error;
    }
  }

  // ===================================================================
  // GESTIÓN DE SESIONES DE CAJA
  // ===================================================================

  /**
   * Abrir sesión de caja
   */
  static async openCashSession(sessionData) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const {
        cashier_id,
        store_id = 1,
        register_id = 1,
        opening_balance = 0,
        notes = ''
      } = sessionData;

      // Verificar que no haya sesión abierta para este cajero
      const [existingSession] = await connection.execute(
        `SELECT id FROM cash_sessions 
         WHERE cashier_id = ? AND status = 'open'`,
        [cashier_id]
      );

      if (existingSession.length > 0) {
        throw new Error('Ya tienes una sesión de caja abierta');
      }

      // Crear nueva sesión
      const sessionQuery = `
        INSERT INTO cash_sessions (
          cashier_id, store_id, register_id, opening_balance,
          current_balance, status, notes, opened_at
        ) VALUES (?, ?, ?, ?, ?, 'open', ?, NOW())
      `;

      const [result] = await connection.execute(sessionQuery, [
        cashier_id, store_id, register_id, opening_balance,
        opening_balance, notes
      ]);

      await connection.commit();

      logInfo(`Cash session opened: ${result.insertId} by user ${cashier_id}`);

      return {
        session_id: result.insertId,
        opening_balance,
        message: 'Sesión de caja abierta exitosamente'
      };

    } catch (error) {
      await connection.rollback();
      logError('Error opening cash session:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Cerrar sesión de caja
   */
  static async closeCashSession(sessionData) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const {
        session_id,
        closing_balance,
        cash_counted,
        notes = ''
      } = sessionData;

      // Verificar que la sesión existe y está abierta
      const [session] = await connection.execute(
        `SELECT * FROM cash_sessions 
         WHERE id = ? AND status = 'open'`,
        [session_id]
      );

      if (!session[0]) {
        throw new Error('Sesión de caja no encontrada o ya está cerrada');
      }

      // Calcular ventas de la sesión
      const [salesSummary] = await connection.execute(
        `SELECT 
           COUNT(*) as total_sales,
           COALESCE(SUM(total), 0) as total_revenue,
           COALESCE(SUM(CASE WHEN pm.name = 'Efectivo' THEN p.amount ELSE 0 END), 0) as cash_sales
         FROM sales s
         LEFT JOIN payments p ON p.reference_type = 'sale' AND p.reference_id = s.id
         LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
         WHERE s.cashier_id = ? AND s.created_at >= ?`,
        [session[0].cashier_id, session[0].opened_at]
      );

      const expectedBalance = session[0].opening_balance + salesSummary[0].cash_sales;
      const difference = cash_counted - expectedBalance;

      // Actualizar sesión
      const updateQuery = `
        UPDATE cash_sessions SET 
          closing_balance = ?,
          cash_counted = ?,
          expected_balance = ?,
          difference = ?,
          total_sales = ?,
          total_revenue = ?,
          status = 'closed',
          notes = ?,
          closed_at = NOW()
        WHERE id = ?
      `;

      await connection.execute(updateQuery, [
        closing_balance, cash_counted, expectedBalance, difference,
        salesSummary[0].total_sales, salesSummary[0].total_revenue,
        notes, session_id
      ]);

      await connection.commit();

      logInfo(`Cash session closed: ${session_id} - Difference: ${difference}`);

      return {
        session_id,
        opening_balance: session[0].opening_balance,
        expected_balance: expectedBalance,
        cash_counted,
        difference,
        total_sales: salesSummary[0].total_sales,
        total_revenue: salesSummary[0].total_revenue,
        message: 'Sesión de caja cerrada exitosamente'
      };

    } catch (error) {
      await connection.rollback();
      logError('Error closing cash session:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // ===================================================================
  // BÚSQUEDA Y AUTOCOMPLETADO
  // ===================================================================

  /**
   * Buscar productos para POS
   */
  static async searchProducts(searchTerm, storeId = 1, limit = 20) {
    try {
      const query = `
        SELECT 
          p.id,
          p.name,
          p.code,
          p.barcode,
          p.unit,
          c.name as category_name,
          COALESCE(SUM(s.quantity), 0) as stock,
          pp.price as sale_price,
          t.rate as tax_rate
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN stock s ON p.id = s.product_id AND s.store_id = ?
        LEFT JOIN product_prices pp ON p.id = pp.product_id 
          AND pp.price_type = 'sale' AND pp.store_id = ?
        LEFT JOIN taxes t ON p.tax_id = t.id
        WHERE p.status = 'active' 
          AND p.deleted_at IS NULL
          AND (
            p.name LIKE ? OR 
            p.code LIKE ? OR 
            p.barcode LIKE ?
          )
        GROUP BY p.id
        ORDER BY 
          CASE 
            WHEN p.code = ? THEN 1
            WHEN p.barcode = ? THEN 2
            WHEN p.name LIKE ? THEN 3
            ELSE 4
          END,
          p.name ASC
        LIMIT ?
      `;

      const searchPattern = `%${searchTerm}%`;
      const exactPattern = searchTerm;

      const [products] = await db.execute(query, [
        storeId, storeId,
        searchPattern, searchPattern, searchPattern,
        exactPattern, exactPattern, `${exactPattern}%`,
        limit
      ]);

      return products;

    } catch (error) {
      logError('Error searching products:', error);
      throw error;
    }
  }

  /**
   * Obtener producto por código de barras para POS
   */
  static async getProductByBarcode(barcode, storeId = 1) {
    try {
      const query = `
        SELECT 
          p.*,
          c.name as category_name,
          COALESCE(SUM(s.quantity), 0) as stock,
          pp.price as sale_price,
          t.rate as tax_rate
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN stock s ON p.id = s.product_id AND s.store_id = ?
        LEFT JOIN product_prices pp ON p.id = pp.product_id 
          AND pp.price_type = 'sale' AND pp.store_id = ?
        LEFT JOIN taxes t ON p.tax_id = t.id
        WHERE p.barcode = ? 
          AND p.status = 'active' 
          AND p.deleted_at IS NULL
        GROUP BY p.id
      `;

      const [products] = await db.execute(query, [storeId, storeId, barcode]);
      return products[0] || null;

    } catch (error) {
      logError('Error getting product by barcode:', error);
      throw error;
    }
  }

  // ===================================================================
  // MÉTODOS DE PAGO
  // ===================================================================

  /**
   * Obtener métodos de pago disponibles
   */
  static async getPaymentMethods(storeId = 1) {
    try {
      const query = `
        SELECT 
          pm.*,
          CASE WHEN spm.store_id IS NOT NULL THEN true ELSE false END as enabled
        FROM payment_methods pm
        LEFT JOIN store_payment_methods spm ON pm.id = spm.payment_method_id AND spm.store_id = ?
        WHERE pm.is_active = true
        ORDER BY pm.sort_order, pm.name
      `;

      const [methods] = await db.execute(query, [storeId]);
      return methods.filter(method => method.enabled);

    } catch (error) {
      logError('Error getting payment methods:', error);
      throw error;
    }
  }

  /**
   * Procesar pago con tarjeta (simulado)
   */
  static async processCardPayment(paymentData) {
    try {
      const {
        amount,
        card_number,
        expiry_month,
        expiry_year,
        cvv,
        cardholder_name
      } = paymentData;

      // Simulación de procesamiento de tarjeta
      // En producción, aquí se integraría con un procesador de pagos real
      
      const isApproved = Math.random() > 0.1; // 90% de éxito simulado
      
      if (!isApproved) {
        throw new Error('Pago con tarjeta rechazado');
      }

      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        approved: true,
        transaction_id: transactionId,
        authorization_code: Math.random().toString(36).substr(2, 8).toUpperCase(),
        amount,
        message: 'Pago aprobado'
      };

    } catch (error) {
      logError('Error processing card payment:', error);
      throw error;
    }
  }

  // ===================================================================
  // REPORTES POS
  // ===================================================================

  /**
   * Obtener resumen diario de POS
   */
  static async getDailySummary(storeId = 1, date = null) {
    try {
      const targetDate = date || new Date().toISOString().slice(0, 10);

      const query = `
        SELECT 
          COUNT(DISTINCT s.id) as total_sales,
          COUNT(DISTINCT s.cashier_id) as active_cashiers,
          SUM(s.total) as total_revenue,
          SUM(s.tax_amount) as total_taxes,
          SUM(s.discount_amount) as total_discounts,
          AVG(s.total) as average_sale,
          MAX(s.total) as highest_sale,
          SUM(CASE WHEN pm.name = 'Efectivo' THEN p.amount ELSE 0 END) as cash_sales,
          SUM(CASE WHEN pm.name != 'Efectivo' THEN p.amount ELSE 0 END) as card_sales
        FROM sales s
        LEFT JOIN payments p ON p.reference_type = 'sale' AND p.reference_id = s.id
        LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
        WHERE s.store_id = ? 
          AND DATE(s.created_at) = ?
          AND s.status = 'completed'
      `;

      const [summary] = await db.execute(query, [storeId, targetDate]);

      // Obtener ventas por hora
      const hourlyQuery = `
        SELECT 
          HOUR(created_at) as hour,
          COUNT(*) as sales_count,
          SUM(total) as hourly_revenue
        FROM sales
        WHERE store_id = ? 
          AND DATE(created_at) = ?
          AND status = 'completed'
        GROUP BY HOUR(created_at)
        ORDER BY hour
      `;

      const [hourlySales] = await db.execute(hourlyQuery, [storeId, targetDate]);

      return {
        summary: summary[0],
        hourly_sales: hourlySales
      };

    } catch (error) {
      logError('Error getting daily summary:', error);
      throw error;
    }
  }

  /**
   * Obtener sesiones de caja del día
   */
  static async getDailyCashSessions(storeId = 1, date = null) {
    try {
      const targetDate = date || new Date().toISOString().slice(0, 10);

      const query = `
        SELECT 
          cs.*,
          u.name as cashier_name,
          r.name as register_name
        FROM cash_sessions cs
        LEFT JOIN users u ON cs.cashier_id = u.id
        LEFT JOIN registers r ON cs.register_id = r.id
        WHERE cs.store_id = ?
          AND DATE(cs.opened_at) = ?
        ORDER BY cs.opened_at DESC
      `;

      const [sessions] = await db.execute(query, [storeId, targetDate]);
      return sessions;

    } catch (error) {
      logError('Error getting daily cash sessions:', error);
      throw error;
    }
  }
}

module.exports = POSService;