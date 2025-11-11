// ===================================================================
// PROSPERPOS - MODELOS DE PRODUCTOS E INVENTARIO
// ===================================================================

// src/models/Product.model.js
const db = require('../utils/database');
const { logError } = require('../utils/logger');

class Product {
  // ===================================================================
  // MÉTODOS DE CONSULTA
  // ===================================================================

  /**
   * Obtener todos los productos con paginación y filtros
   */
  static async getAll(filters = {}) {
    try {
      const { 
        page = 1, 
        limit = 50, 
        search = '', 
        category_id = null, 
        brand_id = null, 
        status = 'active',
        store_id = null
      } = filters;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE p.deleted_at IS NULL';
      const params = [];

      // Filtros dinámicos
      if (search) {
        whereClause += ' AND (p.name LIKE ? OR p.code LIKE ? OR p.barcode LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (category_id) {
        whereClause += ' AND p.category_id = ?';
        params.push(category_id);
      }

      if (brand_id) {
        whereClause += ' AND p.brand_id = ?';
        params.push(brand_id);
      }

      if (status) {
        whereClause += ' AND p.status = ?';
        params.push(status);
      }

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
        ${whereClause}
        ORDER BY p.id ASC
        LIMIT ? OFFSET ?
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM products p
        ${whereClause}
      `;

      params.push(parseInt(limit), offset);

      const [products] = await db.execute(query, params);

      // Contar total para paginación
      const countParams = params.slice(0, -2); // Remover limit/offset
      const [countResult] = await db.execute(countQuery, countParams);
      const total = countResult[0].total;

      return {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logError('Error getting products:', error);
      throw error;
    }
  }

  /**
   * Obtener producto por ID con stock y precios
   */
  static async getById(id, store_id = 1) {
    try {
      const query = `
        SELECT 
          p.*,
          c.name as category_name,
          b.name as brand_name,
          t.name as tax_name,
          t.rate as tax_rate,
          (SELECT SUM(s.quantity) FROM stock s WHERE s.product_id = p.id AND s.store_id = ?) as current_stock,
          (SELECT price FROM product_prices pp WHERE pp.product_id = p.id AND pp.price_type = 'sale' AND pp.store_id = ? LIMIT 1) as sale_price,
          (SELECT price FROM product_prices pp WHERE pp.product_id = p.id AND pp.price_type = 'purchase' AND pp.store_id = ? LIMIT 1) as purchase_price,
          (SELECT cost FROM product_prices pp WHERE pp.product_id = p.id AND pp.price_type = 'cost' AND pp.store_id = ? LIMIT 1) as cost_price
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN taxes t ON p.tax_id = t.id
        WHERE p.id = ? AND p.deleted_at IS NULL
      `;

      const [rows] = await db.execute(query, [store_id, store_id, store_id, store_id, id]);
      return rows[0] || null;
    } catch (error) {
      logError('Error getting product by ID:', error);
      throw error;
    }
  }

  /**
   * Buscar productos por código de barras
   */
  static async getByBarcode(barcode, store_id = 1) {
    try {
      const query = `
        SELECT 
          p.*,
          c.name as category_name,
          (SELECT SUM(s.quantity) FROM stock s WHERE s.product_id = p.id AND s.store_id = ?) as current_stock,
          (SELECT price FROM product_prices pp WHERE pp.product_id = p.id AND pp.price_type = 'sale' AND pp.store_id = ? LIMIT 1) as sale_price
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.barcode = ? AND p.status = 'active' AND p.deleted_at IS NULL
      `;

      const [rows] = await db.execute(query, [store_id, store_id, barcode]);
      return rows[0] || null;
    } catch (error) {
      logError('Error getting product by barcode:', error);
      throw error;
    }
  }

  // ===================================================================
  // MÉTODOS DE CREACIÓN Y MODIFICACIÓN
  // ===================================================================

  /**
   * Crear nuevo producto
   */
  static async create(productData) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const {
        name,
        code,
        barcode,
        category_id,
        brand_id,
        description,
        tax_id,
        unit,
        min_stock,
        max_stock,
        status = 'active',
        image,
        cost_price,
        sale_price,
        purchase_price,
        store_id = 1,
        created_by
      } = productData;

      // Generar código si no se proporciona
      const productCode = code || await this.generateProductCode(category_id);

      // Insertar producto
      const productQuery = `
        INSERT INTO products (
          name, code, barcode, category_id, brand_id, description, 
          tax_id, unit, min_stock, max_stock, status, image, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await connection.execute(productQuery, [
        name, productCode, barcode, category_id, brand_id, description,
        tax_id, unit, min_stock, max_stock, status, image, created_by
      ]);

      const productId = result.insertId;

      // Insertar precios
      if (cost_price || sale_price || purchase_price) {
        await this.updatePrices(productId, {
          cost_price,
          sale_price, 
          purchase_price,
          store_id
        }, connection);
      }

      await connection.commit();

      return {
        id: productId,
        code: productCode,
        message: 'Producto creado exitosamente'
      };

    } catch (error) {
      await connection.rollback();
      logError('Error creating product:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar producto
   */
  static async update(id, productData) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const {
        name,
        barcode,
        category_id,
        brand_id,
        description,
        tax_id,
        unit,
        min_stock,
        max_stock,
        status,
        image,
        cost_price,
        sale_price,
        purchase_price,
        store_id = 1,
        updated_by
      } = productData;

      // Actualizar datos del producto
      const updateQuery = `
        UPDATE products SET 
          name = ?, barcode = ?, category_id = ?, brand_id = ?, 
          description = ?, tax_id = ?, unit = ?, min_stock = ?, 
          max_stock = ?, status = ?, image = ?, updated_by = ?, updated_at = NOW()
        WHERE id = ? AND deleted_at IS NULL
      `;

      await connection.execute(updateQuery, [
        name, barcode, category_id, brand_id, description, tax_id,
        unit, min_stock, max_stock, status, image, updated_by, id
      ]);

      // Actualizar precios si se proporcionan
      if (cost_price !== undefined || sale_price !== undefined || purchase_price !== undefined) {
        await this.updatePrices(id, {
          cost_price,
          sale_price,
          purchase_price,
          store_id
        }, connection);
      }

      await connection.commit();
      
      return { message: 'Producto actualizado exitosamente' };

    } catch (error) {
      await connection.rollback();
      logError('Error updating product:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Eliminar producto (soft delete)
   */
  static async delete(id, deleted_by) {
    try {
      const query = `
        UPDATE products SET 
          deleted_at = NOW(), 
          deleted_by = ?,
          status = 'inactive'
        WHERE id = ? AND deleted_at IS NULL
      `;

      const [result] = await db.execute(query, [deleted_by, id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Producto no encontrado');
      }

      return { message: 'Producto eliminado exitosamente' };
    } catch (error) {
      logError('Error deleting product:', error);
      throw error;
    }
  }

  // ===================================================================
  // MÉTODOS DE UTILIDAD
  // ===================================================================

  /**
   * Generar código único de producto
   */
  static async generateProductCode(category_id) {
    try {
      // Obtener prefijo de categoría
      const [categoryResult] = await db.execute(
        'SELECT code FROM categories WHERE id = ?', 
        [category_id]
      );
      
      const categoryPrefix = categoryResult[0]?.code || 'PRD';
      
      // Obtener último número
      const [countResult] = await db.execute(
        'SELECT COUNT(*) as count FROM products WHERE code LIKE ?',
        [`${categoryPrefix}%`]
      );
      
      const nextNumber = (countResult[0].count + 1).toString().padStart(6, '0');
      
      return `${categoryPrefix}${nextNumber}`;
    } catch (error) {
      logError('Error generating product code:', error);
      throw error;
    }
  }

  /**
   * Actualizar precios de producto
   */
  static async updatePrices(productId, prices, connection = null) {
    const db_conn = connection || db;
    
    try {
      const { cost_price, sale_price, purchase_price, store_id = 1 } = prices;

      // Eliminar precios existentes para esta tienda
      await db_conn.execute(
        'DELETE FROM product_prices WHERE product_id = ? AND store_id = ?',
        [productId, store_id]
      );

      const priceInserts = [];
      const priceValues = [];

      if (cost_price !== undefined && cost_price !== null) {
        priceInserts.push('(?, ?, ?, ?, NOW())');
        priceValues.push(productId, store_id, 'cost', parseFloat(cost_price));
      }

      if (sale_price !== undefined && sale_price !== null) {
        priceInserts.push('(?, ?, ?, ?, NOW())');
        priceValues.push(productId, store_id, 'sale', parseFloat(sale_price));
      }

      if (purchase_price !== undefined && purchase_price !== null) {
        priceInserts.push('(?, ?, ?, ?, NOW())');
        priceValues.push(productId, store_id, 'purchase', parseFloat(purchase_price));
      }

      if (priceInserts.length > 0) {
        const insertQuery = `
          INSERT INTO product_prices (product_id, store_id, price_type, price, created_at)
          VALUES ${priceInserts.join(', ')}
        `;

        await db_conn.execute(insertQuery, priceValues);
      }

    } catch (error) {
      logError('Error updating product prices:', error);
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
          SUM(s.quantity) as current_stock,
          c.name as category_name
        FROM products p
        LEFT JOIN stock s ON p.id = s.product_id AND s.store_id = ?
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'active' AND p.deleted_at IS NULL
        GROUP BY p.id
        HAVING current_stock <= p.min_stock OR current_stock IS NULL
        ORDER BY current_stock ASC
        LIMIT ?
      `;

      const [rows] = await db.execute(query, [store_id, limit]);
      return rows;
    } catch (error) {
      logError('Error getting low stock products:', error);
      throw error;
    }
  }

  /**
   * Verificar disponibilidad de stock
   */
  static async checkStock(productId, quantity, store_id = 1) {
    try {
      const query = `
        SELECT 
          p.name,
          SUM(s.quantity) as current_stock
        FROM products p
        LEFT JOIN stock s ON p.id = s.product_id AND s.store_id = ?
        WHERE p.id = ? AND p.status = 'active'
        GROUP BY p.id
      `;

      const [rows] = await db.execute(query, [store_id, productId]);
      
      if (!rows[0]) {
        return { available: false, message: 'Producto no encontrado' };
      }

      const currentStock = rows[0].current_stock || 0;
      
      return {
        available: currentStock >= quantity,
        currentStock,
        requestedQuantity: quantity,
        message: currentStock >= quantity 
          ? 'Stock disponible' 
          : `Stock insuficiente. Disponible: ${currentStock}, Requerido: ${quantity}`
      };

    } catch (error) {
      logError('Error checking stock:', error);
      throw error;
    }
  }
}

module.exports = Product;