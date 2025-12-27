// ===================================================================
// PROSPERPOS - SERVICIO DE AJUSTE DE INVENTARIO
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class InventoryAdjustmentService {
  /**
   * Generar siguiente consecutivo
   */
  static async getNextConsecutive() {
    try {
      const result = await db.execute(`
        SELECT consecutive
        FROM inventory_adjustments
        WHERE deleted_at IS NULL
        ORDER BY id DESC
        LIMIT 1
      `);

      if (result.length === 0) {
        return '0000000001';
      }

      const lastConsecutive = parseInt(result[0].consecutive);
      const nextConsecutive = (lastConsecutive + 1).toString().padStart(10, '0');
      return nextConsecutive;
    } catch (error) {
      logger.error('Error in getNextConsecutive:', error);
      throw error;
    }
  }

  /**
   * Obtener datos de inventario para ajuste
   */
  static async getInventoryForAdjustment(filters = {}) {
    try {
      const {
        warehouse_id,
        store_id,
        product_id,
        product_code,
        product_name,
        category_id,
        subcategory_id,
        existence_filter = 'all'
      } = filters;

      let whereConditions = ['p.deleted_at IS NULL'];
      const params = [];

      // Los parámetros para el subquery de stock van primero
      if (store_id) {
        params.push(store_id); // Para WHERE s.store_id = ?
        params.push(store_id); // Para AND stock_data.store_id = ?
      }

      // Filtro de bodega (requerido)
      if (warehouse_id) {
        whereConditions.push('w.id = ?');
        params.push(warehouse_id);
      }

      // Filtro de producto por ID
      if (product_id) {
        whereConditions.push('p.id = ?');
        params.push(product_id);
      }

      // Filtro de producto por código
      if (product_code) {
        whereConditions.push('p.code LIKE ?');
        params.push(`%${product_code}%`);
      }

      // Filtro de producto por nombre
      if (product_name) {
        whereConditions.push('p.name LIKE ?');
        params.push(`%${product_name}%`);
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

      const whereClause = whereConditions.join(' AND ');

      const query = `
        SELECT
          p.id,
          p.code as codigo,
          p.name as producto,
          c.name as categoria,
          sc.name as subcategoria,
          w.id as warehouse_id,
          w.nombre as bodega,
          COALESCE(stock_data.stock_quantity, 0) as exist_teorica,
          0 as exist_fisica,
          0 as exist_nueva,
          0 as diferencia,
          COALESCE(p.cost, 0) as costo_unit,
          0 as costo_anterior,
          0 as costo_actual,
          0 as costo_nuevo
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
        CROSS JOIN warehouses w
        LEFT JOIN (
          SELECT
            s.product_id,
            s.warehouse_id,
            s.store_id,
            SUM(COALESCE(s.quantity, 0)) as stock_quantity
          FROM stock s
          ${store_id ? 'WHERE s.store_id = ?' : ''}
          GROUP BY s.product_id, s.warehouse_id, s.store_id
        ) stock_data ON stock_data.product_id = p.id
          AND stock_data.warehouse_id = w.id
          ${store_id ? 'AND stock_data.store_id = ?' : ''}
        WHERE ${whereClause} AND w.deleted_at IS NULL
      `;

      // Filtro de existencias
      let finalQuery = query;
      if (existence_filter === 'with_stock') {
        finalQuery += ` AND COALESCE(stock_data.stock_quantity, 0) > 0`;
      } else if (existence_filter === 'without_stock') {
        finalQuery += ` AND (COALESCE(stock_data.stock_quantity, 0) <= 0 OR stock_data.stock_quantity IS NULL)`;
      }

      finalQuery += ` ORDER BY p.name`;

      console.log('Query params:', params);
      console.log('Final query:', finalQuery);

      const items = await db.execute(finalQuery, params);

      console.log(`Loaded ${items.length} items from database`);
      if (items.length > 0) {
        console.log('First item stock data:', {
          producto: items[0].producto,
          exist_teorica: items[0].exist_teorica,
          bodega: items[0].bodega
        });
      }

      // Calcular costos
      items.forEach(item => {
        item.costo_anterior = item.costo_unit * item.exist_teorica;
        item.costo_actual = item.costo_unit * item.exist_fisica;
        item.costo_nuevo = item.costo_unit * item.exist_nueva;
      });

      return items;
    } catch (error) {
      logger.error('Error in getInventoryForAdjustment:', error);
      throw error;
    }
  }

  /**
   * Listar ajustes de inventario
   */
  static async listAdjustments(filters = {}) {
    try {
      const {
        start_date,
        end_date,
        warehouse_id,
        status,
        search,
        page = 1,
        limit = 50
      } = filters;

      let whereConditions = ['ia.deleted_at IS NULL'];
      const params = [];

      if (start_date && end_date) {
        whereConditions.push('ia.issue_date BETWEEN ? AND ?');
        params.push(start_date, end_date);
      }

      if (warehouse_id) {
        whereConditions.push('ia.warehouse_id = ?');
        params.push(warehouse_id);
      }

      if (status) {
        whereConditions.push('ia.status = ?');
        params.push(status);
      }

      if (search) {
        whereConditions.push('(ia.consecutive LIKE ? OR ia.concept LIKE ? OR ia.issuer LIKE ?)');
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      const whereClause = whereConditions.join(' AND ');
      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Consulta principal
      const query = `
        SELECT
          ia.id,
          ia.consecutive as documento,
          DATE_FORMAT(ia.issue_date, '%Y-%m-%d') as emision,
          ia.issuer as emisor,
          ia.concept as concepto,
          w.nombre as bodega,
          ia.status as estatus,
          ia.total_items,
          ia.created_at
        FROM inventory_adjustments ia
        LEFT JOIN warehouses w ON ia.warehouse_id = w.id
        WHERE ${whereClause}
        ORDER BY ia.id DESC
        LIMIT ${parseInt(limit)} OFFSET ${offset}
      `;

      const adjustments = await db.execute(query, params);

      // Contar total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM inventory_adjustments ia
        WHERE ${whereClause}
      `;

      const countResult = await db.execute(countQuery, params);
      const total = countResult[0].total;

      return {
        data: adjustments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error in listAdjustments:', error);
      throw error;
    }
  }

  /**
   * Crear ajuste de inventario
   */
  static async createAdjustment(data, userId) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const {
        consecutive,
        issue_date,
        issuer,
        warehouse_id,
        concept,
        items
      } = data;

      // Insertar ajuste
      const insertResult = await connection.execute(
        `INSERT INTO inventory_adjustments
         (consecutive, issue_date, issuer, warehouse_id, concept, total_items, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
        [consecutive, issue_date, issuer, warehouse_id, concept, items.length, userId]
      );

      const adjustmentId = insertResult[0].insertId;

      // Insertar detalles
      for (const item of items) {
        const costUnit = parseFloat(item.costo_unit || 0);
        const quantityBefore = parseFloat(item.exist_teorica || 0);
        const quantityActual = parseFloat(item.exist_fisica || 0);
        const difference = parseFloat(item.diferencia || 0);

        await connection.execute(
          `INSERT INTO inventory_adjustment_details
           (adjustment_id, product_id, warehouse_id, quantity_before, quantity_actual,
            quantity_new, difference, cost_unit, cost_before, cost_actual, cost_new)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            adjustmentId,
            item.product_id,
            warehouse_id,
            quantityBefore,
            quantityActual,
            quantityActual,  // quantity_new debe ser igual a exist_fisica (la cantidad ajustada)
            difference,
            costUnit,
            costUnit * quantityBefore,  // cost_before = costo_unit * exist_teorica
            costUnit * quantityActual,  // cost_actual = costo_unit * exist_fisica
            costUnit * quantityActual   // cost_new = costo_unit * exist_fisica
          ]
        );
      }

      await connection.commit();

      return {
        id: adjustmentId,
        consecutive,
        message: 'Ajuste de inventario creado exitosamente'
      };
    } catch (error) {
      await connection.rollback();
      logger.error('Error in createAdjustment:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Aplicar ajuste al inventario
   */
  static async applyAdjustment(adjustmentId, userId) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Obtener store_id del usuario
      const [userRows] = await connection.execute(
        `SELECT store_id FROM users WHERE id = ?`,
        [userId]
      );

      if (userRows.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      const storeId = userRows[0].store_id || 1; // Por defecto 1 si no tiene store_id

      // Obtener detalles del ajuste
      const details = await connection.execute(
        `SELECT * FROM inventory_adjustment_details WHERE adjustment_id = ?`,
        [adjustmentId]
      );

      // Actualizar stock para cada producto
      for (const detail of details[0]) {
        console.log('Applying adjustment for product:', {
          product_id: detail.product_id,
          warehouse_id: detail.warehouse_id,
          store_id: storeId,
          quantity_before: detail.quantity_before,
          quantity_new: detail.quantity_new
        });

        // Verificar si existe registro en stock
        const existingStock = await connection.execute(
          `SELECT id, quantity FROM stock
           WHERE product_id = ? AND warehouse_id = ? AND store_id = ?`,
          [detail.product_id, detail.warehouse_id, storeId]
        );

        if (existingStock[0].length > 0) {
          console.log('Updating existing stock from', existingStock[0][0].quantity, 'to', detail.quantity_new);
          // Actualizar stock existente
          await connection.execute(
            `UPDATE stock SET quantity = ?
             WHERE product_id = ? AND warehouse_id = ? AND store_id = ?`,
            [detail.quantity_new, detail.product_id, detail.warehouse_id, storeId]
          );
        } else {
          console.log('Creating new stock record with quantity:', detail.quantity_new);
          // Crear nuevo registro de stock
          await connection.execute(
            `INSERT INTO stock (product_id, store_id, warehouse_id, quantity, reserved_quantity)
             VALUES (?, ?, ?, ?, 0)`,
            [detail.product_id, storeId, detail.warehouse_id, detail.quantity_new]
          );
        }
      }

      // Actualizar estado del ajuste
      await connection.execute(
        `UPDATE inventory_adjustments
         SET status = 'processed', updated_by = ?
         WHERE id = ?`,
        [userId, adjustmentId]
      );

      await connection.commit();

      return {
        message: 'Ajuste aplicado exitosamente al inventario'
      };
    } catch (error) {
      await connection.rollback();
      logger.error('Error in applyAdjustment:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener detalle de un ajuste
   */
  static async getAdjustmentDetail(adjustmentId) {
    try {
      // Obtener cabecera
      const adjustment = await db.execute(
        `SELECT
          ia.*,
          w.nombre as warehouse_name,
          u.username as created_by_name
         FROM inventory_adjustments ia
         LEFT JOIN warehouses w ON ia.warehouse_id = w.id
         LEFT JOIN users u ON ia.created_by = u.id
         WHERE ia.id = ? AND ia.deleted_at IS NULL`,
        [adjustmentId]
      );

      if (adjustment.length === 0) {
        throw new Error('Ajuste no encontrado');
      }

      // Obtener detalles
      const details = await db.execute(
        `SELECT
          iad.*,
          p.code as product_code,
          p.name as product_name,
          c.name as category_name,
          sc.name as subcategory_name
         FROM inventory_adjustment_details iad
         LEFT JOIN products p ON iad.product_id = p.id
         LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
         WHERE iad.adjustment_id = ?`,
        [adjustmentId]
      );

      return {
        adjustment: adjustment[0],
        details
      };
    } catch (error) {
      logger.error('Error in getAdjustmentDetail:', error);
      throw error;
    }
  }
}

module.exports = InventoryAdjustmentService;
