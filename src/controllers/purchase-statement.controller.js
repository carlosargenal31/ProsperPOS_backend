// ===================================================================
// PROSPERPOS - CONTROLADOR DE ESTADO DE CUENTA COMPRAS
// CON TODOS LOS DOCUMENTOS: FACTURAS DE COMPRA, DEVOLUCIONES DE COMPRA, NOTAS DE CRÉDITO DE COMPRA
// ===================================================================

const db = require('../utils/database');

class PurchaseStatementController {
  /**
   * Obtener todos los documentos de compras consolidados
   * GET /api/v1/purchase-statement
   */
  static async getAllDocuments(req, res) {
    try {
      console.log('=== INICIANDO getAllDocuments (COMPRAS) ===');
      console.log('Query params:', req.query);

      const {
        date_from,
        date_to,
        supplier_id,
        branch_id,
        document_type,
        status
      } = req.query;

      const allDocuments = [];

      // 1. FACTURAS DE COMPRA
      if (!document_type || document_type === 'factura_compra') {
        try {
          console.log('\n--- FACTURAS DE COMPRA ---');

          let query = `
            SELECT
              pd.id,
              'factura_compra' as type,
              pd.purchase_number as document_number,
              pd.purchase_date as emission_date,
              pd.supplier_id,
              pd.supplier_name,
              pd.supplier_rtn,
              pd.warehouse_id as branch_id,
              b.nombre as branch_name,
              pd.total_amount as total,
              pd.subtotal,
              pd.discount,
              pd.tax,
              pd.payment_status as status,
              pd.invoice_number,
              CONCAT(u.first_name, ' ', u.last_name) as created_by_name
            FROM purchases_documents pd
            LEFT JOIN branches b ON pd.warehouse_id = b.id
            LEFT JOIN users u ON pd.created_by = u.id
            WHERE pd.deleted_at IS NULL AND pd.status != 'Returned'
          `;

          const params = [];

          if (date_from) {
            query += ` AND DATE(pd.purchase_date) >= ?`;
            params.push(date_from);
          }

          if (date_to) {
            query += ` AND DATE(pd.purchase_date) <= ?`;
            params.push(date_to);
          }

          if (supplier_id) {
            query += ` AND pd.supplier_id = ?`;
            params.push(supplier_id);
          }

          if (branch_id) {
            query += ` AND pd.warehouse_id = ?`;
            params.push(branch_id);
          }

          if (status) {
            query += ` AND pd.payment_status = ?`;
            params.push(status);
          }

          query += ` ORDER BY pd.purchase_date DESC LIMIT 100`;

          const result = await db.query(query, params);
          let purchases = result;
          if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
            purchases = result[0];
          }

          if (Array.isArray(purchases) && purchases.length > 0) {
            console.log(`✅ ${purchases.length} facturas de compra`);
            purchases.forEach(p => allDocuments.push(p));
          }
        } catch (error) {
          console.error('❌ Error facturas de compra:', error.message);
        }
      }

      // 2. DEVOLUCIONES DE COMPRA
      if (!document_type || document_type === 'devolucion_compra') {
        try {
          console.log('\n--- DEVOLUCIONES DE COMPRA ---');

          let query = `
            SELECT
              pr.id,
              'devolucion_compra' as type,
              pr.correlative as document_number,
              pr.emission_date,
              pr.supplier_id,
              pr.supplier_name,
              s.rtn as supplier_rtn,
              pd.warehouse_id as branch_id,
              b.nombre as branch_name,
              pr.total,
              pr.subtotal,
              pr.discount,
              pr.tax,
              'completed' as status,
              pr.purchase_number,
              CONCAT(u.first_name, ' ', u.last_name) as created_by_name
            FROM purchase_returns pr
            LEFT JOIN suppliers s ON pr.supplier_id = s.id
            LEFT JOIN purchases_documents pd ON pr.purchase_id = pd.id
            LEFT JOIN branches b ON pd.warehouse_id = b.id
            LEFT JOIN users u ON pr.created_by = u.id
            WHERE 1=1
          `;

          const params = [];

          if (date_from) {
            query += ` AND DATE(pr.emission_date) >= ?`;
            params.push(date_from);
          }

          if (date_to) {
            query += ` AND DATE(pr.emission_date) <= ?`;
            params.push(date_to);
          }

          if (supplier_id) {
            query += ` AND pr.supplier_id = ?`;
            params.push(supplier_id);
          }

          if (branch_id) {
            query += ` AND pd.warehouse_id = ?`;
            params.push(branch_id);
          }

          query += ` ORDER BY pr.emission_date DESC LIMIT 100`;

          const result = await db.query(query, params);
          let returns = result;
          if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
            returns = result[0];
          }

          console.log('📋 Resultado devoluciones de compra:', returns?.length || 0, 'registros');
          if (Array.isArray(returns) && returns.length > 0) {
            console.log(`✅ ${returns.length} devoluciones de compra`);
            returns.forEach(r => allDocuments.push(r));
          } else {
            console.log('⚠️ No se encontraron devoluciones de compra en el rango de fechas');
          }
        } catch (error) {
          console.error('❌ Error devoluciones de compra:', error.message);
        }
      }

