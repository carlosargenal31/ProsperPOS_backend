// ===================================================================
// PROSPERPOS - SERVICIO DE PRODUCTOS E INVENTARIO
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class ProductService {
  
  // =================================================================
  // MÉTODOS DE PRODUCTOS
  // =================================================================

  /**
   * Obtener lista de productos con filtros
   */
  /**
   * Obtener todos los productos para búsqueda (sin paginación)
   */
  static async getAllProductsForSearch(filters) {
    try {
      const { search = '', status = 'active' } = filters;

      let whereClause = 'WHERE p.deleted_at IS NULL';
      const params = [];

      // Filtro de estado
      if (status && status !== 'all') {
        if (status === 'active') {
          whereClause += ' AND p.is_active = 1';
        } else if (status === 'inactive') {
          whereClause += ' AND p.is_active = 0';
        }
      }

      // Filtro de búsqueda
      if (search) {
        whereClause += ' AND (p.name LIKE ? OR p.code LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
      }

      const query = `
        SELECT
          p.id,
          p.code,
          p.name,
          p.is_active,
          c.name as category_name,
          sc.name as subcategory_name,
          b.name as brand_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
        LEFT JOIN brands b ON p.brand_id = b.id
        ${whereClause}
        ORDER BY p.name ASC
        LIMIT 10000
      `;

      const products = await db.query(query, params);
      return products;

    } catch (error) {
      logger.error('Error in getAllProductsForSearch:', error);
      throw error;
    }
  }

  static async getProducts(filters) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        category_id,
        subcategory_id,
        brand_id,
        sort_by = 'id',
        sort_order = 'ASC',
        warehouse_id,
        includeStock = false
      } = filters;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      let whereClause = 'WHERE p.deleted_at IS NULL';
      const searchParams = [];

      // Filtro de búsqueda
      if (search) {
        whereClause += ' AND (p.name LIKE ? OR p.code LIKE ?)';
        const searchTerm = `%${search}%`;
        searchParams.push(searchTerm, searchTerm);
      }

      // Filtro de categoría
      if (category_id) {
        whereClause += ' AND p.category_id = ?';
        searchParams.push(parseInt(category_id));
      }

      // Filtro de subcategoría
      if (subcategory_id) {
        whereClause += ' AND p.subcategory_id = ?';
        searchParams.push(parseInt(subcategory_id));
      }

      // Filtro de marca
      if (brand_id) {
        whereClause += ' AND p.brand_id = ?';
        searchParams.push(parseInt(brand_id));
      }

      // Validar columna de ordenamiento para prevenir SQL injection
      const validSortColumns = {
        'id': 'p.id',
        'name': 'p.name',
        'code': 'p.code',
        'price_1': 'p.price_1',
        'stock': includeStock ? 'stock' : 'p.id', // Ordenar por stock calculado si está incluido
        'is_active': 'p.is_active',
        'category_name': 'c.name',
        'created_at': 'p.created_at',
        'updated_at': 'p.updated_at'
      };

      const sortColumn = validSortColumns[sort_by] || 'p.id';
      const sortDirection = ['ASC', 'DESC'].includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'ASC';

      // Construir query con ORDER BY seguro (sin interpolación problemática)
      const orderByClause = `ORDER BY ${sortColumn} ${sortDirection}`;

      // Construir query según necesidades de stock
      let query;

      if (includeStock && !warehouse_id) {
        // Stock total de todas las bodegas usando subconsulta
        query = `
          SELECT
            p.*,
            c.name as category_name,
            sc.name as subcategory_name,
            b.name as brand_name,
            ROUND(COALESCE(stock_totals.total_stock, 0), 2) as stock
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
          LEFT JOIN brands b ON p.brand_id = b.id
          LEFT JOIN (
            SELECT product_id, ROUND(SUM(quantity), 2) as total_stock
            FROM stock
            GROUP BY product_id
          ) stock_totals ON p.id = stock_totals.product_id
          ${whereClause}
          ${orderByClause}
          LIMIT ${limitNum} OFFSET ${offset}
        `;
      } else if (includeStock && warehouse_id) {
        // Stock de una bodega específica
        query = `
          SELECT
            p.*,
            c.name as category_name,
            sc.name as subcategory_name,
            b.name as brand_name,
            ROUND(COALESCE(s.quantity, 0), 2) as stock
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
          LEFT JOIN brands b ON p.brand_id = b.id
          LEFT JOIN stock s ON p.id = s.product_id AND s.warehouse_id = ${parseInt(warehouse_id)}
          ${whereClause}
          ${orderByClause}
          LIMIT ${limitNum} OFFSET ${offset}
        `;
      } else {
        // Sin stock
        query = `
          SELECT
            p.*,
            c.name as category_name,
            sc.name as subcategory_name,
            b.name as brand_name
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
          LEFT JOIN brands b ON p.brand_id = b.id
          ${whereClause}
          ${orderByClause}
          LIMIT ${limitNum} OFFSET ${offset}
        `;
      }

      // Para esta query usamos solo los parámetros de búsqueda
      const products = await db.query(query, searchParams);

      // Contar total
      const countQuery = `SELECT COUNT(*) as total FROM products p ${whereClause}`;
      const countResult = await db.execute(countQuery, searchParams);

      return {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      };

    } catch (error) {
      logger.error('Error in getProducts:', error);
      throw error;
    }
  }

  /**
   * Obtener producto por ID
   */
  static async getProductById(id) {
    try {
      const query = `
        SELECT
          p.*,
          c.name as category_name,
          sc.name as subcategory_name,
          b.name as brand_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.id = ? AND p.deleted_at IS NULL
      `;

      const rows = await db.execute(query, [id]);
      return rows[0] || null;

    } catch (error) {
      logger.error('Error in getProductById:', error);
      throw error;
    }
  }

  /**
   * Obtener producto por código de barras
   * NOTA: Campo barcode eliminado de la BD
   */
  static async getProductByBarcode(barcode, store_id = 1) {
    try {
      // Buscar por código normal en lugar de barcode
      const query = `
        SELECT
          p.*,
          c.name as category_name,
          (SELECT SUM(st.quantity) FROM stock st WHERE st.product_id = p.id) as current_stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.code = ? AND p.is_active = 1 AND p.deleted_at IS NULL
      `;

      const [rows] = await db.execute(query, [barcode]);
      return rows[0] || null;

    } catch (error) {
      logger.error('Error in getProductByBarcode:', error);
      throw error;
    }
  }

  /**
   * Crear producto
   */
  static async createProduct(productData) {
    try {
      const {
        name,
        short_name,
        code,
        category_id,
        subcategory_id,
        brand_id,
        supplier_id,
        description,
        cost = 0,
        price_1 = 0,
        price_2 = 0,
        price_3 = 0,
        price_4 = 0,
        price_5 = 0,
        price_6 = 0,
        unit_id,
        weight,
        show_in_online_store = 0,
        is_featured = 0,
        tax_id,
        image_url,
        is_active = 1,
        created_by
      } = productData;

      // Verificar duplicados
      const existing = await db.execute(
        'SELECT id FROM products WHERE code = ? AND deleted_at IS NULL',
        [code]
      );

      if (existing.length > 0) {
        throw new Error('Ya existe un producto con ese código');
      }

      // Insertar producto
      const insertQuery = `
        INSERT INTO products (
          name, short_name, code, category_id, subcategory_id, brand_id, supplier_id,
          description, cost, price_1, price_2, price_3, price_4, price_5, price_6,
          unit_id, weight, show_in_online_store, is_featured, tax_id, image, is_active, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const result = await db.execute(insertQuery, [
        name, short_name, code, category_id, subcategory_id, brand_id, supplier_id,
        description, cost, price_1, price_2, price_3, price_4, price_5, price_6,
        unit_id, weight, show_in_online_store, is_featured, tax_id, image_url, is_active, created_by
      ]);

      return {
        id: result.insertId,
        code,
        name
      };

    } catch (error) {
      logger.error('Error in createProduct:', error);
      throw error;
    }
  }

  /**
   * Actualizar producto
   */
  static async updateProduct(id, productData) {
    try {
      const {
        name,
        short_name,
        category_id,
        subcategory_id,
        brand_id,
        supplier_id,
        description,
        cost,
        price_1,
        price_2,
        price_3,
        price_4,
        price_5,
        price_6,
        unit_id,
        weight,
        show_in_online_store,
        is_featured,
        tax_id,
        image_url,
        is_active,
        updated_by
      } = productData;

      // Verificar que existe
      const existing = await db.execute(
        'SELECT id FROM products WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Producto no encontrado');
      }

      // Actualizar
      const updateQuery = `
        UPDATE products SET
          name = ?, short_name = ?, category_id = ?, subcategory_id = ?,
          brand_id = ?, supplier_id = ?, description = ?, cost = ?, price_1 = ?, price_2 = ?,
          price_3 = ?, price_4 = ?, price_5 = ?, price_6 = ?,
          unit_id = ?, weight = ?, show_in_online_store = ?, is_featured = ?, tax_id = ?,
          image = ?, is_active = ?,
          updated_by = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await db.execute(updateQuery, [
        name, short_name, category_id, subcategory_id, brand_id, supplier_id,
        description, cost, price_1, price_2, price_3, price_4, price_5, price_6,
        unit_id, weight, show_in_online_store, is_featured, tax_id, image_url, is_active, updated_by, id
      ]);

      return { id, name };

    } catch (error) {
      logger.error('Error in updateProduct:', error);
      throw error;
    }
  }

  /**
   * Eliminar producto (soft delete)
   */
  static async deleteProduct(id, deleted_by) {
    try {
      // Verificar que existe
      const existing = await db.execute(
        'SELECT id, stock FROM products WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        return {
          success: false,
          statusCode: 404,
          message: 'Producto no encontrado'
        };
      }

      // Verificar si tiene stock
      if (existing[0].stock > 0) {
        return {
          success: false,
          statusCode: 409,
          message: 'No se puede eliminar un producto con stock existente'
        };
      }

      // Soft delete
      await db.execute(
        'UPDATE products SET deleted_at = NOW(), is_active = 0 WHERE id = ?',
        [id]
      );

      return {
        success: true,
        message: 'Producto eliminado exitosamente'
      };

    } catch (error) {
      logger.error('Error in deleteProduct:', error);
      throw error;
    }
  }

  /**
   * Generar código de producto
   */
  static async generateProductCode(category_id) {
    try {
      let prefix = 'PRD';

      if (category_id) {
        const [category] = await db.execute(
          'SELECT code FROM categories WHERE id = ?',
          [category_id]
        );
        
        if (category[0]?.code) {
          prefix = category[0].code;
        }
      }

      // Obtener último número
      const [result] = await db.execute(
        'SELECT COUNT(*) as count FROM products WHERE code LIKE ?',
        [`${prefix}%`]
      );

      const nextNumber = (result[0].count + 1).toString().padStart(6, '0');
      return `${prefix}${nextNumber}`;

    } catch (error) {
      logger.error('Error in generateProductCode:', error);
      throw error;
    }
  }

  // =================================================================
  // MÉTODOS DE INVENTARIO
  // =================================================================

  /**
   * Obtener resumen de inventario
   */
  static async getInventorySummary(store_id = 1) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT p.id) as total_products,
          COUNT(DISTINCT CASE WHEN p.is_active = 1 THEN p.id END) as active_products,
          COALESCE(SUM(s.quantity), 0) as total_stock,
          COUNT(DISTINCT CASE WHEN s.quantity <= p.min_stock THEN p.id END) as low_stock_count
        FROM products p
        LEFT JOIN stock s ON p.id = s.product_id
        WHERE p.deleted_at IS NULL
      `;

      const [result] = await db.execute(query);
      return result[0];

    } catch (error) {
      logger.error('Error in getInventorySummary:', error);
      throw error;
    }
  }

  /**
   * Obtener productos con stock bajo
   */
  static async getLowStockProducts(store_id = 1, limit = 20) {
    try {
      const query = `
        SELECT 
          p.id,
          p.name,
          p.code,
          p.min_stock,
          COALESCE(SUM(s.quantity), 0) as current_stock,
          c.name as category_name
        FROM products p
        LEFT JOIN stock s ON p.id = s.product_id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = 1 AND p.deleted_at IS NULL
        GROUP BY p.id
        HAVING current_stock <= p.min_stock
        ORDER BY current_stock ASC
        LIMIT ?
      `;

      const [rows] = await db.execute(query, [limit]);
      return rows;

    } catch (error) {
      logger.error('Error in getLowStockProducts:', error);
      throw error;
    }
  }

  /**
   * Obtener stock actual
   */
  static async getStock(filters) {
    try {
      const {
        warehouse_id,
        product_id,
        low_stock = false,
        page = 1,
        limit = 20,
        store_id = 1
      } = filters;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE p.deleted_at IS NULL';
      const params = [];

      if (product_id) {
        whereClause += ' AND p.id = ?';
        params.push(product_id);
      }

      if (warehouse_id) {
        whereClause += ' AND s.warehouse_id = ?';
        params.push(warehouse_id);
      }

      const query = `
        SELECT
          p.id as product_id,
          p.name as product_name,
          p.code as product_code,
          w.id as warehouse_id,
          w.nombre as warehouse_name,
          COALESCE(s.quantity, 0) as quantity,
          COALESCE(s.min_stock, 0) as min_stock,
          COALESCE(s.max_stock, 1000) as max_stock
        FROM products p
        CROSS JOIN warehouses w
        LEFT JOIN stock s ON p.id = s.product_id AND s.warehouse_id = w.id
        ${whereClause} AND w.deleted_at IS NULL
        ${low_stock ? 'AND s.quantity <= s.min_stock' : ''}
        ORDER BY p.name, w.nombre
        LIMIT ? OFFSET ?
      `;

      params.push(limit, offset);

      const stock = await db.execute(query, params);

      logger.info('Stock query result:', {
        stockIsArray: Array.isArray(stock),
        stockLength: stock ? stock.length : 0,
        stockType: typeof stock,
        firstItem: stock ? stock[0] : null,
        secondItem: stock ? stock[1] : null,
        product_id
      });

      // Contar total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM products p
        CROSS JOIN warehouses w
        LEFT JOIN stock s ON p.id = s.product_id AND s.warehouse_id = w.id
        ${whereClause} AND w.deleted_at IS NULL
      `;
      const countParams = params.slice(0, -2); // Remover limit y offset
      const countResult = await db.execute(countQuery, countParams);

      // Safety check for countResult
      const total = countResult && countResult.length > 0 && countResult[0] ? countResult[0].total : 0;

      return {
        stock,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      logger.error('Error in getStock:', error);
      throw error;
    }
  }

  /**
   * Verificar stock disponible
   */
  static async checkStock(product_id, quantity, store_id = 1) {
    try {
      const query = `
        SELECT 
          p.name,
          COALESCE(SUM(s.quantity), 0) as current_stock
        FROM products p
        LEFT JOIN stock s ON p.id = s.product_id
        WHERE p.id = ? AND p.is_active = 1 AND p.deleted_at IS NULL
        GROUP BY p.id
      `;

      const [rows] = await db.execute(query, [product_id]);

      if (!rows[0]) {
        return {
          available: false,
          message: 'Producto no encontrado'
        };
      }

      const currentStock = rows[0].current_stock;
      const available = currentStock >= quantity;

      return {
        available,
        current_stock: currentStock,
        requested_quantity: quantity,
        message: available 
          ? 'Stock disponible' 
          : `Stock insuficiente. Disponible: ${currentStock}`
      };

    } catch (error) {
      logger.error('Error in checkStock:', error);
      throw error;
    }
  }

  /**
   * Validar stock para venta
   */
  static async validateStockForSale(items, store_id = 1) {
    try {
      const results = [];
      let allAvailable = true;

      for (const item of items) {
        const check = await this.checkStock(item.product_id, item.quantity, store_id);
        results.push({
          product_id: item.product_id,
          ...check
        });

        if (!check.available) {
          allAvailable = false;
        }
      }

      return {
        valid: allAvailable,
        items: results
      };

    } catch (error) {
      logger.error('Error in validateStockForSale:', error);
      throw error;
    }
  }

  /**
   * Ajustar stock
   */
  static async adjustStock(data) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const {
        product_id,
        new_quantity,
        reason,
        warehouse_id = 1,
        store_id = 1,
        adjusted_by,
        notes
      } = data;

      // Obtener stock actual
      const [currentStock] = await connection.execute(
        'SELECT quantity FROM stock WHERE product_id = ? AND warehouse_id = ?',
        [product_id, warehouse_id]
      );

      const oldQuantity = currentStock[0]?.quantity || 0;
      const difference = new_quantity - oldQuantity;

      // Actualizar o insertar stock
      if (currentStock.length > 0) {
        await connection.execute(
          'UPDATE stock SET quantity = ?, updated_at = NOW() WHERE product_id = ? AND warehouse_id = ?',
          [new_quantity, product_id, warehouse_id]
        );
      } else {
        await connection.execute(
          'INSERT INTO stock (product_id, warehouse_id, quantity, created_at) VALUES (?, ?, ?, NOW())',
          [product_id, warehouse_id, new_quantity]
        );
      }

      // Registrar movimiento
      await connection.execute(`
        INSERT INTO stock_movements (
          product_id, warehouse_id, movement_type, quantity,
          reference_type, notes, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        product_id, warehouse_id, 'adjustment', difference,
        reason, notes, adjusted_by
      ]);

      await connection.commit();

      return {
        product_id,
        old_quantity: oldQuantity,
        new_quantity,
        difference
      };

    } catch (error) {
      await connection.rollback();
      logger.error('Error in adjustStock:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Transferir stock entre almacenes
   */
  static async transferStock(data) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const {
        product_id,
        from_warehouse_id,
        to_warehouse_id,
        quantity,
        store_id = 1,
        transferred_by,
        notes
      } = data;

      // Verificar stock origen
      const [fromStock] = await connection.execute(
        'SELECT quantity FROM stock WHERE product_id = ? AND warehouse_id = ?',
        [product_id, from_warehouse_id]
      );

      if (!fromStock[0] || fromStock[0].quantity < quantity) {
        throw new Error('Stock insuficiente en almacén origen');
      }

      // Descontar del origen
      await connection.execute(
        'UPDATE stock SET quantity = quantity - ?, updated_at = NOW() WHERE product_id = ? AND warehouse_id = ?',
        [quantity, product_id, from_warehouse_id]
      );

      // Agregar al destino
      const [toStock] = await connection.execute(
        'SELECT quantity FROM stock WHERE product_id = ? AND warehouse_id = ?',
        [product_id, to_warehouse_id]
      );

      if (toStock.length > 0) {
        await connection.execute(
          'UPDATE stock SET quantity = quantity + ?, updated_at = NOW() WHERE product_id = ? AND warehouse_id = ?',
          [quantity, product_id, to_warehouse_id]
        );
      } else {
        await connection.execute(
          'INSERT INTO stock (product_id, warehouse_id, quantity, created_at) VALUES (?, ?, ?, NOW())',
          [product_id, to_warehouse_id, quantity]
        );
      }

      // Registrar movimientos
      await connection.execute(`
        INSERT INTO stock_movements (
          product_id, warehouse_id, movement_type, quantity,
          reference_type, notes, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [product_id, from_warehouse_id, 'out', -quantity, 'transfer', notes, transferred_by]);

      await connection.execute(`
        INSERT INTO stock_movements (
          product_id, warehouse_id, movement_type, quantity,
          reference_type, notes, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [product_id, to_warehouse_id, 'in', quantity, 'transfer', notes, transferred_by]);

      await connection.commit();

      return {
        product_id,
        from_warehouse_id,
        to_warehouse_id,
        quantity
      };

    } catch (error) {
      await connection.rollback();
      logger.error('Error in transferStock:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // =================================================================
  // MÉTODOS DE REPORTES
  // =================================================================

  /**
   * Reporte de movimientos
   */
  static async getMovementsReport(filters) {
    try {
      const {
        warehouse_id,
        product_id,
        movement_type,
        date_from,
        date_to,
        page = 1,
        limit = 20,
        store_id = 1
      } = filters;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (warehouse_id) {
        whereClause += ' AND sm.warehouse_id = ?';
        params.push(warehouse_id);
      }

      if (product_id) {
        whereClause += ' AND sm.product_id = ?';
        params.push(product_id);
      }

      if (movement_type) {
        whereClause += ' AND sm.movement_type = ?';
        params.push(movement_type);
      }

      if (date_from) {
        whereClause += ' AND sm.created_at >= ?';
        params.push(date_from);
      }

      if (date_to) {
        whereClause += ' AND sm.created_at <= ?';
        params.push(date_to);
      }

      const query = `
        SELECT 
          sm.*,
          p.name as product_name,
          p.code as product_code,
          w.name as warehouse_name,
          u.username as created_by_name
        FROM stock_movements sm
        INNER JOIN products p ON sm.product_id = p.id
        LEFT JOIN warehouses w ON sm.warehouse_id = w.id
        LEFT JOIN users u ON sm.created_by = u.id
        ${whereClause}
        ORDER BY sm.created_at DESC
        LIMIT ? OFFSET ?
      `;

      params.push(limit, offset);

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
          pages: Math.ceil(countResult[0].total / limit)
        }
      };

    } catch (error) {
      logger.error('Error in getMovementsReport:', error);
      throw error;
    }
  }

  /**
   * Reporte de valorización
   */
  static async getValuationReport(store_id = 1, warehouse_id = null) {
    try {
      let whereClause = 'WHERE p.deleted_at IS NULL';
      const params = [];

      if (warehouse_id) {
        whereClause += ' AND s.warehouse_id = ?';
        params.push(warehouse_id);
      }

      const query = `
        SELECT 
          p.id,
          p.name,
          p.code,
          c.name as category_name,
          COALESCE(SUM(s.quantity), 0) as quantity,
          0 as unit_cost,
          0 as total_value
        FROM products p
        LEFT JOIN stock s ON p.id = s.product_id
        LEFT JOIN categories c ON p.category_id = c.id
        ${whereClause}
        GROUP BY p.id
        HAVING quantity > 0
        ORDER BY total_value DESC
      `;

      const [items] = await db.execute(query, params);

      const totalValue = items.reduce((sum, item) => sum + item.total_value, 0);

      return {
        items,
        summary: {
          total_products: items.length,
          total_value: totalValue
        }
      };

    } catch (error) {
      logger.error('Error in getValuationReport:', error);
      throw error;
    }
  }

  /**
   * Reporte de stock crítico
   */
  static async getCriticalStockReport(store_id = 1) {
    try {
      const query = `
        SELECT 
          p.id,
          p.name,
          p.code,
          p.min_stock,
          COALESCE(SUM(s.quantity), 0) as current_stock,
          c.name as category_name,
          CASE
            WHEN COALESCE(SUM(s.quantity), 0) = 0 THEN 'Sin Stock'
            WHEN COALESCE(SUM(s.quantity), 0) <= p.min_stock * 0.5 THEN 'Crítico'
            WHEN COALESCE(SUM(s.quantity), 0) <= p.min_stock THEN 'Bajo'
            ELSE 'Normal'
          END as severity
        FROM products p
        LEFT JOIN stock s ON p.id = s.product_id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = 1 AND p.deleted_at IS NULL
        GROUP BY p.id
        HAVING current_stock <= p.min_stock
        ORDER BY 
          CASE severity
            WHEN 'Sin Stock' THEN 1
            WHEN 'Crítico' THEN 2
            WHEN 'Bajo' THEN 3
            ELSE 4
          END,
          current_stock ASC
      `;

      const [products] = await db.execute(query);

      return {
        products,
        summary: {
          total: products.length,
          sin_stock: products.filter(p => p.severity === 'Sin Stock').length,
          critico: products.filter(p => p.severity === 'Crítico').length,
          bajo: products.filter(p => p.severity === 'Bajo').length
        }
      };

    } catch (error) {
      logger.error('Error in getCriticalStockReport:', error);
      throw error;
    }
  }

  /**
   * Guardar imágenes de galería del producto
   */
  static async saveProductGalleryImages(product_id, images) {
    try {
      // Primero eliminar imágenes existentes (soft delete)
      await db.query(
        'UPDATE product_images SET deleted_at = NOW() WHERE product_id = ? AND deleted_at IS NULL',
        [product_id]
      );

      // Insertar nuevas imágenes
      if (images && images.length > 0) {
        const insertQuery = `
          INSERT INTO product_images (product_id, image_url, image_order, is_primary, created_at)
          VALUES (?, ?, ?, ?, NOW())
        `;

        for (const img of images) {
          await db.query(insertQuery, [
            product_id,
            img.image_url,
            img.image_order || 0,
            img.is_primary || false
          ]);
        }

        logger.info('Gallery images saved', {
          productId: product_id,
          imagesCount: images.length
        });
      }

      return true;
    } catch (error) {
      logger.error('Error saving product gallery images:', error);
      throw error;
    }
  }

  /**
   * Obtener imágenes de galería del producto
   */
  static async getProductGalleryImages(product_id) {
    try {
      const [images] = await db.query(
        `SELECT id, image_url, image_order, is_primary, created_at
         FROM product_images
         WHERE product_id = ? AND deleted_at IS NULL
         ORDER BY image_order ASC`,
        [product_id]
      );

      return images;
    } catch (error) {
      logger.error('Error getting product gallery images:', error);
      throw error;
    }
  }
}

module.exports = ProductService;
