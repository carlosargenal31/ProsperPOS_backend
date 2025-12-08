// ===================================================================
// PROSPERPOS - MODELO DE VENTAS
// ===================================================================

const db = require('../utils/database');
const { logError } = require('../utils/logger');

class Sale {
  
  /**
   * Obtener todas las ventas
   */
  static async getAll(filters = {}) {
    try {
      const { 
        search = '', 
        status = null, 
        date_from = null,
        date_to = null,
        customer_id = null,
        user_id = null,
        page = 1, 
        limit = 50 
      } = filters;
      
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE s.deleted_at IS NULL';
      const params = [];

      if (search) {
        whereClause += ' AND (s.invoice_number LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (status !== null) {
        whereClause += ' AND s.status = ?';
        params.push(status);
      }

      if (date_from) {
        whereClause += ' AND DATE(s.created_at) >= ?';
        params.push(date_from);
      }

      if (date_to) {
        whereClause += ' AND DATE(s.created_at) <= ?';
        params.push(date_to);
      }

      if (customer_id) {
        whereClause += ' AND s.customer_id = ?';
        params.push(customer_id);
      }

      if (user_id) {
        whereClause += ' AND s.user_id = ?';
        params.push(user_id);
      }

      const query = `
        SELECT 
          s.*,
          c.first_name as customer_first_name,
          c.last_name as customer_last_name,
          u.first_name as user_first_name,
          u.last_name as user_last_name,
          (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as items_count
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN users u ON s.user_id = u.id
        ${whereClause}
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?
      `;

      params.push(parseInt(limit), offset);
      const [sales] = await db.execute(query, params);
      
      // Contar total
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        ${whereClause}
      `;
      const [countResult] = await db.execute(countQuery, params.slice(0, -2));
      
      return {
        sales,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      };

    } catch (error) {
      logError('Error getting sales:', error);
      throw error;
    }
  }

  /**
   * Obtener venta por ID con items
   */
  static async getById(id) {
    try {
      const query = `
        SELECT 
          s.*,
          c.first_name as customer_first_name,
          c.last_name as customer_last_name,
          c.email as customer_email,
          c.phone as customer_phone,
          u.first_name as user_first_name,
          u.last_name as user_last_name,
          pm.name as payment_method_name
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN payment_methods pm ON s.payment_method_id = pm.id
        WHERE s.id = ? AND s.deleted_at IS NULL
      `;

      const [rows] = await db.execute(query, [id]);
      
      if (rows.length === 0) {
        return null;
      }

      const sale = rows[0];

      // Obtener items de la venta
      const itemsQuery = `
        SELECT 
          si.*,
          p.name as product_name,
          p.sku as product_sku
        FROM sale_items si
        LEFT JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
        ORDER BY si.id ASC
      `;

      const [items] = await db.execute(itemsQuery, [id]);
      sale.items = items;

      return sale;

    } catch (error) {
      logError('Error getting sale by ID:', error);
      throw error;
    }
  }

  /**
   * Crear nueva venta con items
   */
  static async create(saleData) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const {
        customer_id,
        user_id,
        store_id,
        payment_method_id,
        subtotal,
        tax_amount,
        discount_amount = 0,
        total,
        payment_amount,
        change_amount = 0,
        notes,
        items, // Array de items
        created_by
      } = saleData;

      // Generar número de factura
      const invoiceNumber = await this.generateInvoiceNumber(connection);

      // Insertar venta
      const saleQuery = `
        INSERT INTO sales (
          invoice_number, customer_id, user_id, store_id,
          payment_method_id, subtotal, tax_amount, discount_amount,
          total, payment_amount, change_amount, notes,
          status, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, NOW())
      `;

      const [saleResult] = await connection.execute(saleQuery, [
        invoiceNumber, customer_id, user_id, store_id,
        payment_method_id, subtotal, tax_amount, discount_amount,
        total, payment_amount, change_amount, notes, created_by
      ]);

      const saleId = saleResult.insertId;

      // Insertar items y actualizar stock
      for (const item of items) {
        // Insertar item
        const itemQuery = `
          INSERT INTO sale_items (
            sale_id, product_id, quantity, unit_price,
            subtotal, tax_amount, discount_amount, total,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        await connection.execute(itemQuery, [
          saleId,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.subtotal,
          item.tax_amount || 0,
          item.discount_amount || 0,
          item.total
        ]);

        // Actualizar stock
        await connection.execute(
          'UPDATE stock SET quantity = quantity - ? WHERE product_id = ? AND store_id = ?',
          [item.quantity, item.product_id, store_id]
        );

        // Registrar movimiento de stock
        await connection.execute(`
          INSERT INTO stock_movements (
            product_id, store_id, movement_type, quantity,
            reference_type, reference_id, notes, created_by, created_at
          ) VALUES (?, ?, 'sale', ?, 'sale', ?, 'Venta', ?, NOW())
        `, [item.product_id, store_id, -item.quantity, saleId, created_by]);
      }

      await connection.commit();

      return {
        id: saleId,
        invoice_number: invoiceNumber,
        message: 'Venta creada exitosamente'
      };

    } catch (error) {
      await connection.rollback();
      logError('Error creating sale:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Generar número de factura único
   */
  static async generateInvoiceNumber(connection = db) {
    try {
      const prefix = 'INV';
      const year = new Date().getFullYear();
      
      const [result] = await connection.execute(
        `SELECT invoice_number FROM sales 
         WHERE invoice_number LIKE ? 
         ORDER BY id DESC LIMIT 1`,
        [`${prefix}${year}%`]
      );

      let nextNumber = 1;
      if (result.length > 0) {
        const lastNumber = parseInt(result[0].invoice_number.slice(-6));
        nextNumber = lastNumber + 1;
      }

      return `${prefix}${year}${nextNumber.toString().padStart(6, '0')}`;

    } catch (error) {
      logError('Error generating invoice number:', error);
      throw error;
    }
  }

  /**
   * Anular venta
   */
  static async cancel(id, reason, cancelled_by) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Verificar que existe y está completada
      const [sale] = await connection.execute(
        'SELECT * FROM sales WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (sale.length === 0) {
        throw new Error('Venta no encontrada');
      }

      if (sale[0].status === 'cancelled') {
        throw new Error('La venta ya está anulada');
      }

      // Obtener items para devolver stock
      const [items] = await connection.execute(
        'SELECT * FROM sale_items WHERE sale_id = ?',
        [id]
      );

      // Devolver stock
      for (const item of items) {
        await connection.execute(
          'UPDATE stock SET quantity = quantity + ? WHERE product_id = ? AND store_id = ?',
          [item.quantity, item.product_id, sale[0].store_id]
        );

        // Registrar movimiento
        await connection.execute(`
          INSERT INTO stock_movements (
            product_id, store_id, movement_type, quantity,
            reference_type, reference_id, notes, created_by, created_at
          ) VALUES (?, ?, 'sale_cancel', ?, 'sale', ?, ?, ?, NOW())
        `, [item.product_id, sale[0].store_id, item.quantity, id, reason, cancelled_by]);
      }

      // Actualizar venta
      await connection.execute(
        'UPDATE sales SET status = ?, cancelled_at = NOW(), cancelled_by = ?, cancellation_reason = ? WHERE id = ?',
        ['cancelled', cancelled_by, reason, id]
      );

      await connection.commit();

      return { message: 'Venta anulada exitosamente' };

    } catch (error) {
      await connection.rollback();
      logError('Error cancelling sale:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener ventas del día
   */
  static async getTodaySales(store_id) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_sales,
          COALESCE(SUM(total), 0) as total_amount,
          COALESCE(SUM(tax_amount), 0) as total_tax,
          COALESCE(AVG(total), 0) as average_sale
        FROM sales
        WHERE DATE(created_at) = CURDATE()
          AND store_id = ?
          AND status = 'completed'
          AND deleted_at IS NULL
      `;

      const [result] = await db.execute(query, [store_id]);
      return result[0];

    } catch (error) {
      logError('Error getting today sales:', error);
      throw error;
    }
  }

  /**
   * Obtener ventas por rango de fechas
   */
  static async getSalesByDateRange(date_from, date_to, store_id) {
    try {
      const query = `
        SELECT 
          DATE(created_at) as sale_date,
          COUNT(*) as total_sales,
          COALESCE(SUM(total), 0) as total_amount
        FROM sales
        WHERE DATE(created_at) BETWEEN ? AND ?
          AND store_id = ?
          AND status = 'completed'
          AND deleted_at IS NULL
        GROUP BY DATE(created_at)
        ORDER BY sale_date ASC
      `;

      const [result] = await db.execute(query, [date_from, date_to, store_id]);
      return result;

    } catch (error) {
      logError('Error getting sales by date range:', error);
      throw error;
    }
  }
}

module.exports = Sale;