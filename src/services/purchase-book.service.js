// ===================================================================
// PROSPERPOS - SERVICIO DE LIBRO DE COMPRAS
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class PurchaseBookService {
  /**
   * Obtener reporte del libro de compras con filtros
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Object>} Datos del libro de compras
   */
  static async getPurchaseBook(filters = {}) {
    try {
      const {
        date_from,
        date_to,
        supplier_id,
        payment_status,
        show_only_returns = false
      } = filters;

      let whereConditions = ['p.deleted_at IS NULL'];
      const params = [];

      // Filtro de fechas
      if (date_from) {
        whereConditions.push('DATE(p.purchase_date) >= ?');
        params.push(date_from);
      }

      if (date_to) {
        whereConditions.push('DATE(p.purchase_date) <= ?');
        params.push(date_to);
      }

      // Filtro de proveedor
      if (supplier_id) {
        whereConditions.push('p.supplier_name = ?');
        params.push(supplier_id);
      }

      // Filtro de estado de pago
      if (payment_status && payment_status.length > 0) {
        if (Array.isArray(payment_status)) {
          const placeholders = payment_status.map(() => '?').join(',');
          whereConditions.push(`p.payment_status IN (${placeholders})`);
          params.push(...payment_status);
        } else {
          whereConditions.push('p.payment_status = ?');
          params.push(payment_status);
        }
      }

      // Filtro de solo devoluciones
      if (show_only_returns === true || show_only_returns === 'true') {
        whereConditions.push('p.status = ?');
        params.push('returned');
      }

      const whereClause = whereConditions.join(' AND ');

      // Query para obtener compras - Solo campos requeridos
      const query = `
        SELECT
          p.id,
          DATE_FORMAT(p.purchase_date, '%d/%m/%Y %H:%i:%S') as fecha,
          p.purchase_date as fecha_raw,
          COALESCE(p.purchase_number, CONCAT('COMP-', LPAD(p.id, 6, '0'))) as numero_factura,
          COALESCE(p.supplier_name, 'N/A') as proveedor,
          COALESCE(p.supplier_id_number, '') as rtn_proveedor,
          COALESCE(p.net_amount, 0) as subtotal,
          COALESCE(p.discount_amount, 0) as descuento,
          COALESCE(p.surcharge_amount, 0) as recargo,
          COALESCE(p.tax_amount, 0) as isv,
          COALESCE(p.total_amount, 0) as total,
          CASE
            WHEN p.status = 'Returned' THEN 'DEVUELTO'
            WHEN p.status = 'Completed' THEN 'COMPLETADO'
            ELSE UPPER(p.status)
          END as estatus,
          p.status as estatus_raw,
          COALESCE(CONCAT(u.first_name, ' ', u.last_name), u.username, 'Sistema') as usuario

        FROM purchases_documents p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE ${whereClause}
        ORDER BY p.purchase_date DESC
      `;

      const purchases = await db.execute(query, params);

      // Calcular totales generales
      const totals = {
        total_registros: purchases.length,
        total_compras: 0,
        total_devoluciones: 0,
        subtotal_total: 0,
        isv_total: 0,
        total_total: 0,
        total_devuelto: 0
      };

      purchases.forEach(purchase => {
        if (purchase.estatus_raw === 'Returned') {
          totals.total_devoluciones += 1;
          totals.total_devuelto += parseFloat(purchase.total || 0);
        } else {
          totals.total_compras += 1;
        }

        totals.subtotal_total += parseFloat(purchase.subtotal || 0);
        totals.isv_total += parseFloat(purchase.isv || 0);
        totals.total_total += parseFloat(purchase.total || 0);
      });

      // Redondear totales a 2 decimales
      totals.subtotal_total = parseFloat(totals.subtotal_total.toFixed(2));
      totals.isv_total = parseFloat(totals.isv_total.toFixed(2));
      totals.total_total = parseFloat(totals.total_total.toFixed(2));
      totals.total_devuelto = parseFloat(totals.total_devuelto.toFixed(2));

      return {
        purchases,
        totals,
        filters: {
          date_from: date_from || null,
          date_to: date_to || null,
          supplier_id: supplier_id || null,
          payment_status: payment_status || null,
          show_only_returns: show_only_returns || false
        }
      };
    } catch (error) {
      logger.error('Error in PurchaseBookService.getPurchaseBook:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen agrupado del libro de compras
   * @param {Object} filters - Filtros de búsqueda
   * @param {string} groupBy - Campo por el cual agrupar (day, week, month, warehouse, supplier)
   * @returns {Promise<Object>} Resumen agrupado
   */
  static async getPurchaseBookSummary(filters = {}, groupBy = 'day') {
    try {
      const {
        date_from,
        date_to,
        supplier_id,
        payment_status
      } = filters;

      let whereConditions = ['p.deleted_at IS NULL'];
      const params = [];

      // Filtro de fechas
      if (date_from) {
        whereConditions.push('DATE(p.purchase_date) >= ?');
        params.push(date_from);
      }

      if (date_to) {
        whereConditions.push('DATE(p.purchase_date) <= ?');
        params.push(date_to);
      }

      // Filtro de proveedor
      if (supplier_id) {
        whereConditions.push('p.supplier_name = ?');
        params.push(supplier_id);
      }

      // Filtro de estado de pago
      if (payment_status && payment_status.length > 0) {
        if (Array.isArray(payment_status)) {
          const placeholders = payment_status.map(() => '?').join(',');
          whereConditions.push(`p.payment_status IN (${placeholders})`);
          params.push(...payment_status);
        } else {
          whereConditions.push('p.payment_status = ?');
          params.push(payment_status);
        }
      }

      const whereClause = whereConditions.join(' AND ');

      let groupByClause, selectClause;

      switch (groupBy) {
        case 'day':
          selectClause = `DATE(p.purchase_date) as group_key, DATE_FORMAT(p.purchase_date, '%d/%m/%Y') as group_label`;
          groupByClause = 'DATE(p.purchase_date)';
          break;
        case 'week':
          selectClause = `YEARWEEK(p.purchase_date) as group_key, CONCAT('Semana ', WEEK(p.purchase_date), ' - ', YEAR(p.purchase_date)) as group_label`;
          groupByClause = 'YEARWEEK(p.purchase_date)';
          break;
        case 'month':
          selectClause = `DATE_FORMAT(p.purchase_date, '%Y-%m') as group_key, DATE_FORMAT(p.purchase_date, '%M %Y') as group_label`;
          groupByClause = 'DATE_FORMAT(p.purchase_date, \'%Y-%m\')';
          break;
        case 'supplier':
          selectClause = `p.supplier_name as group_key, p.supplier_name as group_label`;
          groupByClause = 'p.supplier_name';
          break;
        default:
          selectClause = `DATE(p.purchase_date) as group_key, DATE_FORMAT(p.purchase_date, '%d/%m/%Y') as group_label`;
          groupByClause = 'DATE(p.purchase_date)';
      }

      const query = `
        SELECT
          ${selectClause},
          COUNT(*) as total_compras,
          COALESCE(SUM(p.net_amount), 0) as subtotal_total,
          COALESCE(SUM(p.tax_amount), 0) as isv_total,
          COALESCE(SUM(p.total_amount), 0) as total_total
        FROM purchases_documents p
        WHERE ${whereClause}
        GROUP BY ${groupByClause}
        ORDER BY group_key DESC
      `;

      const summary = await db.execute(query, params);

      // Calcular gran total
      const grandTotal = {
        total_compras: 0,
        subtotal_total: 0,
        isv_total: 0,
        total_total: 0
      };

      summary.forEach(row => {
        grandTotal.total_compras += parseInt(row.total_compras || 0);
        grandTotal.subtotal_total += parseFloat(row.subtotal_total || 0);
        grandTotal.isv_total += parseFloat(row.isv_total || 0);
        grandTotal.total_total += parseFloat(row.total_total || 0);
      });

      // Redondear totales
      grandTotal.subtotal_total = parseFloat(grandTotal.subtotal_total.toFixed(2));
      grandTotal.isv_total = parseFloat(grandTotal.isv_total.toFixed(2));
      grandTotal.total_total = parseFloat(grandTotal.total_total.toFixed(2));

      return {
        summary,
        grandTotal,
        groupBy
      };
    } catch (error) {
      logger.error('Error in PurchaseBookService.getPurchaseBookSummary:', error);
      throw error;
    }
  }

  /**
   * Exportar libro de compras a formato Excel/CSV
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Object>} Datos formateados para exportación
   */
  static async exportPurchaseBook(filters = {}) {
    try {
      const { purchases, totals } = await this.getPurchaseBook(filters);

      // Formatear datos para exportación
      const exportData = purchases.map(purchase => ({
        'Fecha': purchase.fecha,
        'Número Factura': purchase.numero_factura,
        'Proveedor': purchase.proveedor,
        'RTN': purchase.rtn_proveedor,
        'Subtotal': purchase.subtotal,
        'ISV': purchase.isv,
        'Total': purchase.total,
        'Estatus': purchase.estatus,
        'Usuario': purchase.usuario
      }));

      return {
        data: exportData,
        totals,
        filename: `libro_compras_${new Date().toISOString().split('T')[0]}.xlsx`
      };
    } catch (error) {
      logger.error('Error in PurchaseBookService.exportPurchaseBook:', error);
      throw error;
    }
  }
}

module.exports = PurchaseBookService;
