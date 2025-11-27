/**
 * Seller Report Controller
 * Handles reports for sales by seller/vendor
 */

const db = require('../utils/database');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class SellerReportController {
  /**
   * Get sales by seller report
   * GET /api/v1/reports/sales-by-seller
   */
  static async getSalesBySeller(req, res) {
    try {
      const {
        date_from,
        date_to,
        seller_id,
        warehouse_id,
        branch_id
      } = req.query;

      let query = `
        SELECT
          COALESCE(i.seller_name, 'SIN VENDEDOR') as seller_name,
          i.seller_id,
          COUNT(DISTINCT i.id) as total_invoices,
          SUM(i.subtotal) as neto,
          SUM(i.total) as total_con_isv,
          COALESCE(SUM(CASE WHEN i.invoice_type = 'credit_note' THEN i.total ELSE 0 END), 0) as devuelto,
          SUM(i.paid_amount) as cobrado
        FROM invoices i
        WHERE i.status = 'issued'
          AND i.deleted_at IS NULL
      `;

      const params = [];

      // Add date filters
      if (date_from) {
        query += ' AND DATE(i.issue_date) >= ?';
        params.push(date_from);
      }

      if (date_to) {
        query += ' AND DATE(i.issue_date) <= ?';
        params.push(date_to);
      }

      // Add seller filter
      if (seller_id && seller_id !== 'all') {
        query += ' AND i.seller_id = ?';
        params.push(seller_id);
      }

      // Add warehouse filter
      if (warehouse_id && warehouse_id !== 'all') {
        query += ' AND i.warehouse_id = ?';
        params.push(warehouse_id);
      }

      // Add branch filter (if warehouses are linked to branches)
      if (branch_id && branch_id !== 'all') {
        // For now, branch_id is not directly in invoices, so we skip this filter
        // In the future, you could join with warehouses table if they have branch_id
      }

      query += ' GROUP BY i.seller_id, i.seller_name ORDER BY total_con_isv DESC';

      const results = await db.query(query, params);

      // Calculate totals
      const totals = {
        neto: 0,
        total_con_isv: 0,
        devuelto: 0,
        cobrado: 0,
        total_invoices: 0
      };

      results.forEach(row => {
        totals.neto += parseFloat(row.neto) || 0;
        totals.total_con_isv += parseFloat(row.total_con_isv) || 0;
        totals.devuelto += parseFloat(row.devuelto) || 0;
        totals.cobrado += parseFloat(row.cobrado) || 0;
        totals.total_invoices += parseInt(row.total_invoices) || 0;
      });

      sendSuccessResponse(res, {
        sellers: results,
        totals,
        filters: {
          date_from: date_from || null,
          date_to: date_to || null,
          seller_id: seller_id || 'all',
          warehouse_id: warehouse_id || 'all'
        }
      }, 'Reporte de ventas por vendedor obtenido exitosamente');
    } catch (error) {
      logger.error('Error in SellerReportController.getSalesBySeller:', error);
      sendErrorResponse(res, 500, 'Error al obtener el reporte de ventas por vendedor', error.message);
    }
  }

  /**
   * Get list of sellers for filter
   * GET /api/v1/reports/sellers
   */
  static async getSellers(req, res) {
    try {
      const query = `
        SELECT DISTINCT
          seller_id as id,
          seller_name as name
        FROM invoices
        WHERE seller_id IS NOT NULL
          AND seller_name IS NOT NULL
          AND deleted_at IS NULL
        ORDER BY seller_name
      `;

      const sellers = await db.query(query);

      sendSuccessResponse(res, sellers, 'Lista de vendedores obtenida exitosamente');
    } catch (error) {
      logger.error('Error in SellerReportController.getSellers:', error);
      sendErrorResponse(res, 500, 'Error al obtener la lista de vendedores', error.message);
    }
  }

  /**
   * Get company info for report header
   * GET /api/v1/reports/company-info
   */
  static async getCompanyInfo(req, res) {
    try {
      const query = `
        SELECT
          company_name,
          commercial_name,
          company_rtn as cedula,
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
        cedula: '00000000000000',
        direccion: 'Sin dirección',
        telefono: 'Sin teléfono',
        email: 'sin@email.com'
      };

      sendSuccessResponse(res, company, 'Información de empresa obtenida');
    } catch (error) {
      logger.error('Error in SellerReportController.getCompanyInfo:', error);
      sendErrorResponse(res, 500, 'Error al obtener información de la empresa', error.message);
    }
  }
}

module.exports = SellerReportController;
