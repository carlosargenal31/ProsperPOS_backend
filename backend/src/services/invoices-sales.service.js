// ===================================================================
// PROSPERPOS - SERVICIO DE FACTURAS DE VENTAS
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class InvoicesSalesService {
  /**
   * Obtener todas las facturas con paginación y filtros
   */
  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      status = '',
      payment_status = '',
      date_from = '',
      date_to = ''
    } = options;

    const offset = (page - 1) * limit;
    let whereClause = ['deleted_at IS NULL'];
    let params = [];

    // Filtro de búsqueda
    if (search) {
      whereClause.push(`(
        invoice_number LIKE ? OR
        customer_name LIKE ? OR
        seller_name LIKE ?
      )`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    // Filtro de estado
    if (status) {
      whereClause.push('status = ?');
      params.push(status);
    }

    // Filtro de estado de pago
    if (payment_status) {
      whereClause.push('payment_status = ?');
      params.push(payment_status);
    }

    // Filtro de rango de fechas
    if (date_from) {
      whereClause.push('DATE(issue_date) >= ?');
      params.push(date_from);
    }

    if (date_to) {
      whereClause.push('DATE(issue_date) <= ?');
      params.push(date_to);
    }

    const whereSQL = whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : '';

    // Contar total de registros
    const countSQL = `SELECT COUNT(*) as total FROM invoices ${whereSQL}`;
    const countResult = await db.query(countSQL, params);
    const total = countResult[0]?.total || 0;

    // Obtener facturas
    // Note: LIMIT and OFFSET are inserted directly to avoid MySQL parameter binding issues
    const sql = `
      SELECT *
      FROM invoices
      ${whereSQL}
      ORDER BY issue_date DESC, id DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;

    const invoices = await db.query(sql, params);

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obtener factura por ID con sus items
   */
  static async getById(id) {
    const sql = 'SELECT * FROM invoices WHERE id = ? AND deleted_at IS NULL';
    const results = await db.query(sql, [id]);

    if (!results || results.length === 0) {
      return null;
    }

    const invoice = results[0];

    // Obtener los items de la factura con el código real del producto
    const itemsSql = `
      SELECT
        ii.*,
        p.code as product_code,
        COALESCE(u.name, 'UNIDAD') as product_unit
      FROM invoice_items ii
      LEFT JOIN products p ON ii.product_id = p.id
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE ii.invoice_id = ?
    `;
    const items = await db.query(itemsSql, [id]);

    invoice.items = items || [];

    return invoice;
  }

  /**
   * Obtener factura por número de factura
   */
  static async getByInvoiceNumber(invoiceNumber) {
    const sql = 'SELECT * FROM invoices WHERE invoice_number = ? AND deleted_at IS NULL';
    const results = await db.query(sql, [invoiceNumber]);
    return results[0] || null;
  }

  /**
   * Obtener estadísticas
   */
  static async getStats() {
    const sql = `
      SELECT
        COUNT(*) as total_invoices,
        SUM(CASE WHEN status = 'issued' THEN 1 ELSE 0 END) as issued,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN payment_status = 'partial' THEN 1 ELSE 0 END) as partial,
        SUM(total) as total_sales,
        SUM(paid_amount) as total_collected,
        SUM(balance_due) as total_pending
      FROM invoices
      WHERE deleted_at IS NULL
    `;

    const results = await db.query(sql);
    return results[0];
  }
}

module.exports = InvoicesSalesService;
