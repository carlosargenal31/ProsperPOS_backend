// ===================================================================
// PROSPERPOS - CONTROLADOR DE REIMPRESIONES
// ===================================================================

const logger = require('../utils/logger');
const db = require('../utils/database');

class ReprintController {
  /**
   * Buscar documentos para reimpresión por tipo
   */
  static async searchDocuments(req, res) {
    try {
      const { documentType, searchQuery, dateFrom, dateTo, branch } = req.query;

      let sql = '';
      let params = [];
      let documents = [];

      switch (documentType) {
        case 'NOTA DE CREDITO':
          sql = `
            SELECT
              cn.id,
              cn.correlative as document_number,
              cn.credit_note_number as full_number,
              cn.emission_date as issue_date,
              NULL as expiry_date,
              cn.customer_name,
              CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
              cn.total,
              cn.invoice_number,
              'Completada' as status,
              'NOTA DE CREDITO' as document_type
            FROM credit_notes cn
            LEFT JOIN users u ON cn.created_by = u.id
            WHERE cn.deleted_at IS NULL
          `;

          if (searchQuery) {
            sql += ` AND (cn.correlative LIKE ? OR cn.credit_note_number LIKE ? OR cn.customer_name LIKE ?)`;
            params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
          }

          if (dateFrom) {
            sql += ` AND cn.emission_date >= ?`;
            params.push(dateFrom);
          }

          if (dateTo) {
            sql += ` AND cn.emission_date <= ?`;
            params.push(dateTo);
          }

          sql += ` ORDER BY cn.created_at DESC LIMIT 100`;
          break;

        case 'DEVOLUCION':
          sql = `
            SELECT
              sr.id,
              sr.correlative as document_number,
              sr.emission_date as issue_date,
              NULL as expiry_date,
              sr.customer_name,
              CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
              sr.total,
              sr.invoice_number,
              'Completada' as status,
              'DEVOLUCION' as document_type
            FROM sales_returns sr
            LEFT JOIN users u ON sr.created_by = u.id
            WHERE 1=1
          `;

          if (searchQuery) {
            sql += ` AND (sr.correlative LIKE ? OR sr.customer_name LIKE ? OR sr.invoice_number LIKE ?)`;
            params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
          }

          if (dateFrom) {
            sql += ` AND sr.emission_date >= ?`;
            params.push(dateFrom);
          }

          if (dateTo) {
            sql += ` AND sr.emission_date <= ?`;
            params.push(dateTo);
          }

          sql += ` ORDER BY sr.created_at DESC LIMIT 100`;
          break;

        case 'FACTURA':
          sql = `
            SELECT
              i.id,
              i.invoice_number as document_number,
              i.invoice_number as full_number,
              i.issue_date,
              NULL as expiry_date,
              i.customer_name,
              i.seller_name,
              i.total,
              i.payment_status,
              'FACTURA' as document_type
            FROM invoices i
            WHERE i.deleted_at IS NULL
              AND i.payment_status IN ('paid', 'pending', 'partial')
          `;

          if (searchQuery) {
            sql += ` AND (i.invoice_number LIKE ? OR i.customer_name LIKE ?)`;
            params.push(`%${searchQuery}%`, `%${searchQuery}%`);
          }

          if (dateFrom) {
            sql += ` AND i.issue_date >= ?`;
            params.push(dateFrom);
          }

          if (dateTo) {
            sql += ` AND i.issue_date <= ?`;
            params.push(dateTo);
          }

          if (branch) {
            sql += ` AND i.branch_id = ?`;
            params.push(branch);
          }

          sql += ` ORDER BY i.created_at DESC LIMIT 100`;
          break;

        case 'FACT EN ESPERA':
          sql = `
            SELECT
              po.id,
              po.order_number as document_number,
              po.order_number as full_number,
              po.created_at as issue_date,
              NULL as expiry_date,
              po.customer_name,
              po.seller_name,
              po.total,
              'FACT EN ESPERA' as document_type
            FROM pending_orders po
            WHERE po.deleted_at IS NULL
              AND po.status = 'pending'
          `;

          if (searchQuery) {
            sql += ` AND (po.order_number LIKE ? OR po.customer_name LIKE ?)`;
            params.push(`%${searchQuery}%`, `%${searchQuery}%`);
          }

          if (dateFrom) {
            sql += ` AND po.created_at >= ?`;
            params.push(dateFrom);
          }

          if (dateTo) {
            sql += ` AND po.created_at <= ?`;
            params.push(dateTo);
          }

          sql += ` ORDER BY po.created_at DESC LIMIT 100`;
          break;

        case 'COTIZACION':
          sql = `
            SELECT
              q.id,
              q.quote_number as document_number,
              q.quote_number as full_number,
              q.quote_date as issue_date,
              DATE_ADD(q.quote_date, INTERVAL 15 DAY) as expiry_date,
              q.customer_name,
              q.seller_name,
              q.total,
              q.status,
              'COTIZACION' as document_type
            FROM quotes q
            WHERE q.deleted_at IS NULL
          `;

          if (searchQuery) {
            sql += ` AND (q.quote_number LIKE ? OR q.customer_name LIKE ?)`;
            params.push(`%${searchQuery}%`, `%${searchQuery}%`);
          }

          if (dateFrom) {
            sql += ` AND q.quote_date >= ?`;
            params.push(dateFrom);
          }

          if (dateTo) {
            sql += ` AND q.quote_date <= ?`;
            params.push(dateTo);
          }

          sql += ` ORDER BY q.created_at DESC LIMIT 100`;
          break;

        case 'GUIA DE REMISION':
          sql = `
            SELECT
              s.id,
              s.shipment_number as document_number,
              s.shipment_number as full_number,
              s.emission_date as issue_date,
              NULL as expiry_date,
              s.customer_name,
              CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
              s.total_amount as total,
              'Completada' as status,
              'GUIA DE REMISION' as document_type
            FROM shipments s
            LEFT JOIN users u ON s.created_by = u.id
            WHERE s.deleted_at IS NULL
          `;

          if (searchQuery) {
            sql += ` AND (s.shipment_number LIKE ? OR s.customer_name LIKE ?)`;
            params.push(`%${searchQuery}%`, `%${searchQuery}%`);
          }

          if (dateFrom) {
            sql += ` AND s.emission_date >= ?`;
            params.push(dateFrom);
          }

          if (dateTo) {
            sql += ` AND s.emission_date <= ?`;
            params.push(dateTo);
          }

          sql += ` ORDER BY s.created_at DESC LIMIT 100`;
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Tipo de documento no válido'
          });
      }