      // 3. NOTAS DE CRÉDITO DE COMPRA
      if (!document_type || document_type === 'nota_credito_compra') {
        try {
          console.log('\n--- NOTAS DE CRÉDITO DE COMPRA ---');

          let query = `
            SELECT
              pr.id,
              'nota_credito_compra' as type,
              COALESCE(pr.credit_note_number, pr.correlative) as document_number,
              pr.credit_note_number,
              pr.credit_note_date as emission_date,
              pr.supplier_id,
              pr.supplier_name,
              s.rtn as supplier_rtn,
              pd.warehouse_id as branch_id,
              b.nombre as branch_name,
              pr.total,
              pr.subtotal,
              pr.discount,
              pr.tax,
              'completed' as status,
              pr.purchase_number,
              CONCAT(u.first_name, ' ', u.last_name) as created_by_name
            FROM purchase_returns pr
            LEFT JOIN suppliers s ON pr.supplier_id = s.id
            LEFT JOIN purchases_documents pd ON pr.purchase_id = pd.id
            LEFT JOIN branches b ON pd.warehouse_id = b.id
            LEFT JOIN users u ON pr.created_by = u.id
            WHERE pr.credit_note_received = 1 AND pr.credit_note_number IS NOT NULL
          `;

          const params = [];

          if (date_from) {
            query += ` AND DATE(pr.credit_note_date) >= ?`;
            params.push(date_from);
          }

          if (date_to) {
            query += ` AND DATE(pr.credit_note_date) <= ?`;
            params.push(date_to);
          }

          if (supplier_id) {
            query += ` AND pr.supplier_id = ?`;
            params.push(supplier_id);
          }

          if (branch_id) {
            query += ` AND pd.warehouse_id = ?`;
            params.push(branch_id);
          }

          query += ` ORDER BY pr.credit_note_date DESC LIMIT 100`;

          const result = await db.query(query, params);
          let creditNotes = result;
          if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
            creditNotes = result[0];
          }

          console.log('📋 Resultado notas de crédito de compra:', creditNotes?.length || 0, 'registros');
          if (Array.isArray(creditNotes) && creditNotes.length > 0) {
            console.log(`✅ ${creditNotes.length} notas de crédito de compra`);
            creditNotes.forEach(cn => allDocuments.push(cn));
          } else {
            console.log('⚠️ No se encontraron notas de crédito de compra en el rango de fechas');
          }
        } catch (error) {
          console.error('❌ Error notas de crédito de compra:', error.message);
        }
      }

      console.log(`\n📊 TOTAL: ${allDocuments.length} documentos`);

      // Ordenar por fecha
      allDocuments.sort((a, b) => {
        return new Date(b.emission_date) - new Date(a.emission_date);
      });

      console.log('✅ Enviando respuesta\n');

      return res.json({
        success: true,
        data: allDocuments,
        count: allDocuments.length
      });
    } catch (error) {
      console.error('❌❌❌ ERROR FATAL:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener documentos de compras',
        error: error.message
      });
    }
  }

  /**
   * Obtener documento específico con items
   * GET /api/v1/purchase-statement/:type/:id
   */
  static async getDocumentById(req, res) {
    try {
      const { type, id } = req.params;
      console.log(`\n=== getDocumentById: ${type} #${id} ===`);

      let document = null;

      if (type === 'factura_compra') {
        const result = await db.query(`
          SELECT
            pd.id,
            'factura_compra' as type,
            pd.purchase_number as document_number,
            pd.purchase_date as emission_date,
            pd.supplier_id,
            pd.supplier_name,
            pd.supplier_rtn,
            pd.warehouse_id as branch_id,
            b.nombre as branch_name,
            pd.total_amount as total,
            pd.subtotal,
            pd.discount,
            pd.tax,
            pd.payment_status as status,
            pd.invoice_number
          FROM purchases_documents pd
          LEFT JOIN branches b ON pd.warehouse_id = b.id
          WHERE pd.id = ?
        `, [id]);

        let purchases = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;

        if (purchases && purchases.length > 0) {
          document = purchases[0];

          const itemsResult = await db.query(`
            SELECT
              pi.id,
              pi.product_id,
              p.code as product_code,
              p.name as product_name,
              pi.quantity,
              pi.unit_price,
              pi.discount_value,
              pi.tax_rate
            FROM purchase_items pi
            LEFT JOIN products p ON pi.product_id = p.id
            WHERE pi.purchase_id = ?
          `, [id]);

          let items = Array.isArray(itemsResult) && Array.isArray(itemsResult[0]) ? itemsResult[0] : itemsResult;
          document.items = items || [];
        }
      } else if (type === 'devolucion_compra' || type === 'nota_credito_compra') {
        const result = await db.query(`
          SELECT
            pr.id,
            ? as type,
            pr.correlative as document_number,
            pr.credit_note_number,
            pr.emission_date,
            pr.credit_note_date,
            pr.supplier_id,
            pr.supplier_name,
            s.rtn as supplier_rtn,
            pd.warehouse_id as branch_id,
            b.nombre as branch_name,
            pr.total,
            pr.subtotal,
            pr.discount,
            pr.tax,
            pr.purchase_number,
            pr.notes,
            'completed' as status,
            CONCAT(u.first_name, ' ', u.last_name) as created_by_name
          FROM purchase_returns pr
          LEFT JOIN suppliers s ON pr.supplier_id = s.id
          LEFT JOIN purchases_documents pd ON pr.purchase_id = pd.id
          LEFT JOIN branches b ON pd.warehouse_id = b.id
          LEFT JOIN users u ON pr.created_by = u.id
          WHERE pr.id = ?
        `, [type, id]);

        let returns = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;

        if (returns && returns.length > 0) {
          document = returns[0];

          const itemsResult = await db.query(`
            SELECT
              pri.id,
              pri.product_id,
              p.code as product_code,
              p.name as product_name,
              pri.quantity,
              pri.unit_price,
              pri.discount_value,
              pri.tax_rate
            FROM purchase_return_items pri
            LEFT JOIN products p ON pri.product_id = p.id
            WHERE pri.purchase_return_id = ?
          `, [id]);

          let items = Array.isArray(itemsResult) && Array.isArray(itemsResult[0]) ? itemsResult[0] : itemsResult;
          document.items = items || [];
        }
      }

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Documento no encontrado'
        });
      }

      return res.json({
        success: true,
        data: document
      });
    } catch (error) {
      console.error('❌ Error getDocumentById:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener documento',
        error: error.message
      });
    }
  }
}

module.exports = PurchaseStatementController;
