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
        subcategory_id = null,
        brand_id = null,
        min_price = null,
        max_price = null,
        sort = 'newest' // newest, price_asc, price_desc, name_asc
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;
      let whereClause = "WHERE p.deleted_at IS NULL";
      const params = [];

      // Filtros
      if (search) {
        // Extraer palabras (texto) y dígitos por separado
        let words = search.match(/[a-záéíóúñ]+/gi) || []; // Palabras (texto)
        const digits = search.match(/\d+/g) || []; // Números

        // Filtrar palabras muy cortas (1 letra) que no sean significativas
        words = words.filter(word => word.length > 1);

        // Si hay palabras o dígitos, buscar que TODOS estén presentes
        if (words.length > 0 || digits.length > 0) {
          const allConditions = [];

          // Crear condiciones para cada palabra
          words.forEach(() => {
            allConditions.push('p.name LIKE ?');
          });

          // Crear condiciones para cada dígito
          digits.forEach(() => {
            allConditions.push('p.name LIKE ?');
          });

          // Combinar todas las condiciones con AND (todas deben estar presentes)
          const nameConditions = allConditions.join(' AND ');

          // Buscar en nombre (todas las palabras/dígitos presentes) O en código/descripción (búsqueda completa)
          whereClause += ` AND ((${nameConditions}) OR p.code LIKE ? OR p.description LIKE ?)`;

          // Agregar parámetros para palabras
          words.forEach(word => {
            params.push(`%${word}%`);
          });

          // Agregar parámetros para dígitos
          digits.forEach(digit => {
            params.push(`%${digit}%`);
          });

          // Agregar búsqueda completa en código y descripción
          const searchTerm = `%${search}%`;
          params.push(searchTerm, searchTerm);
        }
      }

      if (category_id) {
        whereClause += ' AND p.category_id = ?';
        params.push(category_id);
      }

      if (subcategory_id) {
        whereClause += ' AND p.subcategory_id = ?';
        params.push(subcategory_id);
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
          COALESCE(u.name, 'UNIDAD') as unit,
          COALESCE(c.name, '') as category_name,
          COALESCE(b.name, '') as brand_name,
          p.price_1 as sale_price,
          COALESCE(t.rate, 0) as tax_rate,
          COALESCE(SUM(s.quantity), 0) as stock_available
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN tax_rates t ON p.tax_id = t.id
        LEFT JOIN units u ON p.unit_id = u.id
        LEFT JOIN stock s ON p.id = s.product_id
        ${whereClause}
        GROUP BY p.id, p.name, p.code, p.description, p.image, u.name, c.name, b.name, p.price_1, t.rate, p.created_at
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
          p.description,
          p.image,
          COALESCE(u.name, 'UNIDAD') as unit,
          c.id as category_id,
          COALESCE(c.name, '') as category_name,
          sc.id as subcategory_id,
          COALESCE(sc.name, '') as subcategory_name,
          b.id as brand_id,
          COALESCE(b.name, '') as brand_name,
          p.price_1 as sale_price,
          COALESCE(t.rate, 0) as tax_rate,
          COALESCE(SUM(s.quantity), 0) as stock_available
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN tax_rates t ON p.tax_id = t.id
        LEFT JOIN units u ON p.unit_id = u.id
        LEFT JOIN stock s ON p.id = s.product_id
        WHERE p.id = ? AND p.deleted_at IS NULL
        GROUP BY p.id, p.name, p.code, p.description, p.image, u.name, c.id, c.name, sc.id, sc.name, b.id, b.name, p.price_1, t.rate
      `;

      const products = await db.execute(query, [id]);

      if (!products || products.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      const product = products[0];

      // Obtener imágenes adicionales de la galería
      const galleryQuery = `
        SELECT id, image_url, image_order, is_primary
        FROM product_images
        WHERE product_id = ? AND deleted_at IS NULL
        ORDER BY image_order ASC, id ASC
      `;

      const galleryImages = await db.execute(galleryQuery, [id]);
      product.gallery_images = galleryImages || [];

      res.json({
        success: true,
        data: product
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
   * Obtener subcategorías disponibles
   */
  static async getSubcategories(req, res) {
    try {
      const query = `
        SELECT
          s.id,
          s.name,
          s.category_id,
          c.name as category_name,
          COUNT(DISTINCT p.id) as products_count
        FROM subcategories s
        INNER JOIN categories c ON s.category_id = c.id
        LEFT JOIN products p ON s.id = p.subcategory_id AND p.deleted_at IS NULL AND p.is_active = 1
        WHERE s.is_active = 1 AND s.deleted_at IS NULL
          AND c.is_active = 1 AND c.deleted_at IS NULL
        GROUP BY s.id, s.name, s.category_id, c.name
        HAVING products_count > 0
        ORDER BY c.name ASC, s.name ASC
      `;

      const subcategories = await db.execute(query);

      res.json({
        success: true,
        data: subcategories
      });

    } catch (error) {
      logger.error('Error in getSubcategories:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener subcategorías'
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
          COALESCE(SUM(s.quantity), 0) as stock_available
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN tax_rates t ON p.tax_id = t.id
        LEFT JOIN units u ON p.unit_id = u.id
        LEFT JOIN stock s ON p.id = s.product_id
        WHERE p.is_active = 1
          AND p.deleted_at IS NULL
          AND p.is_featured = 1
        GROUP BY p.id, p.name, p.code, p.description, p.image, u.name, c.name, b.name, p.price_1, t.rate, p.updated_at
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
          COALESCE(SUM(s.quantity), 0) as stock_available
        FROM products p
        LEFT JOIN stock s ON p.id = s.product_id
        WHERE p.deleted_at IS NULL
          AND (p.name LIKE ? OR p.code LIKE ? OR p.barcode LIKE ?)
        GROUP BY p.id, p.name, p.code, p.image, p.price_1
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

  /**
   * Obtener sugerencias de búsqueda (categorías, subcategorías, marcas)
   */
  static async getSearchSuggestions(req, res) {
    try {
      const { q = '' } = req.query;

      if (!q || q.trim().length < 2) {
        return res.json({
          success: true,
          data: []
        });
      }

      const searchTerm = `%${q.trim()}%`;
      const suggestions = [];

      try {
        // Buscar en subcategorías (ej: lavamanos, baños)
        const subcategoriesResult = await db.execute(`
          SELECT DISTINCT
            s.id,
            s.name as label
          FROM subcategories s
          INNER JOIN products p ON s.id = p.subcategory_id
          WHERE s.name LIKE ?
            AND p.deleted_at IS NULL
          LIMIT 2
        `, [searchTerm]);

        const subcategories = subcategoriesResult[0] || [];
        subcategories.forEach(sub => {
          suggestions.push({
            id: `subcategory_${sub.id}`,
            label: sub.label
          });
        });
      } catch (e) {
        logger.error('Error fetching subcategories:', e);
      }

      try {
        // Buscar en categorías
        const categoriesResult = await db.execute(`
          SELECT DISTINCT
            c.id,
            c.name as label
          FROM categories c
          INNER JOIN products p ON c.id = p.category_id
          WHERE c.name LIKE ?
            AND p.deleted_at IS NULL
          LIMIT 2
        `, [searchTerm]);

        const categories = categoriesResult[0] || [];
        categories.forEach(cat => {
          suggestions.push({
            id: `category_${cat.id}`,
            label: cat.label
          });
        });
      } catch (e) {
        logger.error('Error fetching categories:', e);
      }

      try {
        // Buscar en marcas
        const brandsResult = await db.execute(`
          SELECT DISTINCT
            b.id,
            b.name as label
          FROM brands b
          INNER JOIN products p ON b.id = p.brand_id
          WHERE b.name LIKE ?
            AND p.deleted_at IS NULL
          LIMIT 2
        `, [searchTerm]);

        const brands = brandsResult[0] || [];
        brands.forEach(brand => {
          suggestions.push({
            id: `brand_${brand.id}`,
            label: brand.label
          });
        });
      } catch (e) {
        logger.error('Error fetching brands:', e);
      }

      res.json({
        success: true,
        data: suggestions.slice(0, 6) // Limitar a 6 sugerencias totales
      });

    } catch (error) {
      logger.error('Error in getSearchSuggestions:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener sugerencias de búsqueda'
      });
    }
  }
}

module.exports = EcommerceProductsController;

