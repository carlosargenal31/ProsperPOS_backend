// ===================================================================
// PROSPERPOS - SERVICIO DE LIBRO DE VENTAS
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class SalesBookService {
  /**
   * Obtener reporte del libro de ventas con filtros
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Object>} Datos del libro de ventas
   */
  static async getSalesBook(filters = {}) {
    try {
      const {
        date_from,
        date_to,
        agency_id,
        customer_id,
        customer_type,
        document_type = 'FACTURA',
        seller_id,
        payment_status,
        show_only_returns = false
      } = filters;

      let whereConditions = ['i.deleted_at IS NULL'];
      const params = [];

      // Filtro de fechas
      if (date_from) {
        whereConditions.push('DATE(i.issue_date) >= ?');
        params.push(date_from);
      }

      if (date_to) {
        whereConditions.push('DATE(i.issue_date) <= ?');
        params.push(date_to);
      }

      // Filtro de almacén/agencia
      if (agency_id) {
        whereConditions.push('i.warehouse_id = ?');
        params.push(agency_id);
      }

      // Filtro de cliente
      if (customer_id) {
        whereConditions.push('i.customer_id = ?');
        params.push(customer_id);
      }

      // Filtro de tipo de cliente
      if (customer_type) {
        if (customer_type === 'CONSUMIDOR_FINAL') {
          whereConditions.push('(i.customer_rtn IS NULL OR i.customer_rtn = \'\')');
        } else if (customer_type === 'CONTRIBUYENTE') {
          whereConditions.push('(i.customer_rtn IS NOT NULL AND i.customer_rtn != \'\')');
        }
      }

      // Filtro de tipo de documento
      if (document_type) {
        whereConditions.push('i.invoice_type = ?');
        params.push(document_type.toLowerCase());
      }

      // Filtro de vendedor
      if (seller_id) {
        whereConditions.push('i.seller_id = ?');
        params.push(seller_id);
      }

      // Filtro de estado de pago
      if (payment_status && payment_status.length > 0) {
        if (Array.isArray(payment_status)) {
          const placeholders = payment_status.map(() => '?').join(',');
          whereConditions.push(`i.payment_status IN (${placeholders})`);
          params.push(...payment_status);
        } else {
          whereConditions.push('i.payment_status = ?');
          params.push(payment_status);
        }
      }

      // Filtro de solo devoluciones
      if (show_only_returns === true || show_only_returns === 'true') {
        whereConditions.push('i.payment_status = ?');
        params.push('returned');
      }

      const whereClause = whereConditions.join(' AND ');

      // Query para obtener facturas y sus devoluciones como filas separadas
      const query = `
        SELECT
          i.id,
          DATE_FORMAT(i.issue_date, '%d/%m/%Y %H:%i:%S') as fecha_operacion,
          i.issue_date as fecha_operacion_raw,
          COALESCE(b.nombre, 'N/A') as sucursal,
          UPPER(i.invoice_type) as tipo_documento,
          i.invoice_number as nro_documento,
          COALESCE(i.resolution_number, '') as nro_autorizacion,
          CASE
            WHEN i.customer_rtn IS NULL OR i.customer_rtn = '' THEN 'CONSUMIDOR FINAL'
            ELSE i.customer_name
          END as razon_social,
          COALESCE(i.customer_rtn, '') as rtn_cliente,
          CASE
            WHEN i.payment_status = 'paid' THEN 'COBRADO'
            WHEN i.payment_status = 'partial' THEN 'ABONOS'
            WHEN i.payment_status = 'pending' THEN 'PENDIENTE'
            WHEN i.payment_status = 'returned' THEN 'DEVUELTO'
            ELSE UPPER(i.payment_status)
          END as estatus,
          i.payment_status as estatus_raw,
          COALESCE(i.subtotal, 0) as subtotal,
          COALESCE(i.discount_amount, 0) as descuento,
          COALESCE(i.shipping_cost, 0) as recargos,
          COALESCE(i.tax_amount, 0) as impuesto,
          COALESCE(i.total, 0) as total,
          COALESCE(i.seller_name, u.username, 'N/A') as vendedor,
          'FACTURA' as tipo_fila

        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        LEFT JOIN branches b ON i.branch_id = b.id
        LEFT JOIN users u ON i.seller_id = u.id
        WHERE ${whereClause}

        UNION ALL

        SELECT
          CONCAT('CN-', cn.id) as id,
          DATE_FORMAT(cn.emission_date, '%d/%m/%Y %H:%i:%S') as fecha_operacion,
          cn.emission_date as fecha_operacion_raw,
          COALESCE(b.nombre, 'N/A') as sucursal,
          'DEVOLUCION' as tipo_documento,
          CONCAT('DEV-', LPAD(cn.id, 6, '0')) as nro_documento,
          COALESCE(cn.authorization_number, '') as nro_autorizacion,
          CASE
            WHEN cn.customer_rtn IS NULL OR cn.customer_rtn = '' THEN 'CONSUMIDOR FINAL'
            ELSE cn.customer_name
          END as razon_social,
          COALESCE(cn.customer_rtn, '') as rtn_cliente,
          CONCAT('NC-', COALESCE(cn.credit_note_number, LPAD(cn.id, 6, '0')), ' - DEVUELTO') as estatus,
          'returned' as estatus_raw,
          -COALESCE(cn.subtotal, 0) as subtotal,
          -COALESCE(cn.discount, 0) as descuento,
          0 as recargos,
          -COALESCE(cn.tax, 0) as impuesto,
          -COALESCE(cn.total, 0) as total,
          COALESCE(CONCAT(u.first_name, ' ', u.last_name), u.username, 'N/A') as vendedor,
          'DEVOLUCION' as tipo_fila

        FROM credit_notes cn
        LEFT JOIN invoices i ON cn.invoice_id = i.id
        LEFT JOIN branches b ON i.branch_id = b.id
        LEFT JOIN users u ON cn.created_by = u.id
        WHERE cn.deleted_at IS NULL
        AND DATE(cn.emission_date) >= ?
        AND DATE(cn.emission_date) <= ?

        ORDER BY fecha_operacion_raw DESC
      `;

      // Agregar parámetros para la segunda parte del UNION (notas de crédito)
      const allParams = [...params, date_from || '1900-01-01', date_to || '2100-12-31'];

      const invoices = await db.execute(query, allParams);

      // Calcular totales generales separando facturas de devoluciones
      const totals = {
        total_registros: invoices.length,
        total_facturas: 0,  // Solo facturas, sin devoluciones
        total_devoluciones: 0,  // Solo devoluciones
        total_devuelto: 0,  // Monto total devuelto (valor absoluto)
        subtotal_total: 0,
        descuento_total: 0,
        recargos_total: 0,
        impuesto_total: 0,
        total_total: 0,
        abonado_total: 0,
        saldo_total: 0
      };

      invoices.forEach(invoice => {
        // Contar facturas vs devoluciones
        if (invoice.tipo_fila === 'FACTURA') {
          totals.total_facturas += 1;
        } else if (invoice.tipo_fila === 'DEVOLUCION') {
          totals.total_devoluciones += 1;
          // Total devuelto es el valor absoluto del total de devoluciones
          totals.total_devuelto += Math.abs(parseFloat(invoice.total || 0));
        }

        totals.subtotal_total += parseFloat(invoice.subtotal || 0);
        totals.descuento_total += parseFloat(invoice.descuento || 0);
        totals.recargos_total += parseFloat(invoice.recargos || 0);
        totals.impuesto_total += parseFloat(invoice.impuesto || 0);
        totals.total_total += parseFloat(invoice.total || 0);
        totals.abonado_total += parseFloat(invoice.abonado || 0);
        totals.saldo_total += parseFloat(invoice.saldo || 0);
      });

      // Redondear totales a 2 decimales
      Object.keys(totals).forEach(key => {
        if (!['total_registros', 'total_facturas', 'total_devoluciones'].includes(key)) {
          totals[key] = parseFloat(totals[key].toFixed(2));
        }
      });

      return {
        invoices,
        totals,
        filters: {
          date_from: date_from || null,
          date_to: date_to || null,
          agency_id: agency_id || null,
          customer_id: customer_id || null,
          document_type: document_type || null,
          seller_id: seller_id || null,
          payment_status: payment_status || null,
          show_only_returns: show_only_returns || false
        }
      };
    } catch (error) {
      logger.error('Error in SalesBookService.getSalesBook:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen agrupado del libro de ventas
   * @param {Object} filters - Filtros de búsqueda
   * @param {string} groupBy - Campo por el cual agrupar (day, week, month, agency, seller, customer)
   * @returns {Promise<Object>} Resumen agrupado
   */
  static async getSalesBookSummary(filters = {}, groupBy = 'day') {
    try {
      const {
        date_from,
        date_to,
        agency_id,
        seller_id,
        payment_status
      } = filters;

      let whereConditions = ['i.deleted_at IS NULL'];
      const params = [];

      // Filtro de fechas
      if (date_from) {
        whereConditions.push('DATE(i.issue_date) >= ?');
        params.push(date_from);
      }

      if (date_to) {
        whereConditions.push('DATE(i.issue_date) <= ?');
        params.push(date_to);
      }

      // Filtro de almacén/agencia
      if (agency_id) {
        whereConditions.push('i.warehouse_id = ?');
        params.push(agency_id);
      }

      // Filtro de vendedor
      if (seller_id) {
        whereConditions.push('i.seller_id = ?');
        params.push(seller_id);
      }

      // Filtro de estado de pago
      if (payment_status && payment_status.length > 0) {
        if (Array.isArray(payment_status)) {
          const placeholders = payment_status.map(() => '?').join(',');
          whereConditions.push(`i.payment_status IN (${placeholders})`);
          params.push(...payment_status);
        } else {
          whereConditions.push('i.payment_status = ?');
          params.push(payment_status);
        }
      }

      const whereClause = whereConditions.join(' AND ');

      let groupByClause, selectClause;

      switch (groupBy) {
        case 'day':
          selectClause = `DATE(i.issue_date) as group_key, DATE_FORMAT(i.issue_date, '%d/%m/%Y') as group_label`;
          groupByClause = 'DATE(i.issue_date)';
          break;
        case 'week':
          selectClause = `YEARWEEK(i.issue_date) as group_key, CONCAT('Semana ', WEEK(i.issue_date), ' - ', YEAR(i.issue_date)) as group_label`;
          groupByClause = 'YEARWEEK(i.issue_date)';
          break;
        case 'month':
          selectClause = `DATE_FORMAT(i.issue_date, '%Y-%m') as group_key, DATE_FORMAT(i.issue_date, '%M %Y') as group_label`;
          groupByClause = 'DATE_FORMAT(i.issue_date, \'%Y-%m\')';
          break;
        case 'agency':
          selectClause = `i.warehouse_id as group_key, w.nombre as group_label`;
          groupByClause = 'i.warehouse_id';
          break;
        case 'seller':
          selectClause = `i.seller_id as group_key, COALESCE(i.seller_name, u.username) as group_label`;
          groupByClause = 'i.seller_id';
          break;
        case 'customer':
          selectClause = `i.customer_id as group_key, COALESCE(c.nombre, i.customer_name) as group_label`;
          groupByClause = 'i.customer_id';
          break;
        default:
          selectClause = `DATE(i.issue_date) as group_key, DATE_FORMAT(i.issue_date, '%d/%m/%Y') as group_label`;
          groupByClause = 'DATE(i.issue_date)';
      }

      const query = `
        SELECT
          ${selectClause},
          COUNT(*) as total_facturas,
          COALESCE(SUM(i.subtotal), 0) as subtotal_total,
          COALESCE(SUM(i.discount_amount), 0) as descuento_total,
          COALESCE(SUM(i.tax_amount), 0) as impuesto_total,
          COALESCE(SUM(i.total), 0) as total_total,
          COALESCE(SUM(i.paid_amount), 0) as abonado_total,
          COALESCE(SUM(i.balance_due), 0) as saldo_total
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        LEFT JOIN warehouses w ON i.warehouse_id = w.id
        LEFT JOIN users u ON i.seller_id = u.id
        WHERE ${whereClause}
        GROUP BY ${groupByClause}
        ORDER BY group_key DESC
      `;

      const summary = await db.execute(query, params);

      // Calcular gran total
      const grandTotal = {
        total_facturas: 0,
        subtotal_total: 0,
        descuento_total: 0,
        impuesto_total: 0,
        total_total: 0,
        abonado_total: 0,
        saldo_total: 0
      };

      summary.forEach(row => {
        grandTotal.total_facturas += parseInt(row.total_facturas || 0);
        grandTotal.subtotal_total += parseFloat(row.subtotal_total || 0);
        grandTotal.descuento_total += parseFloat(row.descuento_total || 0);
        grandTotal.impuesto_total += parseFloat(row.impuesto_total || 0);
        grandTotal.total_total += parseFloat(row.total_total || 0);
        grandTotal.abonado_total += parseFloat(row.abonado_total || 0);
        grandTotal.saldo_total += parseFloat(row.saldo_total || 0);
      });

      // Redondear totales
      Object.keys(grandTotal).forEach(key => {
        if (key !== 'total_facturas') {
          grandTotal[key] = parseFloat(grandTotal[key].toFixed(2));
        }
      });

      return {
        summary,
        grandTotal,
        groupBy
      };
    } catch (error) {
      logger.error('Error in SalesBookService.getSalesBookSummary:', error);
      throw error;
    }
  }

  /**
   * Exportar libro de ventas a formato Excel/CSV
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Object>} Datos formateados para exportación
   */
  static async exportSalesBook(filters = {}) {
    try {
      const { invoices, totals } = await this.getSalesBook(filters);

      // Formatear datos para exportación
      const exportData = invoices.map(invoice => ({
        'Fecha': invoice.fecha_operacion,
        'Agencia': invoice.agencia || 'N/A',
        'Tipo Doc': invoice.tipo_documento,
        'Nro Doc': invoice.nro_documento,
        'Nro Autorización': invoice.nro_autorizacion,
        'Razón Social': invoice.razon_social,
        'RTN': invoice.rtn_cliente,
        'Estatus': invoice.estatus,
        'Subtotal': invoice.subtotal,
        'Descuento': invoice.descuento,
        'Impuesto': invoice.impuesto,
        'Total': invoice.total,
        'Abonado': invoice.abonado,
        'Saldo': invoice.saldo,
        'Vendedor': invoice.vendedor
      }));

      return {
        data: exportData,
        totals,
        filename: `libro_ventas_${new Date().toISOString().split('T')[0]}.xlsx`
      };
    } catch (error) {
      logger.error('Error in SalesBookService.exportSalesBook:', error);
      throw error;
    }
  }
}

module.exports = SalesBookService;
