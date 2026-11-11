// ===================================================================
// PROSPERPOS - SERVICIO DE REPORTE DE PROVEEDORES
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class SupplierReportService {
  /**
   * Obtener reporte de compras por proveedor
   * Muestra totales de compras agrupados por proveedor
   */
  static async getPurchasesBySupplier(filters = {}) {
    try {
      const {
        date_from,
        date_to,
        supplier_id,
        agency,
        document_type,
        status
      } = filters;

      let whereConditions = ['pd.deleted_at IS NULL'];
      const params = [];

      // Filtros de fecha
      if (date_from) {
        whereConditions.push('DATE(pd.purchase_date) >= ?');
        params.push(date_from);
      }

      if (date_to) {
        whereConditions.push('DATE(pd.purchase_date) <= ?');
        params.push(date_to);
      }

      // Filtro de proveedor específico
      if (supplier_id && supplier_id !== 'all') {
        whereConditions.push('pd.supplier_name = ?');
        params.push(supplier_id);
      }

      // Filtro de agencia
      if (agency && agency !== 'all') {
        whereConditions.push('pd.agency = ?');
        params.push(agency);
      }

      // Filtro de tipo de documento
      if (document_type && document_type !== 'all') {
        whereConditions.push('pd.document_type = ?');
        params.push(document_type);
      }

      // Filtro de estado
      if (status && status !== 'all') {
        whereConditions.push('pd.status = ?');
        params.push(status);
      }

      const whereClause = whereConditions.join(' AND ');

      // Query principal - agrupar por proveedor con devoluciones
      const query = `
        SELECT
          COALESCE(pd.supplier_name, 'SIN PROVEEDOR') as supplier_name,
          pd.supplier_id_number,
          COUNT(DISTINCT CASE WHEN pd.status != 'Returned' THEN pd.id END) as total_purchases,
          SUM(CASE WHEN pd.status != 'Returned' THEN pd.net_amount ELSE 0 END) as total_neto,
          SUM(CASE WHEN pd.status != 'Returned' THEN pd.tax_amount ELSE 0 END) as total_isv,
          SUM(CASE WHEN pd.status != 'Returned' THEN (pd.net_amount + pd.tax_amount) ELSE 0 END) as total_con_isv,
          SUM(CASE WHEN pd.status = 'Returned' THEN pd.total_amount ELSE 0 END) as devuelto,
          SUM(CASE WHEN pd.status != 'Returned' THEN pd.discount_amount ELSE 0 END) as total_descuento
        FROM purchases_documents pd
        WHERE ${whereClause}
        GROUP BY pd.supplier_name, pd.supplier_id_number
        ORDER BY total_con_isv DESC
      `;

      const results = await db.query(query, params);

      // Calcular totales generales
      const totals = {
        total_neto: 0,
        total_isv: 0,
        total_con_isv: 0,
        devuelto: 0,
        total_descuento: 0,
        total_purchases: 0,
        total_suppliers: results.length
      };

      results.forEach(row => {
        totals.total_neto += parseFloat(row.total_neto) || 0;
        totals.total_isv += parseFloat(row.total_isv) || 0;
        totals.total_con_isv += parseFloat(row.total_con_isv) || 0;
        totals.devuelto += parseFloat(row.devuelto) || 0;
        totals.total_descuento += parseFloat(row.total_descuento) || 0;
        totals.total_purchases += parseInt(row.total_purchases) || 0;
      });

      return {
        suppliers: results,
        totals,
        filters: {
          date_from: date_from || null,
          date_to: date_to || null,
          supplier_id: supplier_id || 'all',
          agency: agency || 'all',
          document_type: document_type || 'all',
          status: status || 'all'
        }
      };
    } catch (error) {
      logger.error('Error in SupplierReportService.getPurchasesBySupplier:', error);
      throw error;
    }
  }

  /**
   * Obtener detalle de compras por proveedor específico
   * Muestra todas las compras de un proveedor con detalles
   */
  static async getSupplierPurchasesDetail(supplier_name, filters = {}) {
    try {
      const {
        date_from,
        date_to,
        document_type,
        status
      } = filters;

      let whereConditions = [
        'pd.deleted_at IS NULL',
        'pd.supplier_name = ?'
      ];
      const params = [supplier_name];

      if (date_from) {
        whereConditions.push('DATE(pd.purchase_date) >= ?');
        params.push(date_from);
      }

      if (date_to) {
        whereConditions.push('DATE(pd.purchase_date) <= ?');
        params.push(date_to);
      }

      if (document_type && document_type !== 'all') {
        whereConditions.push('pd.document_type = ?');
        params.push(document_type);
      }

      if (status && status !== 'all') {
        whereConditions.push('pd.status = ?');
        params.push(status);
      }

      const whereClause = whereConditions.join(' AND ');

      const query = `
        SELECT
          pd.id,
          pd.purchase_number,
          pd.purchase_date,
          pd.document_type,
          pd.invoice_number,
          pd.agency,
          pd.net_amount,
          pd.discount_amount,
          pd.surcharge_amount,
          pd.tax_amount,
          pd.total_amount,
          pd.status,
          pd.notes,
          pd.created_at,
          COALESCE(CONCAT(u.first_name, ' ', u.last_name), u.username, 'Sistema') as created_by_name
        FROM purchases_documents pd
        LEFT JOIN users u ON pd.created_by = u.id
        WHERE ${whereClause}
        ORDER BY pd.purchase_date DESC, pd.created_at DESC
      `;

      const purchases = await db.query(query, params);

      // Calcular totales del proveedor
      const totalsQuery = `
        SELECT
          COUNT(*) as total_purchases,
          SUM(pd.net_amount) as total_neto,
          SUM(pd.tax_amount) as total_isv,
          SUM(pd.total_amount) as total_con_isv,
          SUM(pd.discount_amount) as total_descuento,
          SUM(pd.surcharge_amount) as total_recargo
        FROM purchases_documents pd
        WHERE ${whereClause}
      `;

      const totalsResult = await db.query(totalsQuery, params);
      const totals = totalsResult[0] || {
        total_purchases: 0,
        total_neto: 0,
        total_isv: 0,
        total_con_isv: 0,
        total_descuento: 0,
        total_recargo: 0
      };

      // Obtener info del proveedor
      const supplierQuery = `
        SELECT DISTINCT
          supplier_name,
          supplier_id_number
        FROM purchases_documents
        WHERE supplier_name = ? AND deleted_at IS NULL
        LIMIT 1
      `;

      const supplierResult = await db.query(supplierQuery, [supplier_name]);
      const supplierInfo = supplierResult[0] || {
        supplier_name,
        supplier_id_number: null
      };

      return {
        supplier: supplierInfo,
        purchases,
        totals,
        filters: {
          date_from: date_from || null,
          date_to: date_to || null,
          document_type: document_type || 'all',
          status: status || 'all'
        }
      };
    } catch (error) {
      logger.error('Error in SupplierReportService.getSupplierPurchasesDetail:', error);
      throw error;
    }
  }

  /**
   * Obtener lista de proveedores para filtros
   */
  static async getSuppliersList() {
    try {
      const query = `
        SELECT DISTINCT
          supplier_name,
          supplier_id_number
        FROM purchases_documents
        WHERE supplier_name IS NOT NULL
          AND deleted_at IS NULL
        ORDER BY supplier_name ASC
      `;

      const suppliers = await db.query(query);
      return suppliers;
    } catch (error) {
      logger.error('Error in SupplierReportService.getSuppliersList:', error);
      throw error;
    }
  }

  /**
   * Obtener top proveedores por monto de compras
   */
  static async getTopSuppliers(filters = {}) {
    try {
      const {
        date_from,
        date_to,
        limit = 10
      } = filters;

      let whereConditions = ['pd.deleted_at IS NULL'];
      const params = [];

      if (date_from) {
        whereConditions.push('DATE(pd.purchase_date) >= ?');
        params.push(date_from);
      }

      if (date_to) {
        whereConditions.push('DATE(pd.purchase_date) <= ?');
        params.push(date_to);
      }

      const whereClause = whereConditions.join(' AND ');

      const query = `
        SELECT
          pd.supplier_name,
          pd.supplier_id_number,
          COUNT(DISTINCT pd.id) as total_purchases,
          SUM(pd.total_amount) as total_amount,
          SUM(pd.net_amount) as total_neto,
          SUM(pd.tax_amount) as total_isv,
          AVG(pd.total_amount) as promedio_compra,
          MIN(pd.purchase_date) as primera_compra,
          MAX(pd.purchase_date) as ultima_compra
        FROM purchases_documents pd
        WHERE ${whereClause}
        GROUP BY pd.supplier_name, pd.supplier_id_number
        ORDER BY total_amount DESC
        LIMIT ?
      `;

      params.push(parseInt(limit));
      const results = await db.query(query, params);

      return {
        top_suppliers: results,
        filters: {
          date_from: date_from || null,
          date_to: date_to || null,
          limit: parseInt(limit)
        }
      };
    } catch (error) {
      logger.error('Error in SupplierReportService.getTopSuppliers:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de compras por periodo
   */
  static async getPurchasesByPeriod(filters = {}) {
    try {
      const {
        date_from,
        date_to,
        period = 'month', // day, week, month, year
        supplier_id
      } = filters;

      let whereConditions = ['pd.deleted_at IS NULL'];
      const params = [];

      if (date_from) {
        whereConditions.push('DATE(pd.purchase_date) >= ?');
        params.push(date_from);
      }

      if (date_to) {
        whereConditions.push('DATE(pd.purchase_date) <= ?');
        params.push(date_to);
      }

      if (supplier_id && supplier_id !== 'all') {
        whereConditions.push('pd.supplier_name = ?');
        params.push(supplier_id);
      }

      const whereClause = whereConditions.join(' AND ');

      // Determinar el formato de agrupación según el periodo
      let dateFormat;
      let groupBy;
      switch (period) {
        case 'day':
          dateFormat = "DATE_FORMAT(pd.purchase_date, '%Y-%m-%d')";
          groupBy = 'DATE(pd.purchase_date)';
          break;
        case 'week':
          dateFormat = "DATE_FORMAT(pd.purchase_date, '%Y-W%u')";
          groupBy = 'YEARWEEK(pd.purchase_date)';
          break;
        case 'year':
          dateFormat = "DATE_FORMAT(pd.purchase_date, '%Y')";
          groupBy = 'YEAR(pd.purchase_date)';
          break;
        case 'month':
        default:
          dateFormat = "DATE_FORMAT(pd.purchase_date, '%Y-%m')";
          groupBy = "DATE_FORMAT(pd.purchase_date, '%Y-%m')";
          break;
      }

      const query = `
        SELECT
          ${dateFormat} as periodo,
          COUNT(DISTINCT pd.id) as total_purchases,
          COUNT(DISTINCT pd.supplier_name) as total_suppliers,
          SUM(pd.net_amount) as total_neto,
          SUM(pd.tax_amount) as total_isv,
          SUM(pd.total_amount) as total_con_isv,
          AVG(pd.total_amount) as promedio_compra
        FROM purchases_documents pd
        WHERE ${whereClause}
        GROUP BY ${groupBy}
        ORDER BY periodo DESC
      `;

      const results = await db.query(query, params);

      return {
        periods: results,
        filters: {
          date_from: date_from || null,
          date_to: date_to || null,
          period,
          supplier_id: supplier_id || 'all'
        }
      };
    } catch (error) {
      logger.error('Error in SupplierReportService.getPurchasesByPeriod:', error);
      throw error;
    }
  }

  /**
   * Obtener información de la empresa para el encabezado del reporte
   */
  static async getCompanyInfo() {
    try {
      const query = `
        SELECT
          company_name,
          commercial_name,
          company_rtn as rtn,
          company_address as direccion,
          company_phone as telefono,
          company_email as email
        FROM billing_settings
        LIMIT 1
      `;

      const results = await db.query(query);
      const company = results.length > 0 ? results[0] : {
        company_name: 'EMPRESA SIN CONFIGURAR',
        commercial_name: '',
        rtn: '00000000000000',
        direccion: 'Sin dirección',
        telefono: 'Sin teléfono',
        email: 'sin@email.com'
      };

      return company;
    } catch (error) {
      logger.error('Error in SupplierReportService.getCompanyInfo:', error);
      throw error;
    }
  }
}

module.exports = SupplierReportService;
