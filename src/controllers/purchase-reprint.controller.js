// ===================================================================
// PROSPERPOS - CONTROLADOR DE REIMPRESIONES DE COMPRAS
// ===================================================================

const logger = require('../utils/logger');
const db = require('../utils/database');

class PurchaseReprintController {
  /**
   * Buscar documentos de compras para reimpresión por tipo
   */
  static async searchDocuments(req, res) {
    try {
      const { documentType, searchQuery, dateFrom, dateTo } = req.query;

      let sql = '';
      let params = [];
      let documents = [];

      switch (documentType) {
        case 'COMPRA':
          sql = `
            SELECT
              pd.id,
              pd.purchase_number as document_number,
              pd.purchase_number as full_number,
              pd.purchase_date as issue_date,
              NULL as expiry_date,
              pd.supplier_name,
              COALESCE(CONCAT(u.first_name, ' ', u.last_name), u.username, 'Sistema') as created_by_name,
              pd.total_amount as total,
              pd.status,
              'COMPRA' as document_type
            FROM purchases_documents pd
            LEFT JOIN users u ON pd.created_by = u.id
            WHERE pd.deleted_at IS NULL
              AND pd.status != 'Returned'
          `;

          if (searchQuery) {
            sql += ` AND (pd.purchase_number LIKE ? OR pd.supplier_name LIKE ? OR pd.invoice_number LIKE ?)`;
            params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
          }

          if (dateFrom) {
            sql += ` AND pd.purchase_date >= ?`;
            params.push(dateFrom);
          }

          if (dateTo) {
            sql += ` AND pd.purchase_date <= ?`;
            params.push(dateTo);
          }

          sql += ` ORDER BY pd.created_at DESC LIMIT 100`;
          break;

        case 'DEVOLUCION COMPRA':
          sql = `
            SELECT
              pr.id,
              pr.correlative as document_number,
              pr.correlative as full_number,
              pr.emission_date as issue_date,
              NULL as expiry_date,
              pr.supplier_name,
              CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
              pr.total,
              'Completada' as status,
              'DEVOLUCION COMPRA' as document_type
            FROM purchase_returns pr
            LEFT JOIN users u ON pr.created_by = u.id
            WHERE 1=1
          `;

          if (searchQuery) {
            sql += ` AND (pr.correlative LIKE ? OR pr.supplier_name LIKE ? OR pr.purchase_number LIKE ?)`;
            params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
          }

          if (dateFrom) {
            sql += ` AND pr.emission_date >= ?`;
            params.push(dateFrom);
          }

          if (dateTo) {
            sql += ` AND pr.emission_date <= ?`;
            params.push(dateTo);
          }

          sql += ` ORDER BY pr.created_at DESC LIMIT 100`;
          break;

        case 'NOTA CREDITO COMPRA':
          sql = `
            SELECT
              pr.id,
              pr.credit_note_number as document_number,
              pr.credit_note_number as full_number,
              pr.credit_note_date as issue_date,
              NULL as expiry_date,
              pr.supplier_name,
              CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
              pr.total,
              'Completada' as status,
              'NOTA CREDITO COMPRA' as document_type
            FROM purchase_returns pr
            LEFT JOIN users u ON pr.created_by = u.id
            WHERE pr.credit_note_received = 1
              AND pr.credit_note_number IS NOT NULL
          `;

          if (searchQuery) {
            sql += ` AND (pr.correlative LIKE ? OR pr.credit_note_number LIKE ? OR pr.supplier_name LIKE ?)`;
            params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
          }

          if (dateFrom) {
            sql += ` AND pr.credit_note_date >= ?`;
            params.push(dateFrom);
          }

          if (dateTo) {
            sql += ` AND pr.credit_note_date <= ?`;
            params.push(dateTo);
          }

          sql += ` ORDER BY pr.created_at DESC LIMIT 100`;
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Tipo de documento no válido'
          });
      }

      console.log('SQL Query:', sql);
      console.log('Params:', params);
      documents = await db.query(sql, params);

