/**
 * Invoice Model
 * Handles all database operations for invoices, invoice items, and payments
 */

const db = require('../utils/database');
const logger = require('../utils/logger');

class Invoice {
  /**
   * Get all invoices with filters and pagination
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Object>} Paginated invoice list
   */
  static async getAll(filters = {}) {
    try {
      const {
        search = '',
        customer_id,
        payment_status,
        status,
        invoice_type,
        date_from,
        date_to,
        warehouse_id,
        page = 1,
        limit = 50
      } = filters;

      const offset = (page - 1) * limit;
      let whereConditions = ['i.deleted_at IS NULL'];
      const params = [];

      // Search filter
      if (search) {
        whereConditions.push(`(
          i.invoice_number LIKE ? OR
          i.customer_name LIKE ? OR
          i.customer_rtn LIKE ? OR
          i.notes LIKE ?
        )`);
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam, searchParam);
      }

      // Customer filter
      if (customer_id) {
        whereConditions.push('i.customer_id = ?');
        params.push(customer_id);
      }

      // Payment status filter
      if (payment_status) {
        whereConditions.push('i.payment_status = ?');
        params.push(payment_status);
      }

      // Status filter
      if (status) {
        whereConditions.push('i.status = ?');
        params.push(status);
      }

      // Invoice type filter
      if (invoice_type) {
        whereConditions.push('i.invoice_type = ?');
        params.push(invoice_type);
      }

      // Warehouse filter
      if (warehouse_id) {
        whereConditions.push('i.warehouse_id = ?');
        params.push(warehouse_id);
      }

      // Date range filter
      if (date_from) {
        whereConditions.push('DATE(i.issue_date) >= ?');
        params.push(date_from);
      }

      if (date_to) {
        whereConditions.push('DATE(i.issue_date) <= ?');
        params.push(date_to);
      }

      const whereClause = whereConditions.join(' AND ');

      // Count total records
      const [countResult] = await db.query(
        `SELECT COUNT(*) as total FROM invoices i WHERE ${whereClause}`,
        params
      );
      const totalRecords = countResult[0].total;

      // Get paginated data with related information
      const query = `
        SELECT
          i.*,
          c.name as customer_full_name,
          c.email as customer_email_db,
          w.name as warehouse_name,
          u.username as created_by_username,
          COUNT(DISTINCT ii.id) as item_count,
          COUNT(DISTINCT ip.id) as payment_count,
          DATEDIFF(CURDATE(), i.due_date) as days_overdue
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        LEFT JOIN warehouses w ON i.warehouse_id = w.id
        LEFT JOIN users u ON i.created_by = u.id
        LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
        LEFT JOIN invoice_payments ip ON i.id = ip.invoice_id AND ip.deleted_at IS NULL
        WHERE ${whereClause}
        GROUP BY i.id
        ORDER BY i.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const [invoices] = await db.query(query, [...params, parseInt(limit), parseInt(offset)]);

      return {
        data: invoices,
        pagination: {
          currentPage: parseInt(page),
          perPage: parseInt(limit),
          totalRecords,
          totalPages: Math.ceil(totalRecords / limit),
          hasNextPage: page * limit < totalRecords,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      logger.error('Error in Invoice.getAll:', error);
      throw error;
    }
  }

  /**
   * Get invoice by ID with all related data
   * @param {number} id - Invoice ID
   * @returns {Promise<Object>} Invoice with items and payments
   */
  static async getById(id) {
    try {
      // Get invoice header
      const [invoices] = await db.query(
        `SELECT
          i.*,
          c.name as customer_full_name,
          c.email as customer_email_db,
          c.phone as customer_phone_db,
          c.address as customer_address_db,
          w.name as warehouse_name,
          w.address as warehouse_address,
          u.username as created_by_username,
          uu.username as updated_by_username
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        LEFT JOIN warehouses w ON i.warehouse_id = w.id
        LEFT JOIN users u ON i.created_by = u.id
        LEFT JOIN users uu ON i.updated_by = uu.id
        WHERE i.id = ? AND i.deleted_at IS NULL`,
        [id]
      );

      if (invoices.length === 0) {
        return null;
      }

      const invoice = invoices[0];

      // Get invoice items
      const [items] = await db.query(
        `SELECT
          ii.*,
          p.name as product_full_name,
          p.image as product_image,
          p.unit as product_unit
        FROM invoice_items ii
        LEFT JOIN products p ON ii.product_id = p.id
        WHERE ii.invoice_id = ?
        ORDER BY ii.id`,
        [id]
      );

      // Get payments
      const [payments] = await db.query(
        `SELECT
          ip.*,
          u.username as created_by_username
        FROM invoice_payments ip
        LEFT JOIN users u ON ip.created_by = u.id
        WHERE ip.invoice_id = ? AND ip.deleted_at IS NULL
        ORDER BY ip.payment_date DESC`,
        [id]
      );

      // Get credit notes if any
      const [creditNotes] = await db.query(
        `SELECT
          cn.*,
          u.username as created_by_username
        FROM credit_notes cn
        LEFT JOIN users u ON cn.created_by = u.id
        WHERE cn.invoice_id = ? AND cn.deleted_at IS NULL
        ORDER BY cn.created_at DESC`,
        [id]
      );

      return {
        ...invoice,
        items,
        payments,
        credit_notes: creditNotes
      };
    } catch (error) {
      logger.error('Error in Invoice.getById:', error);
      throw error;
    }
  }

  /**
   * Create a new invoice
   * @param {Object} invoiceData - Invoice data
   * @param {Array} items - Invoice items
   * @returns {Promise<Object>} Created invoice
   */
  static async create(invoiceData, items = []) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Use invoice_number from frontend if provided, otherwise generate one
      const invoiceNumber = invoiceData.invoice_number || await this.generateInvoiceNumber(connection);

      // Calculate totals
      const totals = this.calculateTotals(items, invoiceData.discount_type, invoiceData.discount_value);

      // Get active resolution with its number
      const [resolutions] = await connection.query(
        'SELECT id, numero_resolucion FROM resolutions WHERE is_active = 1 LIMIT 1'
      );
      const resolutionId = resolutions.length > 0 ? resolutions[0].id : null;
      const resolutionNumber = resolutions.length > 0 ? resolutions[0].numero_resolucion : null;

      // Insert invoice
      const [result] = await connection.query(
        `INSERT INTO invoices (
          invoice_number,
          invoice_type,
          customer_id,
          customer_name,
          customer_rtn,
          issue_date,
          warehouse_id,
          seller_id,
          seller_name,
          subtotal,
          discount_type,
          discount_value,
          discount_amount,
          tax_rate,
          tax_amount,
          shipping_cost,
          total,
          payment_status,
          paid_amount,
          balance_due,
          is_credit,
          payment_terms_days,
          resolution_id,
          resolution_number,
          status,
          created_by,
          updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceNumber,
          invoiceData.invoice_type || 'factura',
          invoiceData.customer_id || null,
          invoiceData.customer_name,
          invoiceData.customer_rtn || null,
          invoiceData.issue_date || new Date(),
          invoiceData.warehouse_id || null,
          invoiceData.seller_id || null,
          invoiceData.seller_name || null,
          totals.subtotal,
          invoiceData.discount_type || null,
          invoiceData.discount_value || 0,
          totals.discount_amount,
          invoiceData.tax_rate || 15.00,
          totals.tax_amount,
          invoiceData.shipping_cost || 0,
          totals.total,
          invoiceData.payment_status || 'pending',
          invoiceData.paid_amount || 0,
          totals.total - (invoiceData.paid_amount || 0),
          invoiceData.is_credit || 0,
          invoiceData.payment_terms_days || 0,
          resolutionId,
          resolutionNumber,
          invoiceData.status || 'issued',
          invoiceData.created_by,
          invoiceData.updated_by
        ]
      );

