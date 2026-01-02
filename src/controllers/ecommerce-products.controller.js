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

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;
      let whereClause = "WHERE p.status = 'active' AND p.deleted_at IS NULL";
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
        whereClause += ' AND p.price_1 >= ?';
        params.push(parseFloat(min_price));
      }

      if (max_price) {
        whereClause += ' AND p.price_1 <= ?';
        params.push(parseFloat(max_price));
      }

      // Ordenamiento
      let orderBy = 'ORDER BY p.created_at DESC';
      switch (sort) {
        case 'price_asc':
          orderBy = 'ORDER BY p.price_1 ASC';
          break;
        case 'price_desc':
          orderBy = 'ORDER BY p.price_1 DESC';
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
          COALESCE(c.name, '') as category_name,
          COALESCE(b.name, '') as brand_name,
          p.price_1 as sale_price,
          COALESCE(t.rate, 0) as tax_rate,
          0 as stock_available
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN tax_rates t ON p.tax_id = t.id
        ${whereClause}
        ${orderBy}
        LIMIT ? OFFSET ?
      `;

      const finalParams = [...params, limitNum, offset];
      const products = await db.execute(query, finalParams);

      // Contar total
      const countQuery = `
        SELECT COUNT(DISTINCT p.id) as total
        FROM products p
        ${whereClause}
      `;
      const countParams = [...params];
      const countResult = await db.execute(countQuery, countParams);

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: countResult[0].total,
            totalPages: Math.ceil(countResult[0].total / limitNum)
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
          COALESCE(c.name, '') as category_name,
          b.id as brand_id,
          COALESCE(b.name, '') as brand_name,
          p.price_1 as sale_price,
          COALESCE(t.rate, 0) as tax_rate,
          0 as stock_available
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN tax_rates t ON p.tax_id = t.id
        WHERE p.id = ? AND p.status = 'active' AND p.deleted_at IS NULL
      `;

      const products = await db.execute(query, [id]);

      if (!products || products.length === 0) {
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
      const { visible_only = 'false' } = req.query;

      let whereClause = 'WHERE c.is_active = 1 AND c.deleted_at IS NULL';

      // Si se solicita solo categorías visibles en e-commerce
      if (visible_only === 'true') {
        whereClause += ' AND c.show_in_ecommerce = 1';
      }

      const query = `
        SELECT
          c.id,
          c.name,
          c.image_url,
          COUNT(DISTINCT p.id) as products_count
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id AND p.deleted_at IS NULL AND p.is_active = 1
        ${whereClause}
        GROUP BY c.id
        HAVING products_count > 0
        ORDER BY c.name ASC
      `;

      const categories = await db.execute(query);

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

      const brands = await db.execute(query);

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
      const limit = req.query.limit || 10;

      const query = `
        SELECT
          p.id,
          p.name,
          p.code,
          p.description,
          p.image,
          COALESCE(u.name, 'UND') as unit,
          COALESCE(c.name, '') as category_name,
          COALESCE(b.name, '') as brand_name,
          p.price_1 as sale_price,
          COALESCE(t.rate, 0) as tax_rate,
          0 as stock_available
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN tax_rates t ON p.tax_id = t.id
        LEFT JOIN units u ON p.unit_id = u.id
        WHERE p.is_active = 1
          AND p.deleted_at IS NULL
          AND p.is_featured = 1
        ORDER BY p.updated_at DESC
        LIMIT ?
      `;

      const products = await db.execute(query, [parseInt(limit)]);

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
          p.price_1 as sale_price,
          0 as stock_available
        FROM products p
        WHERE p.status = 'active'
          AND p.deleted_at IS NULL
          AND (p.name LIKE ? OR p.code LIKE ? OR p.barcode LIKE ?)
        LIMIT ?
      `;

      const searchTerm = `%${q}%`;
      const products = await db.execute(query, [
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

  /**
   * Marcar/desmarcar producto como destacado
   */
  static async toggleFeatured(req, res) {
    try {
      const { id } = req.params;
      const { is_featured } = req.body;

      // Validar que el producto existe
      const checkQuery = `
        SELECT id, name, is_featured
        FROM products
        WHERE id = ? AND deleted_at IS NULL
      `;

      const products = await db.execute(checkQuery, [id]);

      if (!products || products.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      // Actualizar estado de destacado
      const updateQuery = `
        UPDATE products
        SET is_featured = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await db.execute(updateQuery, [is_featured ? 1 : 0, id]);

      res.json({
        success: true,
        message: `Producto ${is_featured ? 'marcado' : 'desmarcado'} como destacado`,
        data: {
          id: parseInt(id),
          is_featured: is_featured ? 1 : 0
        }
      });

    } catch (error) {
      logger.error('Error in toggleFeatured:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar producto destacado'
      });
    }
  }
}

module.exports = EcommerceProductsController;