      res.json({
        success: true,
        data: documents
      });
    } catch (error) {
      console.log('Error en searchDocuments:', error.message);
      logger.error('Error in PurchaseReprintController.searchDocuments:', error);
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

      console.log('=== getDocumentDetails ===');
      console.log('documentType:', documentType);
      console.log('documentType (type):', typeof documentType);
      console.log('documentType (encoded):', encodeURIComponent(documentType));
      console.log('documentId:', documentId);

      let documentData = null;

      switch (documentType) {
        case 'COMPRA':
          documentData = await PurchaseReprintController.getPurchaseDetails(documentId);
          break;
        case 'DEVOLUCION COMPRA':
          documentData = await PurchaseReprintController.getPurchaseReturnDetails(documentId);
          break;
        case 'NOTA CREDITO COMPRA':
          documentData = await PurchaseReprintController.getPurchaseCreditNoteDetails(documentId);
          break;
        default:
          console.log('No matching document type found');
          return res.status(400).json({
            success: false,
            message: 'Tipo de documento no válido: ' + documentType
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
      console.error('Error in getDocumentDetails:', error);
      logger.error('Error in PurchaseReprintController.getDocumentDetails:', error);
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

  static async getPurchaseDetails(id) {
    try {
      console.log('getPurchaseDetails called with id:', id);

      const sql = `
        SELECT
          pd.*,
          pd.purchase_number as correlative,
          pd.supplier_id_number as supplier_rtn,
          pd.net_amount as subtotal,
          pd.discount_amount as discount,
          pd.surcharge_amount as surcharge,
          pd.tax_amount as tax,
          pd.total_amount,
          COALESCE(CONCAT(u.first_name, ' ', u.last_name), u.username, 'Sistema') as created_by_name
        FROM purchases_documents pd
        LEFT JOIN users u ON pd.created_by = u.id
        WHERE pd.id = ?
      `;

      const results = await db.query(sql, [id]);
      console.log('Purchase query results:', results?.length || 0);

      if (!results || results.length === 0) return null;

      const purchase = results[0];

      // Obtener items
      const itemsSql = `
        SELECT
          pdi.*,
          pdi.product_code,
          pdi.product_name,
          pdi.quantity,
          pdi.unit_price,
          pdi.discount_amount as discount,
          pdi.tax_amount as tax,
          pdi.subtotal,
          pdi.total
        FROM purchases_documents_items pdi
        WHERE pdi.purchase_id = ?
      `;

      const items = await db.query(itemsSql, [id]);
      console.log('Purchase items found:', items?.length || 0);
      purchase.items = items;

      return purchase;
    } catch (error) {
      console.error('Error in getPurchaseDetails:', error);
      throw error;
    }
  }

  static async getPurchaseReturnDetails(id) {
    try {
      console.log('getPurchaseReturnDetails called with id:', id);

      const sql = `
        SELECT
          pr.*,
          pr.correlative,
          pr.purchase_number,
          pr.supplier_name,
          pr.supplier_rtn,
          pr.emission_date,
          pr.subtotal,
          pr.subtotal as subtotal_15,
          pr.tax,
          pr.total,
          pr.notes,
          COALESCE(CONCAT(u.first_name, ' ', u.last_name), u.username, 'Sistema') as created_by_name
        FROM purchase_returns pr
        LEFT JOIN users u ON pr.created_by = u.id
        WHERE pr.id = ?
      `;

      const results = await db.query(sql, [id]);
      console.log('Purchase return query results:', results?.length || 0);

      if (!results || results.length === 0) return null;

      const returnData = results[0];

      // Las devoluciones de compra no tienen items (solo monto)
      // pero mantenemos la estructura por consistencia
      const itemsSql = `
        SELECT
          pri.*
        FROM purchase_return_items pri
        WHERE pri.purchase_return_id = ?
      `;

      const items = await db.query(itemsSql, [id]);
      console.log('Purchase return items found:', items?.length || 0);
      returnData.items = items || [];

      return returnData;
    } catch (error) {
      console.error('Error in getPurchaseReturnDetails:', error);
      throw error;
    }
  }

  static async getPurchaseCreditNoteDetails(id) {
    try {
      console.log('getPurchaseCreditNoteDetails called with id:', id);

      const sql = `
        SELECT
          pr.*,
          pr.correlative,
          pr.credit_note_number,
          pr.credit_note_date,
          pr.purchase_number,
          pr.supplier_name,
          pr.supplier_rtn,
          pr.emission_date,
          pr.subtotal,
          pr.subtotal as subtotal_15,
          pr.tax,
          pr.total,
          pr.notes,
          COALESCE(CONCAT(u.first_name, ' ', u.last_name), u.username, 'Sistema') as created_by_name
        FROM purchase_returns pr
        LEFT JOIN users u ON pr.created_by = u.id
        WHERE pr.id = ?
          AND pr.credit_note_received = 1
      `;

      const results = await db.query(sql, [id]);
      console.log('Credit note query results:', results?.length || 0);

      if (!results || results.length === 0) return null;

      const creditNote = results[0];

      // Las notas de crédito de compra se basan en devoluciones
      const itemsSql = `
        SELECT
          pri.*
        FROM purchase_return_items pri
        WHERE pri.purchase_return_id = ?
      `;

      const items = await db.query(itemsSql, [id]);
      console.log('Credit note items found:', items?.length || 0);
      creditNote.items = items || [];

      return creditNote;
    } catch (error) {
      console.error('Error in getPurchaseCreditNoteDetails:', error);
      throw error;
    }
  }
}

module.exports = PurchaseReprintController;
