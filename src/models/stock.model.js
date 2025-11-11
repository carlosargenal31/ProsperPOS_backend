// ===================================================================
// PROSPERPOS - MODELO DE STOCK E INVENTARIO
// ===================================================================

const db = require('../utils/database');
const { logError } = require('../utils/logger');

class Stock {
  
  /**
   * Obtener stock actual
   */
  static async getCurrent(filters = {}) {
    try {
      const { 
        warehouse_id = null,
        product_id = null,
        low_stock = false,
        page = 1, 
        limit = 50 
      } = filters;
      
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE s.deleted_at IS NULL';
      const params = [];

      if (warehouse_id) {
        whereClause += ' AND s.warehouse_id = ?';
        params.push(warehouse_id);
      }

      if (product_id) {
        whereClause += ' AND s.product_id = ?';
        params.push(product_id);
      }

      if (low_stock) {
        whereClause += ' AND s.quantity <= p.min_stock';
      }

      const query = `
        SELECT 
          s.*,
          p.name as product_name,
          p.sku as product_sku,
          p.min_stock,
          p.max_stock,
          w.name as warehouse_name
        FROM stock s
        INNER JOIN products p ON s.product_id = p.id
        INNER JOIN warehouses w ON s.warehouse_id = w.id
        ${whereClause}
        ORDER BY p.name ASC
        LIMIT ? OFFSET ?
      `;

      params.push(parseInt(limit), offset);
      const [stock] = await db.execute(query, params);
      
      // Contar total
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM stock s
        INNER JOIN products p ON s.product_id = p.id
        ${whereClause}
      `;
      const [countResult] = await db.execute(countQuery, params.slice(0, -2));
      
      return {
        stock,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      };

    } catch (error) {
      logError('Error getting current stock:', error);
      throw error;
    }
  }

  /**
   * Obtener stock de un producto específico
   */
  static async getByProductId(product_id, warehouse_id = null) {
    try {
      let query = `
        SELECT 
          s.*,
          w.name as warehouse_name,
          p.name as product_name,
          p.min_stock,
          p.max_stock
        FROM stock s
        INNER JOIN warehouses w ON s.warehouse_id = w.id
        INNER JOIN products p ON s.product_id = p.id
        WHERE s.product_id = ? AND s.deleted_at IS NULL
      `;

      const params = [product_id];

      if (warehouse_id) {
        query += ' AND s.warehouse_id = ?';
        params.push(warehouse_id);
      }

      const [stock] = await db.execute(query, params);
      return stock;

    } catch (error) {
      logError('Error getting stock by product ID:', error);
      throw error;
    }
  }

  /**
   * Ajustar stock
   */
  static async adjust(adjustmentData) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const {
        product_id,
        warehouse_id,
        new_quantity,
        reason,
        notes,
        adjusted_by
      } = adjustmentData;

      // Obtener cantidad actual
      const [currentStock] = await connection.execute(
        'SELECT quantity FROM stock WHERE product_id = ? AND warehouse_id = ? AND deleted_at IS NULL',
        [product_id, warehouse_id]
      );

      if (currentStock.length === 0) {
        throw new Error('Stock no encontrado para este producto en este almacén');
      }

      const oldQuantity = currentStock[0].quantity;
      const difference = new_quantity - oldQuantity;

      // Actualizar stock
      await connection.execute(
        'UPDATE stock SET quantity = ?, updated_at = NOW() WHERE product_id = ? AND warehouse_id = ?',
        [new_quantity, product_id, warehouse_id]
      );

      // Registrar movimiento
      await connection.execute(`
        INSERT INTO stock_movements (
          product_id, warehouse_id, movement_type, quantity,
          previous_quantity, new_quantity, reason, notes,
          created_by, created_at
        ) VALUES (?, ?, 'adjustment', ?, ?, ?, ?, ?, ?, NOW())
      `, [
        product_id, warehouse_id, difference,
        oldQuantity, new_quantity, reason, notes, adjusted_by
      ]);

      await connection.commit();

      return {
        product_id,
        old_quantity: oldQuantity,
        new_quantity,
        difference,
        message: 'Stock ajustado exitosamente'
      };

    } catch (error) {
      await connection.rollback();
      logError('Error adjusting stock:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Transferir stock entre almacenes
   */
  static async transfer(transferData) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const {
        product_id,
        from_warehouse_id,
        to_warehouse_id,
        quantity,
        notes,
        transferred_by
      } = transferData;

      // Verificar stock origen
      const [fromStock] = await connection.execute(
        'SELECT quantity FROM stock WHERE product_id = ? AND warehouse_id = ? AND deleted_at IS NULL',
        [product_id, from_warehouse_id]
      );

      if (fromStock.length === 0 || fromStock[0].quantity < quantity) {
        throw new Error('Stock insuficiente en almacén origen');
      }

      // Reducir stock origen
      await connection.execute(
        'UPDATE stock SET quantity = quantity - ?, updated_at = NOW() WHERE product_id = ? AND warehouse_id = ?',
        [quantity, product_id, from_warehouse_id]
      );

      // Aumentar stock destino
      await connection.execute(`
        INSERT INTO stock (product_id, warehouse_id, quantity, created_at, updated_at)
        VALUES (?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE quantity = quantity + ?, updated_at = NOW()
      `, [product_id, to_warehouse_id, quantity, quantity]);

      // Registrar movimientos
      await connection.execute(`
        INSERT INTO stock_movements (
          product_id, warehouse_id, movement_type, quantity,
          reference_type, notes, created_by, created_at
        ) VALUES 
        (?, ?, 'transfer_out', ?, 'transfer', ?, ?, NOW()),
        (?, ?, 'transfer_in', ?, 'transfer', ?, ?, NOW())
      `, [
        product_id, from_warehouse_id, -quantity, notes, transferred_by,
        product_id, to_warehouse_id, quantity, notes, transferred_by
      ]);

      await connection.commit();

      return { message: 'Transferencia completada exitosamente' };

    } catch (error) {
      await connection.rollback();
      logError('Error transferring stock:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener productos con stock bajo
   */
  static async getLowStock(warehouse_id = null, limit = 50) {
    try {
      let query = `
        SELECT 
          s.product_id,
          p.name as product_name,
          p.sku,
          p.min_stock,
          s.quantity as current_stock,
          w.name as warehouse_name,
          (p.min_stock - s.quantity) as deficit
        FROM stock s
        INNER JOIN products p ON s.product_id = p.id
        INNER JOIN warehouses w ON s.warehouse_id = w.id
        WHERE s.quantity <= p.min_stock 
          AND s.deleted_at IS NULL
          AND p.deleted_at IS NULL
      `;

      const params = [];

      if (warehouse_id) {
        query += ' AND s.warehouse_id = ?';
        params.push(warehouse_id);
      }

      query += ' ORDER BY deficit DESC LIMIT ?';
      params.push(parseInt(limit));

      const [products] = await db.execute(query, params);
      return products;

    } catch (error) {
      logError('Error getting low stock products:', error);
      throw error;
    }
  }

  /**
   * Obtener movimientos de stock
   */
  static async getMovements(filters = {}) {
    try {
      const {
        product_id = null,
        warehouse_id = null,
        movement_type = null,
        date_from = null,
        date_to = null,
        page = 1,
        limit = 50
      } = filters;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE sm.deleted_at IS NULL';
      const params = [];

      if (product_id) {
        whereClause += ' AND sm.product_id = ?';
        params.push(product_id);
      }

      if (warehouse_id) {
        whereClause += ' AND sm.warehouse_id = ?';
        params.push(warehouse_id);
      }

      if (movement_type) {
        whereClause += ' AND sm.movement_type = ?';
        params.push(movement_type);
      }

      if (date_from) {
        whereClause += ' AND DATE(sm.created_at) >= ?';
        params.push(date_from);
      }

      if (date_to) {
        whereClause += ' AND DATE(sm.created_at) <= ?';
        params.push(date_to);
      }

      const query = `
        SELECT 
          sm.*,
          p.name as product_name,
          p.sku as product_sku,
          w.name as warehouse_name,
          u.first_name as user_first_name,
          u.last_name as user_last_name
        FROM stock_movements sm
        INNER JOIN products p ON sm.product_id = p.id
        INNER JOIN warehouses w ON sm.warehouse_id = w.id
        LEFT JOIN users u ON sm.created_by = u.id
        ${whereClause}
        ORDER BY sm.created_at DESC
        LIMIT ? OFFSET ?
      `;

      params.push(parseInt(limit), offset);
      const [movements] = await db.execute(query, params);

      // Contar total
      const countQuery = `SELECT COUNT(*) as total FROM stock_movements sm ${whereClause}`;
      const [countResult] = await db.execute(countQuery, params.slice(0, -2));

      return {
        movements,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      };

    } catch (error) {
      logError('Error getting stock movements:', error);
      throw error;
    }
  }

  /**
   * Obtener valorización de inventario
   */
  static async getValuation(warehouse_id = null) {
    try {
      let query = `
        SELECT 
          w.name as warehouse_name,
          COUNT(DISTINCT s.product_id) as total_products,
          SUM(s.quantity) as total_units,
          SUM(s.quantity * p.cost_price) as total_cost_value,
          SUM(s.quantity * p.sale_price) as total_sale_value
        FROM stock s
        INNER JOIN products p ON s.product_id = p.id
        INNER JOIN warehouses w ON s.warehouse_id = w.id
        WHERE s.deleted_at IS NULL AND p.deleted_at IS NULL
      `;

      const params = [];

      if (warehouse_id) {
        query += ' AND s.warehouse_id = ?';
        params.push(warehouse_id);
        query += ' GROUP BY w.id, w.name';
      } else {
        query += ' GROUP BY w.id, w.name';
      }

      const [result] = await db.execute(query, params);
      return result;

    } catch (error) {
      logError('Error getting stock valuation:', error);
      throw error;
    }
  }
}

module.exports = Stock;