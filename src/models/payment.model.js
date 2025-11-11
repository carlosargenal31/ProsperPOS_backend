// ===================================================================
// PROSPERPOS - MODELO DE PAGOS
// ===================================================================

const db = require('../utils/database');
const { logError } = require('../utils/logger');

class Payment {
  
  /**
   * Obtener todos los pagos
   */
  static async getAll(filters = {}) {
    try {
      const { 
        search = '', 
        payment_method_id = null,
        date_from = null,
        date_to = null,
        page = 1, 
        limit = 50 
      } = filters;
      
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE p.deleted_at IS NULL';
      const params = [];

      if (search) {
        whereClause += ' AND (p.reference_number LIKE ? OR s.invoice_number LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
      }

      if (payment_method_id) {
        whereClause += ' AND p.payment_method_id = ?';
        params.push(payment_method_id);
      }

      if (date_from) {
        whereClause += ' AND DATE(p.created_at) >= ?';
        params.push(date_from);
      }

      if (date_to) {
        whereClause += ' AND DATE(p.created_at) <= ?';
        params.push(date_to);
      }

      const query = `
        SELECT 
          p.*,
          pm.name as payment_method_name,
          s.invoice_number,
          c.first_name as customer_first_name,
          c.last_name as customer_last_name
        FROM payments p
        LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
        LEFT JOIN sales s ON p.sale_id = s.id
        LEFT JOIN customers c ON s.customer_id = c.id
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `;

      params.push(parseInt(limit), offset);
      const [payments] = await db.execute(query, params);
      
      // Contar total
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM payments p
        LEFT JOIN sales s ON p.sale_id = s.id
        ${whereClause}
      `;
      const [countResult] = await db.execute(countQuery, params.slice(0, -2));
      
      return {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      };

    } catch (error) {
      logError('Error getting payments:', error);
      throw error;
    }
  }

  /**
   * Obtener pago por ID
   */
  static async getById(id) {
    try {
      const query = `
        SELECT 
          p.*,
          pm.name as payment_method_name,
          s.invoice_number,
          s.total as sale_total,
          c.first_name as customer_first_name,
          c.last_name as customer_last_name
        FROM payments p
        LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
        LEFT JOIN sales s ON p.sale_id = s.id
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE p.id = ? AND p.deleted_at IS NULL
      `;

      const [rows] = await db.execute(query, [id]);
      return rows[0] || null;

    } catch (error) {
      logError('Error getting payment by ID:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo pago
   */
  static async create(paymentData) {
    try {
      const {
        sale_id,
        payment_method_id,
        amount,
        reference_number,
        notes,
        status = 'completed',
        created_by
      } = paymentData;

      // Generar número de referencia si no existe
      const finalReferenceNumber = reference_number || await this.generateReferenceNumber();

      // Insertar pago
      const insertQuery = `
        INSERT INTO payments (
          sale_id, payment_method_id, amount, reference_number,
          notes, status, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const [result] = await db.execute(insertQuery, [
        sale_id, payment_method_id, amount, finalReferenceNumber,
        notes, status, created_by
      ]);

      return {
        id: result.insertId,
        reference_number: finalReferenceNumber,
        message: 'Pago registrado exitosamente'
      };

    } catch (error) {
      logError('Error creating payment:', error);
      throw error;
    }
  }

  /**
   * Generar número de referencia
   */
  static async generateReferenceNumber() {
    try {
      const prefix = 'PAY';
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      
      return `${prefix}${timestamp}${random}`;

    } catch (error) {
      logError('Error generating reference number:', error);
      throw error;
    }
  }

  /**
   * Obtener pagos de una venta
   */
  static async getBySaleId(sale_id) {
    try {
      const query = `
        SELECT 
          p.*,
          pm.name as payment_method_name
        FROM payments p
        LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
        WHERE p.sale_id = ? AND p.deleted_at IS NULL
        ORDER BY p.created_at ASC
      `;

      const [payments] = await db.execute(query, [sale_id]);
      return payments;

    } catch (error) {
      logError('Error getting payments by sale ID:', error);
      throw error;
    }
  }

  /**
   * Obtener métodos de pago activos
   */
  static async getPaymentMethods() {
    try {
      const query = `
        SELECT * FROM payment_methods 
        WHERE is_active = 1 AND deleted_at IS NULL
        ORDER BY name ASC
      `;

      const [methods] = await db.execute(query);
      return methods;

    } catch (error) {
      logError('Error getting payment methods:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen de pagos por método
   */
  static async getPaymentSummaryByMethod(date_from, date_to, store_id) {
    try {
      const query = `
        SELECT 
          pm.name as payment_method,
          COUNT(p.id) as total_payments,
          COALESCE(SUM(p.amount), 0) as total_amount
        FROM payment_methods pm
        LEFT JOIN payments p ON pm.id = p.payment_method_id
          AND DATE(p.created_at) BETWEEN ? AND ?
          AND p.status = 'completed'
          AND p.deleted_at IS NULL
        LEFT JOIN sales s ON p.sale_id = s.id AND s.store_id = ?
        WHERE pm.is_active = 1 AND pm.deleted_at IS NULL
        GROUP BY pm.id, pm.name
        ORDER BY total_amount DESC
      `;

      const [result] = await db.execute(query, [date_from, date_to, store_id]);
      return result;

    } catch (error) {
      logError('Error getting payment summary:', error);
      throw error;
    }
  }
}

module.exports = Payment;