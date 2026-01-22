// ===================================================================
// PROSPERPOS - CONTROLADOR DE ESTADO DE CUENTA VENTAS
// CON TODOS LOS DOCUMENTOS: FACTURAS, COT, FACT ESPERA, GUÍAS, NC, DEVOL
// ===================================================================

const db = require('../utils/database');

class AccountStatementController {
  /**
   * Obtener todos los documentos de ventas consolidados
   * GET /api/v1/account-statement
   */
  static async getAllDocuments(req, res) {
    try {
      console.log('=== INICIANDO getAllDocuments ===');
      console.log('Query params:', req.query);

      const {
        date_from,
        date_to,
        customer_id,
        branch_id,
        seller_id,
        document_type,
        status
      } = req.query;

      const allDocuments = [];

      // 1. FACTURAS
      if (!document_type || document_type === 'factura') {
        try {
          console.log('\n--- FACTURAS ---');

          let query = `
            SELECT
              inv.id,
              'factura' as type,
              inv.invoice_number as document_number,
              inv.issue_date as emission_date,
              inv.customer_id,
              inv.customer_name,
              inv.customer_rtn,
              inv.seller_id,
              inv.seller_name,
              inv.warehouse_id as branch_id,
              b.nombre as branch_name,
              inv.total,
              inv.subtotal,
              inv.discount_amount as discount,
              inv.tax_amount as tax,
              inv.payment_status as status,
              CONCAT(u.first_name, ' ', u.last_name) as created_by_name
            FROM invoices inv
            LEFT JOIN branches b ON inv.warehouse_id = b.id
            LEFT JOIN users u ON inv.created_by = u.id
            WHERE inv.invoice_type = 'factura'
          `;

          const params = [];

          if (date_from) {
            query += ` AND DATE(inv.issue_date) >= ?`;
            params.push(date_from);
          }

          if (date_to) {
            query += ` AND DATE(inv.issue_date) <= ?`;
            params.push(date_to);
          }

          if (customer_id) {
            query += ` AND inv.customer_id = ?`;
            params.push(customer_id);
          }

          if (branch_id) {
            query += ` AND inv.warehouse_id = ?`;
            params.push(branch_id);
          }

          if (seller_id) {
            query += ` AND inv.seller_id = ?`;
            params.push(seller_id);
          }

          if (status) {
            query += ` AND inv.payment_status = ?`;
            params.push(status);
          }

          query += ` ORDER BY inv.issue_date DESC LIMIT 100`;

          const result = await db.query(query, params);
          let invoices = result;
          if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
            invoices = result[0];
          }

          if (Array.isArray(invoices) && invoices.length > 0) {
            console.log(`✅ ${invoices.length} facturas`);
            invoices.forEach(inv => allDocuments.push(inv));
          }
        } catch (error) {
          console.error('❌ Error facturas:', error.message);
        }
      }

      // 2. COTIZACIONES
      if (!document_type || document_type === 'cotizacion') {
        try {
          console.log('\n--- COTIZACIONES ---');

          // Primero actualizar las cotizaciones vencidas (15 días o más desde la creación)
          await db.query(`
            UPDATE quotes
            SET status = 'expired'
            WHERE status = 'active'
              AND DATE_ADD(DATE(quote_date), INTERVAL 15 DAY) <= CURDATE()
              AND deleted_at IS NULL
          `);

          let query = `
            SELECT
              q.id,
              'cotizacion' as type,
              q.quote_number as document_number,
              q.quote_date as emission_date,
              q.customer_id,
              q.customer_name,
              q.customer_rtn,
              q.seller_id,
              q.seller_name,
              q.branch_id,
              b.nombre as branch_name,
              q.total,
              q.subtotal,
              q.discount,
              q.tax,
              q.status,
              CONCAT(u.first_name, ' ', u.last_name) as created_by_name
            FROM quotes q
            LEFT JOIN branches b ON q.branch_id = b.id
            LEFT JOIN users u ON q.created_by = u.id
            WHERE 1=1
          `;

          const params = [];

          if (date_from) {
            query += ` AND DATE(q.quote_date) >= ?`;
            params.push(date_from);
          }

          if (date_to) {
            query += ` AND DATE(q.quote_date) <= ?`;
            params.push(date_to);
          }

          if (customer_id) {
            query += ` AND q.customer_id = ?`;
            params.push(customer_id);
          }

          if (branch_id) {
            query += ` AND q.branch_id = ?`;
            params.push(branch_id);
          }

          if (seller_id) {
            query += ` AND q.seller_id = ?`;
            params.push(seller_id);
          }

          if (status) {
            query += ` AND q.status = ?`;
            params.push(status);
          }

          query += ` ORDER BY q.quote_date DESC LIMIT 100`;

          const result = await db.query(query, params);
          let quotes = result;
          if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
            quotes = result[0];
          }

          if (Array.isArray(quotes) && quotes.length > 0) {
            console.log(`✅ ${quotes.length} cotizaciones`);
            quotes.forEach(q => allDocuments.push(q));
          }
        } catch (error) {
          console.error('❌ Error cotizaciones:', error.message);
        }
      }