      const invoiceId = result.insertId;

      // Insert invoice items
      if (items && items.length > 0) {
        for (const item of items) {
          const itemTotals = this.calculateItemTotals(
            item.quantity,
            item.unit_price,
            item.discount_type,
            item.discount_value,
            item.tax_rate || invoiceData.tax_rate || 15.00
          );

          await connection.query(
            `INSERT INTO invoice_items (
              invoice_id,
              product_id,
              product_name,
              product_sku,
              quantity,
              unit_price,
              discount_type,
              discount_value,
              discount_amount,
              tax_rate,
              tax_amount,
              subtotal,
              line_total,
              notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              invoiceId,
              item.product_id || null,
              item.product_name,
              item.product_sku || null,
              item.quantity,
              item.unit_price,
              item.discount_type || null,
              item.discount_value || 0,
              itemTotals.discount_amount,
              item.tax_rate || invoiceData.tax_rate || 15.00,
              itemTotals.tax_amount,
              itemTotals.subtotal,
              itemTotals.line_total,
              item.notes || null
            ]
          );
        }
      }

      // If linked to a sale, update sale record
      if (invoiceData.sale_id) {
        await connection.query(
          'UPDATE sales SET invoice_id = ? WHERE id = ?',
          [invoiceId, invoiceData.sale_id]
        );
      }

      await connection.commit();

      return {
        id: invoiceId,
        invoice_number: invoiceNumber,
        message: 'Factura creada exitosamente'
      };
    } catch (error) {
      await connection.rollback();
      logger.error('Error in Invoice.create:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Update an invoice
   * @param {number} id - Invoice ID
   * @param {Object} invoiceData - Updated data
   * @returns {Promise<Object>} Update result
   */
  static async update(id, invoiceData) {
    try {
      const updates = [];
      const params = [];

      // Build dynamic update query
      const allowedFields = [
        'customer_id', 'customer_name', 'customer_rtn', 'warehouse_id',
        'status', 'payment_status'
      ];

      allowedFields.forEach(field => {
        if (invoiceData[field] !== undefined) {
          updates.push(`${field} = ?`);
          params.push(invoiceData[field]);
        }
      });

      if (invoiceData.updated_by) {
        updates.push('updated_by = ?');
        params.push(invoiceData.updated_by);
      }

      if (updates.length === 0) {
        throw new Error('No hay datos para actualizar');
      }

      params.push(id);

      const [result] = await db.query(
        `UPDATE invoices SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
        params
      );

      if (result.affectedRows === 0) {
        throw new Error('Factura no encontrada');
      }

      return { message: 'Factura actualizada exitosamente' };
    } catch (error) {
      logger.error('Error in Invoice.update:', error);
      throw error;
    }
  }

