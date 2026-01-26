// ===================================================================
// PROSPERPOS - SERVICIO DE INVENTARIO FÍSICO
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class PhysicalInventoryService {
  /**
   * Exportar inventario físico (simplemente reutiliza getPhysicalInventory)
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Object>} Datos del inventario físico para exportar
   */
  static async exportPhysicalInventory(filters = {}) {
    return this.getPhysicalInventory(filters);
  }

  /**
   * Obtener reporte de inventario físico con filtros
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Object>} Datos del inventario físico
   */
  static async getPhysicalInventory(filters = {}) {
    try {
      const {
        product_id,
        article_name,
        category_id,
        subcategory_id,
        warehouse_id,
        brand_id,
        existence_filter = 'all',
        include_cost = false,
        include_average_cost = false,
        include_prices = false,
        include_codes = false,
        include_unit = false,
        include_brand = false,
        group_by_warehouses = true,
        group_by_groups = false,
        group_by_articles = false,
        include_suspended = false,
        is_for_inventory_taking = false
      } = filters;

      let whereConditions = ['p.deleted_at IS NULL'];
      const params = [];

      // Filtro de producto específico
      if (product_id) {
        whereConditions.push('p.id = ?');
        params.push(product_id);
      }

      // Filtro de producto por nombre
      if (article_name) {
        whereConditions.push('p.name LIKE ?');
        params.push(`%${article_name}%`);
      }

      // Filtro de categoría
      if (category_id) {
        whereConditions.push('p.category_id = ?');
        params.push(category_id);
      }

      // Filtro de subcategoría
      if (subcategory_id) {
        whereConditions.push('p.subcategory_id = ?');
        params.push(subcategory_id);
      }

      // Filtro de bodega
      if (warehouse_id) {
        whereConditions.push('w.id = ?');
        params.push(warehouse_id);
      }

      // Filtro de marca
      if (brand_id) {
        whereConditions.push('p.brand_id = ?');
        params.push(brand_id);
      }

      // Filtro de suspendidos
      if (!include_suspended) {
        whereConditions.push('p.is_active = ?');
        params.push(1);
      }

      const whereClause = whereConditions.join(' AND ');

      logger.info('Physical Inventory WHERE conditions:', whereConditions);
      logger.info('Physical Inventory params:', params);

      // Campos - SIEMPRE incluir todos los campos para que estén disponibles en el frontend
      let selectFields = `
        p.id,
        p.name as nombre,
        p.code as codigo,
        c.name as categoria,
        sc.name as subcategoria,
        b.name as marca,
        u.name as unidad_medida,
        w.id as warehouse_id,
        w.nombre as almacen,
        COALESCE(stock_data.stock_quantity, 0) as cantidad,
        COALESCE(stock_data.stock_quantity_reservada, 0) as apartadas,
        COALESCE(stock_data.stock_quantity, 0) + COALESCE(stock_data.stock_quantity_reservada, 0) as cant_total,
        COALESCE(p.cost, 0) as costo_unit,
        COALESCE(p.cost, 0) * COALESCE(stock_data.stock_quantity, 0) as costo_total,
        COALESCE(p.price_1, 0) as precio_unit,
        COALESCE(p.price_1, 0) * COALESCE(stock_data.stock_quantity, 0) as precio_total
      `;

      // Subconsulta para obtener stock por bodega
      const stockSubquery = `
        SELECT
          s.product_id,
          s.warehouse_id,
          SUM(COALESCE(s.quantity, 0)) as stock_quantity,
          SUM(COALESCE(s.reserved_quantity, 0)) as stock_quantity_reservada
        FROM stock s
        GROUP BY s.product_id, s.warehouse_id
      `;

      // Query principal
      let query = `
        SELECT
          ${selectFields}
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN units u ON p.unit_id = u.id
        CROSS JOIN warehouses w
        LEFT JOIN (${stockSubquery}) stock_data ON stock_data.product_id = p.id AND stock_data.warehouse_id = w.id
        WHERE ${whereClause} AND w.deleted_at IS NULL
      `;

      // Filtro de existencias (después del JOIN)
      if (existence_filter === 'with_stock') {
        query += ` AND COALESCE(stock_data.stock_quantity, 0) > 0`;
      } else if (existence_filter === 'without_stock') {
        query += ` AND (COALESCE(stock_data.stock_quantity, 0) <= 0 OR stock_data.stock_quantity IS NULL)`;
      }

      // Agrupación
      if (group_by_warehouses) {
        query += ` ORDER BY w.nombre, p.name`;
      } else if (group_by_groups) {
        query += ` ORDER BY c.name, p.name`;
      } else if (group_by_articles) {
        query += ` ORDER BY p.name, w.nombre`;
      } else {
        query += ` ORDER BY p.name`;
      }

      const items = await db.execute(query, params);

      // Agrupar por bodega si está habilitado
      let groupedData = {};
      let totalGeneral = {
        total_registros: items.length,
        cantidad_total: 0,
        apartadas_total: 0,
        costo_total: 0,
        precio_total: 0,
        impuestos_total: 0
      };

      if (group_by_warehouses) {
        items.forEach(item => {
          const warehouseKey = item.almacen || 'SIN BODEGA';

          if (!groupedData[warehouseKey]) {
            groupedData[warehouseKey] = {
              almacen: warehouseKey,
              warehouse_id: item.warehouse_id,
              items: [],
              totals: {
                cantidad: 0,
                apartadas: 0,
                costo_total: 0,
                precio_total: 0
              }
            };
          }

          groupedData[warehouseKey].items.push(item);
          groupedData[warehouseKey].totals.cantidad += parseFloat(item.cantidad || 0);
          groupedData[warehouseKey].totals.apartadas += parseFloat(item.apartadas || 0);

          if (include_cost) {
            groupedData[warehouseKey].totals.costo_total += parseFloat(item.costo_total || 0);
            totalGeneral.costo_total += parseFloat(item.costo_total || 0);
          }

          if (include_prices) {
            groupedData[warehouseKey].totals.precio_total += parseFloat(item.precio_total || 0);
            totalGeneral.precio_total += parseFloat(item.precio_total || 0);
          }

          totalGeneral.cantidad_total += parseFloat(item.cantidad || 0);
          totalGeneral.apartadas_total += parseFloat(item.apartadas || 0);
        });

        // Convertir objeto a array
        groupedData = Object.values(groupedData);
      } else {
        // Sin agrupación, retornar items planos
        items.forEach(item => {
          totalGeneral.cantidad_total += parseFloat(item.cantidad || 0);
          totalGeneral.apartadas_total += parseFloat(item.apartadas || 0);

          if (include_cost) {
            totalGeneral.costo_total += parseFloat(item.costo_total || 0);
          }

          if (include_prices) {
            totalGeneral.precio_total += parseFloat(item.precio_total || 0);
          }
        });

        groupedData = items;
      }

      // Redondear totales
      if (include_cost) {
        totalGeneral.costo_total = parseFloat(totalGeneral.costo_total.toFixed(2));
      }

      if (include_prices) {
        totalGeneral.precio_total = parseFloat(totalGeneral.precio_total.toFixed(2));
      }

      const result = {
        data: groupedData,
        totals: totalGeneral,
        filters: {
          product_id,
          article_name,
          category_id,
          subcategory_id,
          warehouse_id,
          brand_id,
          existence_filter,
          group_by_warehouses,
          group_by_groups,
          group_by_articles
        },
        metadata: {
          include_cost,
          include_average_cost,
          include_prices,
          include_codes,
          include_unit,
          include_brand,
          is_for_inventory_taking
        }
      };

      logger.info('Physical Inventory Result:', {
        totalItems: items.length,
        groupedDataLength: Array.isArray(groupedData) ? groupedData.length : Object.keys(groupedData).length,
        totalRegistros: totalGeneral.total_registros,
        isGroupedByWarehouses: group_by_warehouses
      });

      return result;
    } catch (error) {
      logger.error('Error in PhysicalInventoryService.getPhysicalInventory:', error);
      throw error;
    }
  }
}

module.exports = PhysicalInventoryService;