      documents = await db.query(sql, params);

      res.json({
        success: true,
        data: documents
      });
    } catch (error) {
      logger.error('Error in ReprintController.searchDocuments:', error);
      res.status(500).json({
        success: false,
        message: 'Error al buscar documentos',
        error: error.message
      });
    }
  }

  /**
   * Obtener detalles de un documento específico para reimpresión
   */
  static async getDocumentDetails(req, res) {
    try {
      const { documentType, documentId } = req.params;

      let documentData = null;

      switch (documentType) {
        case 'NOTA DE CREDITO':
          documentData = await ReprintController.getCreditNoteDetails(documentId);
          break;
        case 'DEVOLUCION':
          documentData = await ReprintController.getReturnDetails(documentId);
          break;
        case 'FACTURA':
          documentData = await ReprintController.getInvoiceDetails(documentId);
          break;
        case 'FACT EN ESPERA':
          documentData = await ReprintController.getPendingOrderDetails(documentId);
          break;
        case 'COTIZACION':
          documentData = await ReprintController.getQuoteDetails(documentId);
          break;
        case 'GUIA DE REMISION':
          documentData = await ReprintController.getShippingGuideDetails(documentId);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Tipo de documento no válido'
          });
      }

      if (!documentData) {
        return res.status(404).json({
          success: false,
          message: 'Documento no encontrado'
        });
      }

      res.json({
        success: true,
        data: documentData
      });
    } catch (error) {
      logger.error('Error in ReprintController.getDocumentDetails:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener detalles del documento',
        error: error.message
      });
    }
  }

  // ===================================================================
  // MÉTODOS AUXILIARES PARA OBTENER DETALLES DE CADA TIPO DE DOCUMENTO
  // ===================================================================

  static async getCreditNoteDetails(id) {
    const sql = `
      SELECT
        cn.*,
        cn.correlative,
        i.customer_rtn,
        i.invoice_number,
        b.nombre as branch_name,
        r.cai,
        r.numero_resolucion,
        r.nro_inicial_control,
        r.nro_final_control
      FROM credit_notes cn
      LEFT JOIN invoices i ON cn.invoice_id = i.id
      LEFT JOIN branches b ON i.branch_id = b.id
      LEFT JOIN resolutions r ON cn.resolution_id = r.id
      WHERE cn.id = ?
    `;

    const results = await db.query(sql, [id]);
    if (!results || results.length === 0) return null;

    const creditNote = results[0];

    // Obtener items
    const itemsSql = `
      SELECT
        cni.*,
        p.code as product_code,
        p.name as product_name
      FROM credit_note_items cni
      LEFT JOIN products p ON cni.product_id = p.id
      WHERE cni.credit_note_id = ?
    `;

    const items = await db.query(itemsSql, [id]);
    creditNote.items = items;

    return creditNote;
  }

  static async getReturnDetails(id) {
    const sql = `
      SELECT
        sr.*,
        sr.correlative,
        i.customer_rtn,
        i.invoice_number,
        b.nombre as branch_name
      FROM sales_returns sr
      LEFT JOIN invoices i ON sr.invoice_id = i.id
      LEFT JOIN branches b ON i.branch_id = b.id
      WHERE sr.id = ?
    `;

    const results = await db.query(sql, [id]);
    if (!results || results.length === 0) return null;

    const returnData = results[0];

    // Obtener items
    const itemsSql = `
      SELECT
        sri.*,
        p.code as product_code,
        p.name as product_name
      FROM sales_return_items sri
      LEFT JOIN products p ON sri.product_id = p.id
      WHERE sri.sales_return_id = ?
    `;

    const items = await db.query(itemsSql, [id]);
    returnData.items = items;

    return returnData;
  }

  static async getInvoiceDetails(id) {
    const sql = `
      SELECT
        i.*,
        i.invoice_number as correlative,
        b.nombre as branch_name,
        r.cai,
        r.numero_resolucion,
        r.nro_inicial_control,
        r.nro_final_control
      FROM invoices i
      LEFT JOIN branches b ON i.branch_id = b.id
      LEFT JOIN resolutions r ON i.resolution_id = r.id
      WHERE i.id = ?
    `;

    const results = await db.query(sql, [id]);
    if (!results || results.length === 0) return null;

    const invoice = results[0];

    // Obtener items
    const itemsSql = `
      SELECT
        ii.*,
        p.code as product_code,
        p.name as product_name
      FROM invoice_items ii
      LEFT JOIN products p ON ii.product_id = p.id
      WHERE ii.invoice_id = ?
    `;

    const items = await db.query(itemsSql, [id]);
    invoice.items = items;

    return invoice;
  }

  static async getPendingOrderDetails(id) {
    const sql = `
      SELECT
        po.*,
        po.customer_rtn,
        po.order_number as correlative,
        b.nombre as branch_name
      FROM pending_orders po
      LEFT JOIN branches b ON po.branch_id = b.id
      WHERE po.id = ?
    `;

    const results = await db.query(sql, [id]);
    if (!results || results.length === 0) return null;

    const order = results[0];

    // Obtener items
    const itemsSql = `
      SELECT
        poi.*,
        p.code as product_code,
        p.name as product_name
      FROM pending_order_items poi
      LEFT JOIN products p ON poi.product_id = p.id
      WHERE poi.pending_order_id = ?
    `;

    const items = await db.query(itemsSql, [id]);
    order.items = items;

    return order;
  }

  static async getQuoteDetails(id) {
    const sql = `
      SELECT
        q.*,
        q.customer_rtn,
        q.quote_number as correlative,
        b.nombre as branch_name
      FROM quotes q
      LEFT JOIN branches b ON q.branch_id = b.id
      WHERE q.id = ?
    `;

    const results = await db.query(sql, [id]);
    if (!results || results.length === 0) return null;

    const quote = results[0];

    // Obtener items
    const itemsSql = `
      SELECT
        qi.*,
        p.code as product_code,
        p.name as product_name
      FROM quote_items qi
      LEFT JOIN products p ON qi.product_id = p.id
      WHERE qi.quote_id = ?
    `;

    const items = await db.query(itemsSql, [id]);
    quote.items = items;

    return quote;
  }

  static async getShippingGuideDetails(id) {
    const sql = `
      SELECT
        s.*,
        s.customer_rtn,
        s.shipment_number as correlative,
        b.nombre as branch_name
      FROM shipments s
      LEFT JOIN branches b ON s.branch_id = b.id
      WHERE s.id = ?
    `;

    const results = await db.query(sql, [id]);
    if (!results || results.length === 0) return null;

    const shipment = results[0];

    // Obtener items
    const itemsSql = `
      SELECT
        si.*,
        p.code as product_code,
        p.name as product_name
      FROM shipment_items si
      LEFT JOIN products p ON si.product_id = p.id
      WHERE si.shipment_id = ?
    `;

    const items = await db.query(itemsSql, [id]);
    shipment.items = items;

    return shipment;
  }
}

module.exports = ReprintController;