  /**
   * Soft delete an invoice
   * @param {number} id - Invoice ID
   * @param {number} userId - User performing deletion
   * @returns {Promise<Object>} Delete result
   */
  static async delete(id, userId) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Check if invoice can be deleted (not paid or partially paid)
      const [invoice] = await connection.query(
        'SELECT payment_status, paid_amount FROM invoices WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (invoice.length === 0) {
        throw new Error('Factura no encontrada');
      }

      if (invoice[0].paid_amount > 0) {
        throw new Error('No se puede eliminar una factura con pagos registrados');
      }

      // Soft delete invoice
      await connection.query(
        'UPDATE invoices SET deleted_at = NOW(), updated_by = ? WHERE id = ?',
        [userId, id]
      );

      await connection.commit();

      return { message: 'Factura eliminada exitosamente' };
    } catch (error) {
      await connection.rollback();
      logger.error('Error in Invoice.delete:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Record a payment for an invoice
   * @param {number} invoiceId - Invoice ID
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>} Payment result
   */
  static async recordPayment(invoiceId, paymentData) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Get current invoice details
      const [invoice] = await connection.query(
        'SELECT total, paid_amount, balance_due FROM invoices WHERE id = ? AND deleted_at IS NULL',
        [invoiceId]
      );

      if (invoice.length === 0) {
        throw new Error('Factura no encontrada');
      }

      const { total, paid_amount, balance_due } = invoice[0];

      // Validate payment amount
      if (paymentData.amount <= 0) {
        throw new Error('El monto del pago debe ser mayor a 0');
      }

      if (paymentData.amount > balance_due) {
        throw new Error(`El monto del pago (${paymentData.amount}) excede el saldo pendiente (${balance_due})`);
      }

      // Insert payment record
      const [result] = await connection.query(
        `INSERT INTO invoice_payments (
          invoice_id,
          payment_date,
          amount,
          payment_method,
          reference_number,
          bank_account_id,
          notes,
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceId,
          paymentData.payment_date || new Date(),
          paymentData.amount,
          paymentData.payment_method,
          paymentData.reference_number || null,
          paymentData.bank_account_id || null,
          paymentData.notes || null,
          paymentData.created_by
        ]
      );

      // Update invoice payment status (will be handled by trigger, but we can do it explicitly too)
      const newPaidAmount = parseFloat(paid_amount) + parseFloat(paymentData.amount);
      const newBalance = parseFloat(total) - newPaidAmount;

      let newStatus = 'pending';
      if (newPaidAmount >= total) {
        newStatus = 'paid';
      } else if (newPaidAmount > 0) {
        newStatus = 'partial';
      }

      await connection.query(
        `UPDATE invoices
        SET paid_amount = ?, balance_due = ?, payment_status = ?
        WHERE id = ?`,
        [newPaidAmount, newBalance, newStatus, invoiceId]
      );

      await connection.commit();

      return {
        payment_id: result.insertId,
        new_balance: newBalance,
        payment_status: newStatus,
        message: 'Pago registrado exitosamente'
      };
    } catch (error) {
      await connection.rollback();
      logger.error('Error in Invoice.recordPayment:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get invoice statistics
   * @param {Object} filters - Date range and other filters
   * @returns {Promise<Object>} Statistics
   */
  static async getStatistics(filters = {}) {
    try {
      const { date_from, date_to, warehouse_id } = filters;
      let whereConditions = ['deleted_at IS NULL'];
      const params = [];

      if (date_from) {
        whereConditions.push('DATE(issue_date) >= ?');
        params.push(date_from);
      }

      if (date_to) {
        whereConditions.push('DATE(issue_date) <= ?');
        params.push(date_to);
      }

      if (warehouse_id) {
        whereConditions.push('warehouse_id = ?');
        params.push(warehouse_id);
      }

      const whereClause = whereConditions.join(' AND ');

      const [stats] = await db.query(
        `SELECT
          COUNT(*) as total_invoices,
          SUM(total) as total_amount,
          SUM(paid_amount) as total_paid,
          SUM(balance_due) as total_outstanding,
          AVG(total) as average_invoice,
          SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_count,
          SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending_count,
          SUM(CASE WHEN payment_status = 'partial' THEN 1 ELSE 0 END) as partial_count,
          SUM(CASE WHEN payment_status = 'overdue' THEN 1 ELSE 0 END) as overdue_count
        FROM invoices
        WHERE ${whereClause}`,
        params
      );

      return stats[0];
    } catch (error) {
      logger.error('Error in Invoice.getStatistics:', error);
      throw error;
    }
  }

  /**
   * Get aging report
   * @returns {Promise<Array>} Aging buckets
   */
  static async getAgingReport() {
    try {
      const [report] = await db.query(`
        SELECT
          aging_bucket,
          COUNT(*) as invoice_count,
          SUM(balance_due) as total_outstanding
        FROM v_outstanding_invoices
        GROUP BY aging_bucket
        ORDER BY
          CASE aging_bucket
            WHEN 'current' THEN 1
            WHEN '1-30 days' THEN 2
            WHEN '31-60 days' THEN 3
            WHEN '61-90 days' THEN 4
            WHEN '90+ days' THEN 5
          END
      `);

      return report;
    } catch (error) {
      logger.error('Error in Invoice.getAgingReport:', error);
      throw error;
    }
  }

  /**
   * Generate unique invoice number
   * @param {Object} connection - Database connection
   * @returns {Promise<string>} Invoice number
   */
  static async generateInvoiceNumber(connection) {
    try {
      // Get settings
      const [settings] = await connection.query(
        'SELECT invoice_prefix, last_invoice_number, invoice_number_length FROM billing_settings LIMIT 1'
      );

      if (settings.length === 0) {
        throw new Error('Configuración de facturación no encontrada');
      }

      const { invoice_prefix, last_invoice_number, invoice_number_length } = settings[0];
      const nextNumber = last_invoice_number + 1;

      // Update last number
      await connection.query(
        'UPDATE billing_settings SET last_invoice_number = ? WHERE id = 1',
        [nextNumber]
      );

      // Format number with padding
      const paddedNumber = String(nextNumber).padStart(invoice_number_length, '0');
      return `${invoice_prefix}-${paddedNumber}`;
    } catch (error) {
      logger.error('Error generating invoice number:', error);
      throw error;
    }
  }

  /**
   * Calculate invoice totals
   * @param {Array} items - Invoice items
   * @param {string} discountType - 'percentage' or 'fixed'
   * @param {number} discountValue - Discount value
   * @returns {Object} Totals
   */
  static calculateTotals(items, discountType = null, discountValue = 0) {
    let subtotal = 0;
    let taxAmount = 0;

    items.forEach(item => {
      const itemTotals = this.calculateItemTotals(
        item.quantity,
        item.unit_price,
        item.discount_type,
        item.discount_value,
        item.tax_rate || 15.00
      );

      subtotal += itemTotals.subtotal;
      taxAmount += itemTotals.tax_amount;
    });

    // Calculate invoice-level discount
    let discountAmount = 0;
    if (discountType === 'percentage' && discountValue > 0) {
      discountAmount = (subtotal * discountValue) / 100;
    } else if (discountType === 'fixed' && discountValue > 0) {
      discountAmount = discountValue;
    }

    const subtotalAfterDiscount = subtotal - discountAmount;
    const total = subtotalAfterDiscount + taxAmount;

    return {
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      total
    };
  }

  /**
   * Calculate item totals
   * @param {number} quantity - Quantity
   * @param {number} unitPrice - Unit price
   * @param {string} discountType - Discount type
   * @param {number} discountValue - Discount value
   * @param {number} taxRate - Tax rate
   * @returns {Object} Item totals
   */
  static calculateItemTotals(quantity, unitPrice, discountType, discountValue, taxRate) {
    const lineSubtotal = quantity * unitPrice;

    let discountAmount = 0;
    if (discountType === 'percentage' && discountValue > 0) {
      discountAmount = (lineSubtotal * discountValue) / 100;
    } else if (discountType === 'fixed' && discountValue > 0) {
      discountAmount = discountValue;
    }

    const subtotal = lineSubtotal - discountAmount;
    const taxAmount = (subtotal * taxRate) / 100;
    const lineTotal = subtotal + taxAmount;

    return {
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      line_total: lineTotal
    };
  }
}

module.exports = Invoice;
