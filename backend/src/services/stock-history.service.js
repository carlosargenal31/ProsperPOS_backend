// ===================================================================
// PROSPERPOS - SERVICIO DE HISTORIAL DE EXISTENCIAS
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class StockHistoryService {
  /**
   * Obtener historial de existencias con filtros
   */
  static async getStockHistory(filters) {
    try {
      const params = [];

      // Construir fechas para el filtro
      const dateFrom = filters.date_from || '1900-01-01';
      const dateTo = filters.date_to || '2099-12-31';
      const groupByWarehouses = filters.group_by_warehouses !== false; // Por defecto true

      let query = `
        SELECT
          p.id,
          p.code AS sku,
          p.name AS product_name,
          p.image AS image,
          c.name AS category_name,
          sc.name AS subcategory_name,
          b.name AS brand_name,
          w.id AS warehouse_id,
          w.nombre AS warehouse_name,

          -- Stock actual por bodega (final_quantity)
          COALESCE(s.quantity, 0) AS final_quantity,

          -- Cantidad inicial: Stock actual menos todos los movimientos del período
          COALESCE(s.quantity, 0) - COALESCE(cargos.cantidad_cargada, 0) + COALESCE(descargos.cantidad_descargada, 0) + COALESCE(ventas.cantidad_vendida, 0) AS initial_quantity,

          -- Cantidad agregada (Cargos - ajustes de inventario positivos)
          COALESCE(cargos.cantidad_cargada, 0) AS added_quantity,

          -- Cantidad descargada (Descargos - ajustes de inventario negativos)
          COALESCE(descargos.cantidad_descargada, 0) AS defective_quantity,

          -- Cantidad vendida (de facturas)
          COALESCE(ventas.cantidad_vendida, 0) AS sold_quantity

        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
        LEFT JOIN brands b ON p.brand_id = b.id
        CROSS JOIN warehouses w
        LEFT JOIN stock s ON p.id = s.product_id AND s.warehouse_id = w.id

        -- Cargos (de la tabla cargo_descargo con document_type = 'cargo') por bodega
        LEFT JOIN (
          SELECT
            cdd.product_id,
            cd.warehouse_id,
            SUM(cdd.quantity) AS cantidad_cargada
          FROM cargo_descargo_details cdd
          INNER JOIN cargo_descargo cd ON cdd.cargo_descargo_id = cd.id
          WHERE cd.document_type = 'cargo'
            AND cd.status = 'procesado'
            AND cd.registration_date >= ?
            AND cd.registration_date <= ?
          GROUP BY cdd.product_id, cd.warehouse_id
        ) AS cargos ON p.id = cargos.product_id AND w.id = cargos.warehouse_id

        -- Descargos (de la tabla cargo_descargo con document_type = 'descargo') por bodega
        LEFT JOIN (
          SELECT
            cdd.product_id,
            cd.warehouse_id,
            SUM(cdd.quantity) AS cantidad_descargada
          FROM cargo_descargo_details cdd
          INNER JOIN cargo_descargo cd ON cdd.cargo_descargo_id = cd.id
          WHERE cd.document_type = 'descargo'
            AND cd.status = 'procesado'
            AND cd.registration_date >= ?
            AND cd.registration_date <= ?
          GROUP BY cdd.product_id, cd.warehouse_id
        ) AS descargos ON p.id = descargos.product_id AND w.id = descargos.warehouse_id

        -- Ventas (de facturas) por bodega
        LEFT JOIN (
          SELECT
            ii.product_id,
            i.warehouse_id,
            SUM(ii.quantity) AS cantidad_vendida
          FROM invoice_items ii
          INNER JOIN invoices i ON ii.invoice_id = i.id
          WHERE i.deleted_at IS NULL
            AND i.created_at >= ?
            AND i.created_at <= ?
          GROUP BY ii.product_id, i.warehouse_id
        ) AS ventas ON p.id = ventas.product_id AND w.id = ventas.warehouse_id

        WHERE p.deleted_at IS NULL AND w.deleted_at IS NULL
      `;

      // Agregar parámetros de fecha (6 veces: cargos, descargos, ventas)
      params.push(dateFrom, dateTo); // Para cargos
      params.push(dateFrom, dateTo); // Para descargos
      params.push(dateFrom + ' 00:00:00', dateTo + ' 23:59:59'); // Para ventas

      // Filtros adicionales
      if (filters.category_id) {
        query += ' AND p.category_id = ?';
        params.push(filters.category_id);
      }

      if (filters.subcategory_id) {
        query += ' AND p.subcategory_id = ?';
        params.push(filters.subcategory_id);
      }

      if (filters.product_id) {
        query += ' AND p.id = ?';
        params.push(filters.product_id);
      }

      if (filters.warehouse_id) {
        query += ' AND w.id = ?';
        params.push(filters.warehouse_id);
      }

      query += ' ORDER BY w.nombre ASC, p.name ASC';

      logger.info('=== Stock History Query ===');
      logger.info('Date from:', dateFrom);
      logger.info('Date to:', dateTo);
      logger.info('Filters:', filters);
      logger.info('Params:', params);

      const rows = await db.query(query, params);

      logger.info('Rows returned:', rows.length);
      if (rows.length > 0) {
        logger.info('First row:', JSON.stringify(rows[0], null, 2));
      }

      // Agrupar por bodega si está habilitado
      let result;
      let totals = {
        initial_quantity: 0,
        added_quantity: 0,
        sold_quantity: 0,
        defective_quantity: 0,
        final_quantity: 0,
      };

      if (groupByWarehouses) {
        const groupedData = {};

        rows.forEach(row => {
          const warehouseKey = row.warehouse_id || 'UNKNOWN';

          if (!groupedData[warehouseKey]) {
            groupedData[warehouseKey] = {
              warehouse_id: row.warehouse_id,
              warehouse_name: row.warehouse_name,
              items: [],
              totals: {
                initial_quantity: 0,
                added_quantity: 0,
                sold_quantity: 0,
                defective_quantity: 0,
                final_quantity: 0,
              }
            };
          }

          groupedData[warehouseKey].items.push(row);

          // Sumar totales por bodega
          groupedData[warehouseKey].totals.initial_quantity += parseFloat(row.initial_quantity || 0);
          groupedData[warehouseKey].totals.added_quantity += parseFloat(row.added_quantity || 0);
          groupedData[warehouseKey].totals.sold_quantity += parseFloat(row.sold_quantity || 0);
          groupedData[warehouseKey].totals.defective_quantity += parseFloat(row.defective_quantity || 0);
          groupedData[warehouseKey].totals.final_quantity += parseFloat(row.final_quantity || 0);

          // Sumar totales generales
          totals.initial_quantity += parseFloat(row.initial_quantity || 0);
          totals.added_quantity += parseFloat(row.added_quantity || 0);
          totals.sold_quantity += parseFloat(row.sold_quantity || 0);
          totals.defective_quantity += parseFloat(row.defective_quantity || 0);
          totals.final_quantity += parseFloat(row.final_quantity || 0);
        });

        result = Object.values(groupedData);
      } else {
        // Sin agrupación
        rows.forEach(row => {
          totals.initial_quantity += parseFloat(row.initial_quantity || 0);
          totals.added_quantity += parseFloat(row.added_quantity || 0);
          totals.sold_quantity += parseFloat(row.sold_quantity || 0);
          totals.defective_quantity += parseFloat(row.defective_quantity || 0);
          totals.final_quantity += parseFloat(row.final_quantity || 0);
        });

        result = rows;
      }

      return {
        data: result,
        totals,
        grouped_by_warehouses: groupByWarehouses,
        filters: {
          date_from: filters.date_from,
          date_to: filters.date_to,
          category_id: filters.category_id,
          subcategory_id: filters.subcategory_id,
          product_id: filters.product_id,
          warehouse_id: filters.warehouse_id,
          group_by_warehouses: groupByWarehouses,
        }
      };
    } catch (error) {
      logger.error('Error in StockHistoryService.getStockHistory:', error);
      throw error;
    }
  }

  /**
   * Exportar historial de existencias
   */
  static async exportStockHistory(filters, format) {
    try {
      const data = await this.getStockHistory(filters);

      // TODO: Implementar exportación a Excel/PDF
      // Por ahora, retornamos los datos
      return {
        format,
        data: data.data,
        totals: data.totals
      };
    } catch (error) {
      logger.error('Error in StockHistoryService.exportStockHistory:', error);
      throw error;
    }
  }

  /**
   * Obtener lista de categorías
   */
  static async getCategories() {
    try {
      const query = `
        SELECT id, name AS label, name AS value
        FROM categories
        WHERE deleted_at IS NULL
        ORDER BY name ASC
      `;

      const rows = await db.query(query);

      return [
        { id: null, label: 'Todas', value: 'all' },
        ...rows
      ];
    } catch (error) {
      logger.error('Error in StockHistoryService.getCategories:', error);
      throw error;
    }
  }

  /**
   * Obtener lista de subcategorías
   */
  static async getSubcategories(categoryId) {
    try {
      let query = `
        SELECT id, name AS label, name AS value, category_id
        FROM subcategories
        WHERE deleted_at IS NULL
      `;

      const params = [];

      if (categoryId) {
        query += ' AND category_id = ?';
        params.push(categoryId);
      }

      query += ' ORDER BY name ASC';

      const rows = await db.query(query, params);

      return [
        { id: null, label: 'Todas', value: 'all' },
        ...rows
      ];
    } catch (error) {
      logger.error('Error in StockHistoryService.getSubcategories:', error);
      throw error;
    }
  }

  /**
   * Obtener lista de productos
   */
  static async getProducts(categoryId, subcategoryId) {
    try {
      let query = `
        SELECT id, name AS label, name AS value, code AS sku, category_id, subcategory_id
        FROM products
        WHERE deleted_at IS NULL
      `;

      const params = [];

      if (categoryId) {
        query += ' AND category_id = ?';
        params.push(categoryId);
      }

      if (subcategoryId) {
        query += ' AND subcategory_id = ?';
        params.push(subcategoryId);
      }

      query += ' ORDER BY name ASC';

      logger.info('=== DEBUG getProducts ===');
      logger.info('categoryId:', categoryId);
      logger.info('subcategoryId:', subcategoryId);
      logger.info('Query:', query);
      logger.info('Params:', params);

      const rows = await db.query(query, params);

      logger.info('Rows found:', rows.length);
      logger.info('Sample rows:', JSON.stringify(rows.slice(0, 3), null, 2));

      return [
        { id: null, label: 'Todos', value: 'all' },
        ...rows
      ];
    } catch (error) {
      logger.error('Error in StockHistoryService.getProducts:', error);
      throw error;
    }
  }

  /**
   * Obtener lista de almacenes
   */
  static async getWarehouses() {
    try {
      const query = `
        SELECT id, nombre AS label, nombre AS value
        FROM warehouses
        WHERE deleted_at IS NULL
        ORDER BY nombre ASC
      `;

      const rows = await db.query(query);

      return [
        { id: null, label: 'Todos', value: 'all' },
        ...rows
      ];
    } catch (error) {
      logger.error('Error in StockHistoryService.getWarehouses:', error);
      throw error;
    }
  }
}

module.exports = StockHistoryService;
