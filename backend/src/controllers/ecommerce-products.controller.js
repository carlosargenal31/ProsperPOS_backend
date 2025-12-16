// ===================================================================
// PROSPERPOS - CONTROLADOR DE PRODUCTOS E-COMMERCE
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class EcommerceProductsController {

  /**
   * Obtener productos para catálogo
   */
  static async getCatalog(req, res) {
    try {
      const {
        page = 1,
        limit = 12,
        search = '',
        category_id = null,
        brand_id = null,
        min_price = null,
        max_price = null,
        sort = 'newest' // newest, price_asc, price_desc, name_asc
      } = req.query;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE p.status = "active" AND p.deleted_at IS NULL';
      const params = [];

      // Filtros
      if (search) {
        whereClause += ' AND (p.name LIKE ? OR p.description LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
      }

      if (category_id) {
        whereClause += ' AND p.category_id = ?';
        params.push(category_id);
      }

      if (brand_id) {
        whereClause += ' AND p.brand_id = ?';
        params.push(brand_id);
      }

      if (min_price) {
        whereClause += ' AND pp.price >= ?';
        params.push(parseFloat(min_price));
      }

      if (max_price) {
        whereClause += ' AND pp.price <= ?';
        params.push(parseFloat(max_price));
      }

      // Ordenamiento
      let orderBy = 'ORDER BY p.created_at DESC';
      switch (sort) {
        case 'price_asc':
          orderBy = 'ORDER BY pp.price ASC';
          break;
        case 'price_desc':
          orderBy = 'ORDER BY pp.price DESC';
          break;
        case 'name_asc':
          orderBy = 'ORDER BY p.name ASC';
          break;
      }

      const query = `
        SELECT
          p.id,
          p.name,
          p.code,
          p.description,
          p.image,
          p.unit,
          c.name as category_name,
          b.name as brand_name,
          pp.price as sale_price,
          t.rate as tax_rate,
          (SELECT SUM(s.quantity) FROM stock s WHERE s.product_id = p.id) as stock_available
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN product_prices pp ON p.id = pp.product_id AND pp.price_type = 'sale'
        LEFT JOIN taxes t ON p.tax_id = t.id
        ${whereClause}
        ${orderBy}
        LIMIT ? OFFSET ?
      `;

      params.push(parseInt(limit), offset);
      const [products] = await db.execute(query, params);

      // Contar total
      const countQuery = `
        SELECT COUNT(DISTINCT p.id) as total
        FROM products p
        LEFT JOIN product_prices pp ON p.id = pp.product_id AND pp.price_type = 'sale'
        ${whereClause}
      `;
      const countParams = params.slice(0, -2);
      const [countResult] = await db.execute(countQuery, countParams);

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: countResult[0].total,
            totalPages: Math.ceil(countResult[0].total / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Error in getCatalog:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener catálogo'
      });
    }
  }

  /**
   * Obtener detalles de un producto
   */
  static async getProductDetails(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT
          p.id,
          p.name,
          p.code,
          p.barcode,
          p.description,
          p.image,
          p.unit,
          c.id as category_id,
          c.name as category_name,
          b.id as brand_id,
          b.name as brand_name,
          pp.price as sale_price,
          t.rate as tax_rate,
          (SELECT SUM(s.quantity) FROM stock s WHERE s.product_id = p.id) as stock_available
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN product_prices pp ON p.id = pp.product_id AND pp.price_type = 'sale'
        LEFT JOIN taxes t ON p.tax_id = t.id
        WHERE p.id = ? AND p.status = 'active' AND p.deleted_at IS NULL
      `;

      const [products] = await db.execute(query, [id]);

      if (products.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      res.json({
        success: true,
        data: products[0]
      });

    } catch (error) {
      logger.error('Error in getProductDetails:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener detalles del producto'
      });
    }
  }

  /**
   * Obtener categorías disponibles
   */
  static async getCategories(req, res) {
    try {
      const query = `
        SELECT
          c.id,
          c.name,
          COUNT(DISTINCT p.id) as products_count
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active' AND p.deleted_at IS NULL
        WHERE c.is_active = 1 AND c.deleted_at IS NULL
        GROUP BY c.id
        HAVING products_count > 0
        ORDER BY c.name ASC
      `;

      const [categories] = await db.execute(query);

      res.json({
        success: true,
        data: categories
      });

    } catch (error) {
      logger.error('Error in getCategories:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener categorías'
      });
    }
  }

  /**
   * Obtener marcas disponibles
   */
  static async getBrands(req, res) {
    try {
      const query = `
        SELECT
          b.id,
          b.name,
          COUNT(DISTINCT p.id) as products_count
        FROM brands b
        LEFT JOIN products p ON b.id = p.brand_id AND p.status = 'active' AND p.deleted_at IS NULL
        WHERE b.deleted_at IS NULL
        GROUP BY b.id
        HAVING products_count > 0
        ORDER BY b.name ASC
      `;

      const [brands] = await db.execute(query);

      res.json({
        success: true,
        data: brands
      });

    } catch (error) {
      logger.error('Error in getBrands:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener marcas'
      });
    }
  }

  /**
   * Obtener productos destacados
   */
  static async getFeaturedProducts(req, res) {
    try {
      const limit = req.query.limit || 8;

      const query = `
        SELECT
          p.id,
          p.name,
          p.code,
          p.description,
          p.image,
          c.name as category_name,
          b.name as brand_name,
          pp.price as sale_price,
          t.rate as tax_rate,
          (SELECT SUM(s.quantity) FROM stock s WHERE s.product_id = p.id) as stock_available
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN product_prices pp ON p.id = pp.product_id AND pp.price_type = 'sale'
        LEFT JOIN taxes t ON p.tax_id = t.id
        WHERE p.status = 'active' AND p.deleted_at IS NULL
        ORDER BY RAND()
        LIMIT ?
      `;

      const [products] = await db.execute(query, [parseInt(limit)]);

      res.json({
        success: true,
        data: products
      });

    } catch (error) {
      logger.error('Error in getFeaturedProducts:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener productos destacados'
      });
    }
  }

  /**
   * Buscar productos
   */
  static async search(req, res) {
    try {
      const { q = '', limit = 10 } = req.query;

      if (!q || q.length < 2) {
        return res.json({
          success: true,
          data: []
        });
      }

      const query = `
        SELECT
          p.id,
          p.name,
          p.code,
          p.image,
          pp.price as sale_price,
          (SELECT SUM(s.quantity) FROM stock s WHERE s.product_id = p.id) as stock_available
        FROM products p
        LEFT JOIN product_prices pp ON p.id = pp.product_id AND pp.price_type = 'sale'
        WHERE p.status = 'active'
          AND p.deleted_at IS NULL
          AND (p.name LIKE ? OR p.code LIKE ? OR p.barcode LIKE ?)
        LIMIT ?
      `;

      const searchTerm = `%${q}%`;
      const [products] = await db.execute(query, [
        searchTerm, searchTerm, searchTerm, parseInt(limit)
      ]);

      res.json({
        success: true,
        data: products
      });

    } catch (error) {
      logger.error('Error in search:', error);
      res.status(500).json({
        success: false,
        message: 'Error al buscar productos'
      });
    }
  }
}

module.exports = EcommerceProductsController;
