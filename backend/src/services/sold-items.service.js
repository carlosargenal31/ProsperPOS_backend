// ===================================================================
// PROSPERPOS - SERVICIO DE PRODUCTOS VENDIDOS
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class SoldItemsService {
  /**
   * Obtener reporte de productos vendidos
   */
  static async getSoldItems(filters) {
    try {
      let query = `
        SELECT
          COALESCE(p.code, '') AS codigo,
          p.name AS producto,
          c.name AS categoria,
          sc.name AS subcategoria,
          b.name AS marca,
          SUM(COALESCE(ii.quantity, 0)) AS cantidad,
          AVG(COALESCE(ii.unit_price, 0)) AS precio,
          COALESCE(p.cost, 0) AS costo,
          SUM(COALESCE(ii.subtotal, 0)) AS total_neto,
          SUM(COALESCE(ii.tax_amount, 0)) AS impuesto,
          SUM(COALESCE(ii.line_total, 0)) AS total_final,
          SUM(COALESCE(ii.quantity * p.cost, 0)) AS total_costo,
          SUM(COALESCE(ii.subtotal - (ii.quantity * p.cost), 0)) AS utilidad
      `;

      query += `
        FROM invoice_items ii
        INNER JOIN invoices i ON ii.invoice_id = i.id
        INNER JOIN products p ON ii.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE i.invoice_type = 'factura'
          AND i.deleted_at IS NULL
      `;

      const params = [];

      // Filtros de fecha
      if (filters.date_from) {
        query += ` AND DATE(i.issue_date) >= ?`;
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        query += ` AND DATE(i.issue_date) <= ?`;
        params.push(filters.date_to);
      }

      // Filtros de cliente
      if (filters.customer_id) {
        query += ` AND i.customer_id = ?`;
        params.push(filters.customer_id);
      }

      if (filters.customer_group_id) {
        query += ` AND EXISTS (
          SELECT 1 FROM customers cu
          WHERE cu.id = i.customer_id
          AND cu.customer_group_id = ?
        )`;
        params.push(filters.customer_group_id);
      }

      if (filters.customer_type) {
        query += ` AND i.customer_type = ?`;
        params.push(filters.customer_type);
      }

      // Filtros de vendedor
      if (filters.seller_id) {
        query += ` AND i.seller_id = ?`;
        params.push(filters.seller_id);
      }

      // Filtros de producto
      if (filters.product_id) {
        query += ` AND p.id = ?`;
        params.push(filters.product_id);
      }

      if (filters.category_id) {
        query += ` AND p.category_id = ?`;
        params.push(filters.category_id);
      }

      if (filters.subcategory_id) {
        query += ` AND p.subcategory_id = ?`;
        params.push(filters.subcategory_id);
      }

      if (filters.brand_id) {
        query += ` AND p.brand_id = ?`;
        params.push(filters.brand_id);
      }

      // Filtros de sucursal y bodega
      if (filters.branch_id) {
        query += ` AND i.branch_id = ?`;
        params.push(filters.branch_id);
      }

      if (filters.warehouse_id) {
        query += ` AND ii.warehouse_id = ?`;
        params.push(filters.warehouse_id);
      }

      // Agrupar por producto y todas las columnas no agregadas
      query += ` GROUP BY p.id, p.code, p.name, p.cost, c.name, sc.name, b.name`;

      // Ordenar por cantidad vendida
      query += ` ORDER BY cantidad DESC`;

      const rows = await db.query(query, params);

      // Calcular totales
      const totals = {
        total_cantidad: 0,
        total_neto: 0,
        total_impuesto: 0,
        total_final: 0,
        total_costo: 0,
        total_utilidad: 0
      };

      rows.forEach(row => {
        totals.total_cantidad += parseFloat(row.cantidad || 0);
        totals.total_neto += parseFloat(row.total_neto || 0);
        totals.total_impuesto += parseFloat(row.impuesto || 0);
        totals.total_final += parseFloat(row.total_final || 0);
        totals.total_costo += parseFloat(row.total_costo || 0);
        totals.total_utilidad += parseFloat(row.utilidad || 0);
      });

      return {
        items: rows,
        totals: totals,
        count: rows.length
      };
    } catch (error) {
      logger.error('Error in SoldItemsService.getSoldItems:', error);
      throw error;
    }
  }

  /**
   * Exportar reporte de productos vendidos
   */
  static async exportSoldItems(filters, format = 'excel') {
    try {
      const data = await this.getSoldItems(filters);

      // Aquí puedes implementar la lógica de exportación a Excel/PDF
      // Por ahora retornamos los datos
      return {
        data: data,
        format: format,
        filename: `productos_vendidos_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      };
    } catch (error) {
      logger.error('Error in SoldItemsService.exportSoldItems:', error);
      throw error;
    }
  }

  /**
   * Obtener lista de productos
   */
  static async getProducts() {
    try {
      const rows = await db.query(`
        SELECT id, code, name
        FROM products
        WHERE is_active = 1
        ORDER BY name
      `);
      return rows;
    } catch (error) {
      logger.error('Error in SoldItemsService.getProducts:', error);
      throw error;
    }
  }

  /**
   * Obtener lista de grupos (categorías)
   */
  static async getGroups() {
    try {
      const rows = await db.query(`
        SELECT id, name
        FROM categories
        ORDER BY name
      `);
      return rows;
    } catch (error) {
      logger.error('Error in SoldItemsService.getGroups:', error);
      throw error;
    }
  }

  /**
   * Obtener lista de subgrupos
   */
  static async getSubgroups(groupId = null) {
    try {
      let query = `
        SELECT id, name, category_id
        FROM subcategories
      `;
      const params = [];

      if (groupId) {
        query += ` WHERE category_id = ?`;
        params.push(groupId);
      }

      query += ` ORDER BY name`;

      const rows = await db.query(query, params);
      return rows;
    } catch (error) {
      logger.error('Error in SoldItemsService.getSubgroups:', error);
      throw error;
    }
  }
}

module.exports = SoldItemsService;