      // 3. FACTURAS EN ESPERA
      if (!document_type || document_type === 'factura_espera') {
        try {
          console.log('\n--- FACTURAS EN ESPERA ---');

          // Primero actualizar las facturas vencidas (más de 1 día desde la creación)
          await db.query(`
            UPDATE pending_invoices
            SET status = 'expired'
            WHERE status = 'pending'
              AND DATE(created_at) < CURDATE()
              AND deleted_at IS NULL
          `);

          let query = `
            SELECT
              p.id,
              'factura_espera' as type,
              p.document_number,
              p.created_at as emission_date,
              p.customer_id,
              p.customer_name,
              p.customer_rtn,
              p.seller_id,
              p.seller_name,
              p.branch_id,
              b.nombre as branch_name,
              p.total,
              p.subtotal,
              p.discount,
              p.tax,
              p.status,
              CONCAT(u.first_name, ' ', u.last_name) as created_by_name
            FROM pending_invoices p
            LEFT JOIN branches b ON p.branch_id = b.id
            LEFT JOIN users u ON p.created_by = u.id
            WHERE 1=1
          `;

          const params = [];

          if (date_from) {
            query += ` AND DATE(p.created_at) >= ?`;
            params.push(date_from);
          }

          if (date_to) {
            query += ` AND DATE(p.created_at) <= ?`;
            params.push(date_to);
          }

          if (customer_id) {
            query += ` AND p.customer_id = ?`;
            params.push(customer_id);
          }

          if (branch_id) {
            query += ` AND p.branch_id = ?`;
            params.push(branch_id);
          }

          if (seller_id) {
            query += ` AND p.seller_id = ?`;
            params.push(seller_id);
          }

          if (status) {
            query += ` AND p.status = ?`;
            params.push(status);
          }

          query += ` ORDER BY p.created_at DESC LIMIT 100`;

          const result = await db.query(query, params);
          let pending = result;
          if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
            pending = result[0];
          }

          if (Array.isArray(pending) && pending.length > 0) {
            console.log(`✅ ${pending.length} facturas en espera`);
            pending.forEach(p => allDocuments.push(p));
          }
        } catch (error) {
          console.error('❌ Error pending:', error.message);
        }
      }

      // 4. GUÍAS DE REMISIÓN
      if (!document_type || document_type === 'guia_remision') {
        try {
          console.log('\n--- GUÍAS DE REMISIÓN ---');

          let query = `
            SELECT
              s.id,
              'guia_remision' as type,
              s.shipment_number as document_number,
              s.emission_date,
              s.customer_id,
              s.customer_name,
              '' as customer_rtn,
              0 as seller_id,
              '' as seller_name,
              s.origin_branch_id as branch_id,
              b.nombre as branch_name,
              COALESCE(s.declared_value, 0) as total,
              0 as subtotal,
              0 as discount,
              0 as tax,
              s.status,
              CONCAT(u.first_name, ' ', u.last_name) as created_by_name
            FROM shipments s
            LEFT JOIN branches b ON s.origin_branch_id = b.id
            LEFT JOIN users u ON s.created_by = u.id
            WHERE 1=1
          `;

          const params = [];

          if (date_from) {
            query += ` AND DATE(s.emission_date) >= ?`;
            params.push(date_from);
          }

          if (date_to) {
            query += ` AND DATE(s.emission_date) <= ?`;
            params.push(date_to);
          }

          if (customer_id) {
            query += ` AND s.customer_id = ?`;
            params.push(customer_id);
          }

          if (branch_id) {
            query += ` AND s.origin_branch_id = ?`;
            params.push(branch_id);
          }

          query += ` ORDER BY s.emission_date DESC LIMIT 100`;

          const result = await db.query(query, params);
          let shipments = result;
          if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
            shipments = result[0];
          }

          if (Array.isArray(shipments) && shipments.length > 0) {
            console.log(`✅ ${shipments.length} guías de remisión`);
            shipments.forEach(s => allDocuments.push(s));
          }
        } catch (error) {
          console.error('❌ Error guías:', error.message);
        }
      }

      // 5. DEVOLUCIONES
      if (!document_type || document_type === 'devolucion') {
        try {
          console.log('\n--- DEVOLUCIONES ---');

          let query = `
            SELECT
              sr.id,
              'devolucion' as type,
              sr.correlative as document_number,
              cn.credit_note_number,
              cn.correlative as credit_note_correlative,
              sr.emission_date,
              sr.customer_id,
              sr.customer_name,
              '' as customer_rtn,
              0 as seller_id,
              '' as seller_name,
              i.warehouse_id as branch_id,
              b.nombre as branch_name,
              sr.total,
              sr.subtotal,
              sr.discount,
              sr.tax,
              'completed' as status,
              CONCAT(u.first_name, ' ', u.last_name) as created_by_name
            FROM sales_returns sr
            LEFT JOIN credit_notes cn ON sr.id = cn.sales_return_id
            LEFT JOIN invoices i ON sr.invoice_id = i.id
            LEFT JOIN branches b ON i.warehouse_id = b.id
            LEFT JOIN users u ON sr.created_by = u.id
            WHERE 1=1 AND sr.return_type IN ('total', 'parcial')
          `;

          const params = [];

          if (date_from) {
            query += ` AND DATE(sr.emission_date) >= ?`;
            params.push(date_from);
          }

          if (date_to) {
            query += ` AND DATE(sr.emission_date) <= ?`;
            params.push(date_to);
          }

          if (customer_id) {
            query += ` AND sr.customer_id = ?`;
            params.push(customer_id);
          }

          if (branch_id) {
            query += ` AND i.warehouse_id = ?`;
            params.push(branch_id);
          }

          query += ` ORDER BY sr.emission_date DESC LIMIT 100`;

          const result = await db.query(query, params);
          let returns = result;
          if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
            returns = result[0];
          }

          console.log('📋 Resultado devoluciones:', returns?.length || 0, 'registros');
          if (Array.isArray(returns) && returns.length > 0) {
            console.log(`✅ ${returns.length} devoluciones`);
            returns.forEach(r => allDocuments.push(r));
          } else {
            console.log('⚠️ No se encontraron devoluciones en el rango de fechas');
          }
        } catch (error) {
          console.error('❌ Error devoluciones:', error.message);
        }
      }

      // 6. NOTAS DE CRÉDITO
      if (!document_type || document_type === 'nota_credito') {
        try {
          console.log('\n--- NOTAS DE CRÉDITO ---');

          let query = `
            SELECT
              sr.id,
              'nota_credito' as type,
              COALESCE(cn.credit_note_number, cn.correlative, sr.correlative) as document_number,
              cn.credit_note_number,
              cn.correlative as credit_note_correlative,
              sr.correlative,
              sr.emission_date,
              sr.customer_id,
              sr.customer_name,
              '' as customer_rtn,
              0 as seller_id,
              '' as seller_name,
              i.warehouse_id as branch_id,
              b.nombre as branch_name,
              sr.total,
              sr.subtotal,
              sr.discount,
              sr.tax,
              'completed' as status,
              CONCAT(u.first_name, ' ', u.last_name) as created_by_name
            FROM sales_returns sr
            LEFT JOIN credit_notes cn ON sr.id = cn.sales_return_id
            LEFT JOIN invoices i ON sr.invoice_id = i.id
            LEFT JOIN branches b ON i.warehouse_id = b.id
            LEFT JOIN users u ON sr.created_by = u.id
            WHERE 1=1 AND sr.return_type IN ('total', 'parcial') AND sr.affect_sales_book = 1
          `;

          const params = [];

          if (date_from) {
            query += ` AND DATE(sr.emission_date) >= ?`;
            params.push(date_from);
          }

          if (date_to) {
            query += ` AND DATE(sr.emission_date) <= ?`;
            params.push(date_to);
          }

          if (customer_id) {
            query += ` AND sr.customer_id = ?`;
            params.push(customer_id);
          }

          if (branch_id) {
            query += ` AND i.warehouse_id = ?`;
            params.push(branch_id);
          }

          query += ` ORDER BY sr.emission_date DESC LIMIT 100`;

          const result = await db.query(query, params);
          let creditNotes = result;
          if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
            creditNotes = result[0];
          }

          console.log('📋 Resultado notas de crédito:', creditNotes?.length || 0, 'registros');
          if (Array.isArray(creditNotes) && creditNotes.length > 0) {
            console.log(`✅ ${creditNotes.length} notas de crédito`);
            creditNotes.forEach(cn => allDocuments.push(cn));
          } else {
            console.log('⚠️ No se encontraron notas de crédito en el rango de fechas');
          }
        } catch (error) {
          console.error('❌ Error notas de crédito:', error.message);
        }
      }

      console.log(`\n📊 TOTAL: ${allDocuments.length} documentos`);

      // Ordenar por fecha
      allDocuments.sort((a, b) => {
        return new Date(b.emission_date) - new Date(a.emission_date);
      });

      // Formatear fechas - SUMAR 6 horas para compensar timezone
      allDocuments.forEach(doc => {
        if (doc.emission_date) {
          const d = new Date(doc.emission_date);
          d.setHours(d.getHours() + 6); // Sumar 6 horas
          doc.emission_date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
        }
        if (doc.issue_date) {
          const d = new Date(doc.issue_date);
          d.setHours(d.getHours() + 6); // Sumar 6 horas
          doc.issue_date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
        }
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
        message: 'Error al obtener documentos',
        error: error.message
      });
    }
  }

  /**
   * Obtener documento específico con items
   * GET /api/v1/account-statement/:type/:id
   */
  static async getDocumentById(req, res) {
    try {
      const { type, id } = req.params;
      console.log(`\n=== getDocumentById: ${type} #${id} ===`);

      let document = null;

      if (type === 'factura') {
        const result = await db.query(`
          SELECT
            inv.id,
            'factura' as type,
            inv.invoice_number as document_number,
            inv.issue_date as emission_date,
            inv.customer_id,
            inv.customer_name,
            inv.customer_rtn,
            inv.seller_id,
            inv.seller_name,
            inv.warehouse_id as branch_id,
            b.nombre as branch_name,
            inv.total,
            inv.subtotal,
            inv.discount_amount as discount,
            inv.tax_amount as tax,
            inv.payment_status as status,
            inv.orden_compra,
            inv.constancia_exonerado,
            inv.registro_sag,
            r.cai,
            r.numero_resolucion,
            r.nro_inicial_control,
            r.nro_final_control,
            r.fecha_fin,
            r.prefijo_control
          FROM invoices inv
          LEFT JOIN branches b ON inv.warehouse_id = b.id
          LEFT JOIN resolutions r ON inv.resolution_id = r.id
          WHERE inv.id = ?
        `, [id]);

        let invoices = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;

        if (invoices && invoices.length > 0) {
          document = invoices[0];

          const itemsResult = await db.query(`
            SELECT
              ii.id,
              ii.product_id,
              p.code as product_code,
              p.name as product_name,
              u.name as unit_name,
              ii.quantity,
              ii.unit_price,
              ii.discount_value,
              ii.tax_rate
            FROM invoice_items ii
            LEFT JOIN products p ON ii.product_id = p.id
            LEFT JOIN units u ON p.unit_id = u.id
            WHERE ii.invoice_id = ?
          `, [id]);

          let items = Array.isArray(itemsResult) && Array.isArray(itemsResult[0]) ? itemsResult[0] : itemsResult;
          document.items = items || [];
        }
      } else if (type === 'cotizacion') {
        const result = await db.query(`
          SELECT
            q.id,
            'cotizacion' as type,
            q.quote_number as document_number,
            q.quote_date as emission_date,
            q.customer_id,
            q.customer_name,
            q.customer_rtn,
            q.seller_id,
            q.seller_name,
            q.branch_id,
            b.nombre as branch_name,
            q.total,
            q.subtotal,
            q.discount,
            q.tax,
            q.status,
            q.orden_compra,
            q.constancia_exonerado,
            q.registro_sag
          FROM quotes q
          LEFT JOIN branches b ON q.branch_id = b.id
          WHERE q.id = ?
        `, [id]);

        let quotes = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;

        if (quotes && quotes.length > 0) {
          document = quotes[0];

          const itemsResult = await db.query(`
            SELECT
              qi.id,
              qi.product_id,
              p.code as product_code,
              p.name as product_name,
              u.name as unit_name,
              qi.quantity,
              qi.unit_price,
              qi.discount_value,
              qi.tax_rate
            FROM quote_items qi
            LEFT JOIN products p ON qi.product_id = p.id
            LEFT JOIN units u ON p.unit_id = u.id
            WHERE qi.quote_id = ?
          `, [id]);

          let items = Array.isArray(itemsResult) && Array.isArray(itemsResult[0]) ? itemsResult[0] : itemsResult;
          document.items = items || [];
        }
      } else if (type === 'factura_espera') {
        const result = await db.query(`
          SELECT
            p.id,
            'factura_espera' as type,
            p.document_number,
            p.created_at as emission_date,
            p.customer_id,
            p.customer_name,
            p.customer_rtn,
            p.seller_id,
            p.seller_name,
            p.branch_id,
            b.nombre as branch_name,
            p.total,
            p.subtotal,
            p.discount,
            p.tax,
            p.status,
            p.orden_compra,
            p.constancia_exonerado,
            p.registro_sag
          FROM pending_invoices p
          LEFT JOIN branches b ON p.branch_id = b.id
          WHERE p.id = ?
        `, [id]);

        let pending = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;

        if (pending && pending.length > 0) {
          document = pending[0];

          const itemsResult = await db.query(`
            SELECT
              pi.id,
              pi.product_id,
              p.code as product_code,
              p.name as product_name,
              u.name as unit_name,
              pi.quantity,
              pi.unit_price,
              pi.discount_value,
              pi.tax_rate
            FROM pending_invoice_items pi
            LEFT JOIN products p ON pi.product_id = p.id
            LEFT JOIN units u ON p.unit_id = u.id
            WHERE pi.pending_invoice_id = ?
          `, [id]);

          let items = Array.isArray(itemsResult) && Array.isArray(itemsResult[0]) ? itemsResult[0] : itemsResult;
          document.items = items || [];
        }
      } else if (type === 'guia_remision') {
        const result = await db.query(`
          SELECT
            s.id,
            'guia_remision' as type,
            s.shipment_number as document_number,
            s.emission_date,
            s.customer_id,
            s.customer_name,
            '' as customer_rtn,
            0 as seller_id,
            '' as seller_name,
            s.origin_branch_id as branch_id,
            b.nombre as branch_name,
            COALESCE(s.declared_value, 0) as total,
            0 as subtotal,
            0 as discount,
            0 as tax,
            s.status
          FROM shipments s
          LEFT JOIN branches b ON s.origin_branch_id = b.id
          WHERE s.id = ?
        `, [id]);

        let shipments = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;

        if (shipments && shipments.length > 0) {
          document = shipments[0];

          const itemsResult = await db.query(`
            SELECT
              si.id,
              si.product_id,
              p.code as product_code,
              p.name as product_name,
              u.name as unit_name,
              si.quantity,
              0 as unit_price,
              0 as discount_value,
              0 as tax_rate
            FROM shipment_items si
            LEFT JOIN products p ON si.product_id = p.id
            LEFT JOIN units u ON p.unit_id = u.id
            WHERE si.shipment_id = ?
          `, [id]);

          let items = Array.isArray(itemsResult) && Array.isArray(itemsResult[0]) ? itemsResult[0] : itemsResult;
          document.items = items || [];
        }
      } else if (type === 'devolucion' || type === 'nota_credito') {
        const result = await db.query(`
          SELECT
            sr.id,
            ? as type,
            sr.correlative as document_number,
            cn.credit_note_number,
            cn.correlative as credit_note_correlative,
            sr.emission_date,
            sr.customer_id,
            sr.customer_name,
            i.customer_rtn,
            0 as seller_id,
            '' as seller_name,
            i.warehouse_id as branch_id,
            b.nombre as branch_name,
            sr.total,
            sr.subtotal,
            sr.discount,
            sr.tax,
            sr.invoice_number,
            sr.notes,
            'completed' as status,
            CONCAT(u.first_name, ' ', u.last_name) as created_by_name
          FROM sales_returns sr
          LEFT JOIN credit_notes cn ON sr.id = cn.sales_return_id
          LEFT JOIN invoices i ON sr.invoice_id = i.id
          LEFT JOIN branches b ON i.warehouse_id = b.id
          LEFT JOIN users u ON sr.created_by = u.id
          WHERE sr.id = ?
        `, [type, id]);

        let returns = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;

        if (returns && returns.length > 0) {
          document = returns[0];
          // Si es nota de crédito, usar el correlativo de la nota, sino usar el de la devolución
          if (type === 'nota_credito') {
            document.correlative = document.credit_note_correlative || document.credit_note_number || document.document_number;
          } else {
            document.correlative = document.document_number;
          }

          const itemsResult = await db.query(`
            SELECT
              sri.id,
              sri.product_id,
              p.code as product_code,
              p.name as product_name,
              u.name as unit_name,
              sri.quantity,
              sri.unit_price,
              sri.discount_value,
              sri.tax_rate
            FROM sales_return_items sri
            LEFT JOIN products p ON sri.product_id = p.id
            LEFT JOIN units u ON p.unit_id = u.id
            WHERE sri.sales_return_id = ?
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

      // Formatear fechas - SUMAR 6 horas para compensar timezone
      if (document.emission_date) {
        const d = new Date(document.emission_date);
        d.setHours(d.getHours() + 6);
        document.emission_date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
      }
      if (document.issue_date) {
        const d = new Date(document.issue_date);
        d.setHours(d.getHours() + 6);
        document.issue_date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
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

module.exports = AccountStatementController;
