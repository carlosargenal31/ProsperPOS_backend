/**
 * Billing Service
 * Business logic for invoice operations and billing workflows
 */

const Invoice = require('../models/invoice.model');
const db = require('../utils/database');
const logger = require('../utils/logger');

class BillingService {
  /**
   * Create invoice from POS sale
   * @param {number} saleId - Sale ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created invoice
   */
  static async createInvoiceFromSale(saleId, options = {}) {
    try {
      // Get sale details
      const [sales] = await db.query(
        `SELECT
          s.*,
          c.name as customer_name,
          c.rtn as customer_rtn,
          c.address as customer_address,
          c.phone as customer_phone,
          c.email as customer_email,
          pm.name as payment_method_name
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN payment_methods pm ON s.payment_method_id = pm.id
        WHERE s.id = ? AND s.deleted_at IS NULL`,
        [saleId]
      );

      if (sales.length === 0) {
        throw new Error('Venta no encontrada');
      }

      const sale = sales[0];

      // Check if invoice already exists
      if (sale.invoice_id) {
        throw new Error('Esta venta ya tiene una factura asociada');
      }

      // Get sale items
      const [saleItems] = await db.query(
        `SELECT
          si.*,
          p.name as product_name,
          p.sku as product_sku
        FROM sale_items si
        LEFT JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?`,
        [saleId]
      );

      // Transform sale items to invoice items
      const invoiceItems = saleItems.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_type: item.discount_type,
        discount_value: item.discount,
        tax_rate: item.tax_rate || 15.00
      }));

      // Prepare invoice data
      const invoiceData = {
        invoice_type: options.invoice_type || 'factura',
        customer_id: sale.customer_id,
        customer_name: sale.customer_name || 'CONSUMIDOR FINAL',
        customer_rtn: sale.customer_rtn,
        issue_date: sale.sale_date || new Date(),
        warehouse_id: sale.warehouse_id || options.warehouse_id,
        tax_rate: sale.tax_rate || 15.00,
        shipping_cost: sale.shipping || 0,
        discount_type: sale.discount_type,
        discount_value: sale.discount,
        payment_status: sale.payment_status === 'paid' ? 'paid' : 'pending',
        paid_amount: sale.payment_status === 'paid' ? sale.grand_total : 0,
        is_credit: options.is_credit || 0,
        payment_terms_days: options.payment_terms_days || 0,
        status: 'issued',
        created_by: options.created_by || sale.created_by
      };

      // Create invoice
      const result = await Invoice.create(invoiceData, invoiceItems);

      return result;
    } catch (error) {
      logError('Error in BillingService.createInvoiceFromSale:', error);
      throw error;
    }
  }

  /**
   * Create standalone invoice (not from sale)
   * @param {Object} invoiceData - Invoice data
   * @param {Array} items - Invoice items
   * @returns {Promise<Object>} Created invoice
   */
  static async createStandaloneInvoice(invoiceData, items) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Validate customer
      if (!invoiceData.customer_name) {
        throw new Error('El nombre del cliente es requerido');
      }

      // Validate items
      if (!items || items.length === 0) {
        throw new Error('Debe incluir al menos un artículo');
      }

      // Validate quantities and prices
      items.forEach((item, index) => {
        if (!item.product_name) {
          throw new Error(`El artículo ${index + 1} debe tener un nombre`);
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new Error(`El artículo ${index + 1} debe tener una cantidad válida`);
        }
        if (!item.unit_price || item.unit_price <= 0) {
          throw new Error(`El artículo ${index + 1} debe tener un precio válido`);
        }
      });

      // Calculate totals to get the total amount
      const totals = Invoice.calculateTotals(items, invoiceData.discount_type, invoiceData.discount_value);

      // If invoice is marked as paid, set paid_amount to total
      if (invoiceData.payment_status === 'paid') {
        invoiceData.paid_amount = totals.total;
      }

      // Create invoice using existing model
      const result = await Invoice.create(invoiceData, items);

      // If invoice is paid and has a payment method, create payment record
      if (invoiceData.payment_status === 'paid' && invoiceData.payment_method) {
        await connection.query(
          `INSERT INTO invoice_payments (
            invoice_id,
            payment_date,
            amount,
            payment_method,
            created_by
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            result.id,
            invoiceData.issue_date || new Date(),
            totals.total,
            invoiceData.payment_method,
            invoiceData.created_by
          ]
        );
      }

      await connection.commit();

      return result;
    } catch (error) {
      await connection.rollback();
      logger.error('Error in BillingService.createStandaloneInvoice:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Process payment for invoice
   * @param {number} invoiceId - Invoice ID
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>} Payment result
   */
  static async processPayment(invoiceId, paymentData) {
    try {
      // Validate payment data
      if (!paymentData.amount || paymentData.amount <= 0) {
        throw new Error('El monto del pago debe ser mayor a 0');
      }

      if (!paymentData.payment_method) {
        throw new Error('El método de pago es requerido');
      }

      // Record payment
      const result = await Invoice.recordPayment(invoiceId, paymentData);

      return result;
    } catch (error) {
      logError('Error in BillingService.processPayment:', error);
      throw error;
    }
  }

  /**
   * Get dashboard statistics
   * @param {Object} filters - Date filters
   * @returns {Promise<Object>} Dashboard data
   */
  static async getDashboardStats(filters = {}) {
    try {
      // Get invoice statistics
      const stats = await Invoice.getStatistics(filters);

      // Get aging report
      const agingReport = await Invoice.getAgingReport();

      // Get recent invoices
      const recentInvoices = await Invoice.getAll({
        ...filters,
        limit: 10,
        page: 1
      });

      // Get top customers by outstanding balance
      const [topCustomers] = await db.query(`
        SELECT
          customer_name,
          SUM(balance_due) as total_outstanding,
          COUNT(*) as invoice_count
        FROM invoices
        WHERE payment_status IN ('pending', 'partial', 'overdue')
        AND deleted_at IS NULL
        GROUP BY customer_id, customer_name
        ORDER BY total_outstanding DESC
        LIMIT 10
      `);

      return {
        statistics: stats,
        aging_report: agingReport,
        recent_invoices: recentInvoices.data,
        top_customers: topCustomers
      };
    } catch (error) {
      logError('Error in BillingService.getDashboardStats:', error);
      throw error;
    }
  }

  /**
   * Check and update overdue invoices
   * @returns {Promise<Object>} Update result
   */
  static async updateOverdueInvoices() {
    try {
      const [result] = await db.query(`
        UPDATE invoices
        SET payment_status = 'overdue'
        WHERE payment_status IN ('pending', 'partial')
        AND due_date IS NOT NULL
        AND due_date < CURDATE()
        AND deleted_at IS NULL
      `);

      return {
        updated_count: result.affectedRows,
        message: `${result.affectedRows} facturas marcadas como vencidas`
      };
    } catch (error) {
      logError('Error in BillingService.updateOverdueInvoices:', error);
      throw error;
    }
  }

  /**
   * Get invoice for printing/PDF
   * @param {number} invoiceId - Invoice ID
   * @returns {Promise<Object>} Invoice with formatted data
   */
  static async getInvoiceForPrint(invoiceId) {
    try {
      const invoice = await Invoice.getById(invoiceId);

      if (!invoice) {
        throw new Error('Factura no encontrada');
      }

      // Get billing settings for company info
      const [settings] = await db.query(
        'SELECT * FROM billing_settings LIMIT 1'
      );

      const billingSettings = settings[0] || {};

      // Format data for printing
      return {
        invoice,
        company: {
          name: billingSettings.company_name || 'ProsperPOS',
          rtn: billingSettings.company_rtn,
          address: billingSettings.company_address,
          phone: billingSettings.company_phone,
          email: billingSettings.company_email,
          logo: billingSettings.company_logo
        },
        formatted_date: new Date(invoice.issue_date).toLocaleDateString('es-HN'),
        formatted_due_date: invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('es-HN') : 'N/A',
        formatted_total: this.formatCurrency(invoice.total),
        formatted_paid: this.formatCurrency(invoice.paid_amount),
        formatted_balance: this.formatCurrency(invoice.balance_due)
      };
    } catch (error) {
      logError('Error in BillingService.getInvoiceForPrint:', error);
      throw error;
    }
  }

  /**
   * Create credit note for invoice
   * @param {number} invoiceId - Invoice ID
   * @param {Object} creditNoteData - Credit note details
   * @param {Array} items - Items to credit
   * @returns {Promise<Object>} Created credit note
   */
  static async createCreditNote(invoiceId, creditNoteData, items) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Validate invoice exists
      const [invoices] = await connection.query(
        'SELECT * FROM invoices WHERE id = ? AND deleted_at IS NULL',
        [invoiceId]
      );

      if (invoices.length === 0) {
        throw new Error('Factura no encontrada');
      }

      // Generate credit note number
      const [settings] = await connection.query(
        'SELECT credit_note_prefix, last_credit_note_number FROM billing_settings LIMIT 1'
      );

      const { credit_note_prefix, last_credit_note_number } = settings[0];
      const nextNumber = last_credit_note_number + 1;
      const creditNoteNumber = `${credit_note_prefix}-${String(nextNumber).padStart(6, '0')}`;

      // Update last credit note number
      await connection.query(
        'UPDATE billing_settings SET last_credit_note_number = ?',
        [nextNumber]
      );

      // Calculate totals
      let subtotal = 0;
      let taxReduction = 0;

      items.forEach(item => {
        const itemSubtotal = item.quantity * item.unit_price;
        const itemTax = (itemSubtotal * (item.tax_rate || 15.00)) / 100;
        subtotal += itemSubtotal;
        taxReduction += itemTax;
      });

      const total = subtotal + taxReduction;

      // Insert credit note
      const [result] = await connection.query(
        `INSERT INTO credit_notes (
          credit_note_number,
          invoice_id,
          reason,
          reason_description,
          subtotal,
          tax_reduction,
          total,
          status,
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          creditNoteNumber,
          invoiceId,
          creditNoteData.reason,
          creditNoteData.reason_description || null,
          subtotal,
          taxReduction,
          total,
          'issued',
          creditNoteData.created_by
        ]
      );

      const creditNoteId = result.insertId;

      // Insert credit note items
      for (const item of items) {
        const itemSubtotal = item.quantity * item.unit_price;
        const itemTax = (itemSubtotal * (item.tax_rate || 15.00)) / 100;
        const lineTotal = itemSubtotal + itemTax;

        await connection.query(
          `INSERT INTO credit_note_items (
            credit_note_id,
            invoice_item_id,
            product_id,
            product_name,
            quantity,
            unit_price,
            subtotal,
            tax_amount,
            line_total
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            creditNoteId,
            item.invoice_item_id || null,
            item.product_id || null,
            item.product_name,
            item.quantity,
            item.unit_price,
            itemSubtotal,
            itemTax,
            lineTotal
          ]
        );
      }

      // Optionally adjust invoice total (if full credit)
      if (creditNoteData.apply_to_invoice) {
        await connection.query(
          `UPDATE invoices
          SET balance_due = balance_due - ?,
              updated_by = ?
          WHERE id = ?`,
          [total, creditNoteData.created_by, invoiceId]
        );
      }

      await connection.commit();

      return {
        credit_note_id: creditNoteId,
        credit_note_number: creditNoteNumber,
        message: 'Nota de crédito creada exitosamente'
      };
    } catch (error) {
      await connection.rollback();
      logError('Error in BillingService.createCreditNote:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get billing settings
   * @returns {Promise<Object>} Settings
   */
  static async getSettings() {
    try {
      const [settings] = await db.query(
        'SELECT * FROM billing_settings LIMIT 1'
      );

      return settings[0] || {};
    } catch (error) {
      logError('Error in BillingService.getSettings:', error);
      throw error;
    }
  }

  /**
   * Update billing settings
   * @param {Object} settingsData - Settings to update
   * @returns {Promise<Object>} Update result
   */
  static async updateSettings(settingsData) {
    try {
      const updates = [];
      const params = [];

      const allowedFields = [
        'company_name', 'commercial_name', 'company_rtn', 'company_address', 'company_phone',
        'company_email', 'company_logo', 'company_website', 'invoice_prefix',
        'credit_note_prefix', 'default_payment_terms', 'default_tax_rate',
        'default_currency', 'enable_auto_email', 'email_subject', 'email_body',
        'show_company_logo', 'show_tax_breakdown', 'invoice_footer_text',
        'invoice_notes', 'facebook', 'instagram', 'twitter',
        'whatsapp', 'country', 'state', 'city', 'sector', 'company_logo_path',
        'invoice_number_length', 'timezone', 'date_format', 'time_format',
        'financial_year', 'starting_month'
      ];

      allowedFields.forEach(field => {
        if (settingsData[field] !== undefined) {
          updates.push(`${field} = ?`);
          params.push(settingsData[field]);
        }
      });

      if (settingsData.updated_by) {
        updates.push('updated_by = ?');
        params.push(settingsData.updated_by);
      }

      if (updates.length === 0) {
        throw new Error('No hay datos para actualizar');
      }

      const [result] = await db.query(
        `UPDATE billing_settings SET ${updates.join(', ')} WHERE id = 1`,
        params
      );

      return { message: 'Configuración actualizada exitosamente' };
    } catch (error) {
      logError('Error in BillingService.updateSettings:', error);
      throw error;
    }
  }

  /**
   * Helper: Format currency
   * @param {number} amount - Amount to format
   * @returns {string} Formatted amount
   */
  static formatCurrency(amount) {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL'
    }).format(amount);
  }
}

module.exports = BillingService;
