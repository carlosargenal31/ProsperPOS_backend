// ===================================================================
// PROSPERPOS - CONTROLADOR DE PRODUCTOS E-COMMERCE
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');
const CompanyService = require('../services/company.service');

class EcommerceProductsController {

  /**
   * Obtener ofertas activas para productos
   * Retorna un mapa de product_id => oferta
   */
  static async getActiveOffersForProducts(productIds = []) {
    try {
      if (!productIds || productIds.length === 0) {
        return {};
      }

      const now = new Date();
      const dayOfWeek = now.getDay();
      const dayMap = {
        0: 'aplica_domingo',
        1: 'aplica_lunes',
        2: 'aplica_martes',
        3: 'aplica_miercoles',
        4: 'aplica_jueves',
        5: 'aplica_viernes',
        6: 'aplica_sabado'
      };
      const dayColumn = dayMap[dayOfWeek];

      const query = `
        SELECT
          o.id,
          o.nombre,
          o.tipo_aplicacion,
          o.categoria_id,
          o.subcategoria_id,
          o.producto_id,
          o.tipo_descuento,
          o.valor_descuento,
          o.aplica_para,
          o.monto_minimo,
          o.cantidad_minima,
          oi.product_id as offer_product_id,
          oi.descuento_porcentaje,
          oi.descuento_monto
        FROM offers o
        LEFT JOIN offer_items oi ON o.id = oi.offer_id AND o.tipo_aplicacion = 'multiple'
        WHERE o.is_active = 1
          AND o.suspendida = 0
          AND o.deleted_at IS NULL
          AND o.${dayColumn} = 1
          AND (
            o.limitar_fecha = 0
            OR (o.fecha_desde <= NOW() AND o.fecha_hasta >= NOW())
          )
          AND (
            (o.tipo_aplicacion = 'producto' AND o.producto_id IN (${productIds.map(() => '?').join(',')}))
            OR (o.tipo_aplicacion = 'multiple' AND oi.product_id IN (${productIds.map(() => '?').join(',')}))
            OR o.tipo_aplicacion IN ('grupo', 'categoria')
          )
        ORDER BY
          CASE o.tipo_aplicacion
            WHEN 'producto' THEN 1
            WHEN 'multiple' THEN 2
            WHEN 'grupo' THEN 3
            WHEN 'categoria' THEN 4
          END
      `;

      const params = [...productIds, ...productIds];
      const offers = await db.execute(query, params);

      // Crear un mapa de product_id => mejor oferta
      const offerMap = {};

      // Primero obtener información de productos para ofertas de grupo
      const productsInfo = await db.execute(`
        SELECT id, category_id, subcategory_id
        FROM products
        WHERE id IN (${productIds.map(() => '?').join(',')})
      `, productIds);

      const productInfoMap = {};
      productsInfo.forEach(p => {
        productInfoMap[p.id] = { category_id: p.category_id, subcategory_id: p.subcategory_id };
      });

      offers.forEach(offer => {
        let targetProductIds = [];
        let discountValue = 0;
        let discountType = offer.tipo_descuento;

        if (offer.tipo_aplicacion === 'producto') {
          targetProductIds = [offer.producto_id];
          discountValue = offer.valor_descuento;
        } else if (offer.tipo_aplicacion === 'multiple' && offer.offer_product_id) {
          targetProductIds = [offer.offer_product_id];
          if (offer.descuento_porcentaje > 0) {
            discountType = 'porcentaje';
            discountValue = offer.descuento_porcentaje;
          } else if (offer.descuento_monto > 0) {
            discountType = 'monto';
            discountValue = offer.descuento_monto;
          }
        } else if (offer.tipo_aplicacion === 'grupo') {
          // Aplicar a productos que coincidan con la categoría o subcategoría
          discountValue = offer.valor_descuento;
          targetProductIds = productIds.filter(pid => {
            const pInfo = productInfoMap[pid];
            if (!pInfo) {
              console.log(`[OFFER DEBUG] Product ${pid} not found in productInfoMap`);
              return false;
            }

            // Si la oferta tiene subcategoría, verificar coincidencia
            if (offer.subcategoria_id) {
              const matches = pInfo.subcategory_id === offer.subcategoria_id;
              if (offer.codigo === '000002') {
                console.log(`[OFFER DEBUG] Offer 000002 - Product ${pid} subcategory ${pInfo.subcategory_id} === ${offer.subcategoria_id}? ${matches}`);
              }
              return matches;
            }
            // Si solo tiene categoría, verificar coincidencia
            if (offer.categoria_id) {
              return pInfo.category_id === offer.categoria_id;
            }
            return false;
          });
          if (offer.codigo === '000002') {
            console.log(`[OFFER DEBUG] Offer 000002 matched ${targetProductIds.length} products:`, targetProductIds);
          }
        }

        // Aplicar oferta a los productos seleccionados
        targetProductIds.forEach(targetProductId => {
          if (targetProductId && !offerMap[targetProductId]) {
            offerMap[targetProductId] = {
              offer_id: offer.id,
              offer_name: offer.nombre,
              discount_type: discountType,
              discount_value: discountValue,
              condition_type: offer.aplica_para,
              min_amount: offer.monto_minimo || 0,
              min_quantity: offer.cantidad_minima || 0
            };
          }
        });
      });

      return offerMap;

    } catch (error) {
      logger.error('Error in getActiveOffersForProducts:', error);
      return {};
    }
  }

  /**
   * Aplicar información de ofertas a productos
   */
  static applyOffersToProducts(products, offerMap) {
    return products.map(product => {
      const offer = offerMap[product.id];

      if (offer && offer.discount_value > 0) {
        let originalPrice = parseFloat(product.sale_price);
        let discountAmount = 0;

        // Calcular descuento para mostrar información
        if (offer.discount_type === 'porcentaje') {
          discountAmount = (originalPrice * offer.discount_value) / 100;
        } else {
          discountAmount = offer.discount_value;
        }

        const discountPercentage = originalPrice > 0 ? Math.round((discountAmount / originalPrice) * 100) : 0;

        // Para AMBOS tipos (cantidades_mayores y compras_mayores),
        // NO aplicar descuento en catálogo - mantener precio original
        // El descuento se aplicará en el carrito cuando se cumpla la condición
        return {
          ...product,
          has_offer: true,
          offer_id: offer.offer_id,
          offer_name: offer.offer_name,
          original_price: originalPrice,
          discount_amount: discountAmount,
          discount_percentage: discountPercentage,
          sale_price: originalPrice, // Mantener precio original en catálogo
          offer_condition_type: offer.condition_type,
          offer_min_amount: offer.min_amount,
          offer_min_quantity: offer.min_quantity,
          offer_applies_to_total: false
        };
      }

      return {
        ...product,
        has_offer: false
      };
    });
  }

  /**
   * Obtener productos para catálogo
   */
  static async getCatalog(req, res) {
    try {
      // Obtener configuración de e-commerce
      const config = await CompanyService.getEcommerceConfig();
      const allowOrderWithoutStock = config.allow_order_without_stock || 0;

      const {
        page = 1,
        limit = 12,
        search = '',
        category_id = null,
        subcategory_id = null,
        category_ids = null,
        subcategory_ids = null,
        brand_id = null,
        min_price = null,
        max_price = null,
        price_min = null,
        price_max = null,
        colors = null,
        finishes = null,
        styles = null,
        sort = 'newest' // newest, price_asc, price_desc, name_asc
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;
      let whereClause = "WHERE p.deleted_at IS NULL AND p.is_active = 1 AND p.show_in_online_store = 1";
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

      // Multiple categories
      if (category_ids) {
        const ids = category_ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
        if (ids.length > 0) {
          whereClause += ` AND p.category_id IN (${ids.map(() => '?').join(',')})`;
          params.push(...ids);
        }
      } else if (category_id) {
        whereClause += ' AND p.category_id = ?';
        params.push(category_id);
      }

      // Multiple subcategories
      if (subcategory_ids) {
        const ids = subcategory_ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
        if (ids.length > 0) {
          whereClause += ` AND p.subcategory_id IN (${ids.map(() => '?').join(',')})`;
          params.push(...ids);
        }
      } else if (subcategory_id) {
        whereClause += ' AND p.subcategory_id = ?';
        params.push(subcategory_id);
      }

      if (brand_id) {
        whereClause += ' AND p.brand_id = ?';
        params.push(brand_id);
      }

      // Price filters (support both naming conventions)
      const minPrice = price_min || min_price;
      const maxPrice = price_max || max_price;

      if (minPrice) {
        whereClause += ' AND p.price_1 >= ?';
        params.push(parseFloat(minPrice));
      }

      if (maxPrice) {
        whereClause += ' AND p.price_1 <= ?';
        params.push(parseFloat(maxPrice));
      }

      // Color filter
      if (colors) {
        const colorList = colors.split(',').map(c => c.trim()).filter(c => c);
        if (colorList.length > 0) {
          whereClause += ` AND p.color IN (${colorList.map(() => '?').join(',')})`;
          params.push(...colorList);
        }
      }

      // Finish/Acabado filter
      if (finishes) {
        const finishList = finishes.split(',').map(f => f.trim()).filter(f => f);
        if (finishList.length > 0) {
          whereClause += ` AND p.acabado IN (${finishList.map(() => '?').join(',')})`;
          params.push(...finishList);
        }
      }

      // Style/Estilo filter (JSON field)
      if (styles) {
        const styleList = styles.split(',').map(s => s.trim()).filter(s => s);
        if (styleList.length > 0) {
          const styleConditions = styleList.map(() => 'JSON_CONTAINS(p.estilo, ?)').join(' OR ');
          whereClause += ` AND (${styleConditions})`;
          styleList.forEach(style => {
            params.push(JSON.stringify(style));
          });
        }
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
          p.color,
          p.acabado,
          p.estilo,
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
        GROUP BY p.id, p.name, p.code, p.description, p.image, p.color, p.acabado, p.estilo, u.name, c.name, b.name, p.price_1, t.rate, p.created_at
        ${orderBy}
        LIMIT ? OFFSET ?
      `;

      const finalParams = [...params, limitNum, offset];
      let products = await db.execute(query, finalParams);

      // Obtener ofertas activas para estos productos
      const productIds = products.map(p => p.id);
      const offerMap = await EcommerceProductsController.getActiveOffersForProducts(productIds);

      // Aplicar ofertas a productos
      products = EcommerceProductsController.applyOffersToProducts(products, offerMap);

      // Si allow_order_without_stock está activado, marcar todos los productos como disponibles
      if (allowOrderWithoutStock === 1) {
        products.forEach(product => {
          product.allow_order_without_stock = true;
          product.in_stock = true; // Siempre disponible
        });
      } else {
        products.forEach(product => {
          product.allow_order_without_stock = false;
          product.in_stock = product.stock_available > 0;
        });
      }

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
          },
          config: {
            allow_order_without_stock: allowOrderWithoutStock === 1
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
      // Obtener configuración de e-commerce
      const config = await CompanyService.getEcommerceConfig();
      const allowOrderWithoutStock = config.allow_order_without_stock || 0;

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
        WHERE p.id = ? AND p.deleted_at IS NULL AND p.is_active = 1 AND p.show_in_online_store = 1
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

      // Obtener ofertas activas para este producto
      const offerMap = await EcommerceProductsController.getActiveOffersForProducts([product.id]);
      const [productWithOffer] = EcommerceProductsController.applyOffersToProducts([product], offerMap);
      Object.assign(product, productWithOffer);

      // Configurar disponibilidad según configuración de e-commerce
      if (allowOrderWithoutStock === 1) {
        product.allow_order_without_stock = true;
        product.in_stock = true; // Siempre disponible
      } else {
        product.allow_order_without_stock = false;
        product.in_stock = product.stock_available > 0;
      }

      res.json({
        success: true,
        data: product,
        config: {
          allow_order_without_stock: allowOrderWithoutStock === 1
        }
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
      // Obtener configuración de e-commerce
      const config = await CompanyService.getEcommerceConfig();
      const allowOrderWithoutStock = config.allow_order_without_stock || 0;

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
          AND p.show_in_online_store = 1
        GROUP BY p.id, p.name, p.code, p.description, p.image, u.name, c.name, b.name, p.price_1, t.rate, p.updated_at
        ORDER BY p.updated_at DESC
        LIMIT ?
      `;

      let products = await db.execute(query, [parseInt(limit)]);

      // Obtener ofertas activas para estos productos
      const productIds = products.map(p => p.id);
      const offerMap = await EcommerceProductsController.getActiveOffersForProducts(productIds);

      // Aplicar ofertas a productos
      products = EcommerceProductsController.applyOffersToProducts(products, offerMap);

      // Configurar disponibilidad según configuración de e-commerce
      if (allowOrderWithoutStock === 1) {
        products.forEach(product => {
          product.allow_order_without_stock = true;
          product.in_stock = true;
        });
      } else {
        products.forEach(product => {
          product.allow_order_without_stock = false;
          product.in_stock = product.stock_available > 0;
        });
      }

      res.json({
        success: true,
        data: products,
        config: {
          allow_order_without_stock: allowOrderWithoutStock === 1
        }
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
          AND p.is_active = 1
          AND p.show_in_online_store = 1
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
            AND p.is_active = 1
            AND p.show_in_online_store = 1
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
            AND p.is_active = 1
            AND p.show_in_online_store = 1
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
            AND p.is_active = 1
            AND p.show_in_online_store = 1
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

  /**
   * Obtener productos relacionados
   * Basado en categoría, subcategoría, marca, color, acabado, estilo
   */
  static async getRelatedProducts(req, res) {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit) || 8;

      // Obtener configuración de e-commerce
      const config = await CompanyService.getEcommerceConfig();
      const allowOrderWithoutStock = config.allow_order_without_stock || 0;

      // Primero obtener el producto actual
      const productQuery = `
        SELECT
          p.id,
          p.category_id,
          p.subcategory_id,
          p.brand_id,
          p.color,
          p.acabado,
          p.estilo,
          p.name
        FROM products p
        WHERE p.id = ? AND p.deleted_at IS NULL
      `;

      const currentProducts = await db.execute(productQuery, [id]);

      if (!currentProducts || currentProducts.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      const currentProduct = currentProducts[0];

      // Construir query de productos relacionados con sistema de puntaje
      // Prioridad: subcategoría (5 puntos) > categoría (4 puntos) > marca (3 puntos) > color (2 puntos) > acabado (1 punto) > estilo (1 punto)
      let scoreConditions = [];
      let params = [];

      scoreConditions.push('(CASE WHEN p.subcategory_id = ? AND p.subcategory_id IS NOT NULL THEN 5 ELSE 0 END)');
      params.push(currentProduct.subcategory_id);

      scoreConditions.push('(CASE WHEN p.category_id = ? AND p.category_id IS NOT NULL THEN 4 ELSE 0 END)');
      params.push(currentProduct.category_id);

      scoreConditions.push('(CASE WHEN p.brand_id = ? AND p.brand_id IS NOT NULL THEN 3 ELSE 0 END)');
      params.push(currentProduct.brand_id);

      scoreConditions.push('(CASE WHEN p.color = ? AND p.color IS NOT NULL AND p.color != \'\' THEN 2 ELSE 0 END)');
      params.push(currentProduct.color);

      scoreConditions.push('(CASE WHEN p.acabado = ? AND p.acabado IS NOT NULL AND p.acabado != \'\' THEN 1 ELSE 0 END)');
      params.push(currentProduct.acabado);

      // Para estilo, como es JSON, verificar si hay coincidencia
      if (currentProduct.estilo) {
        scoreConditions.push('(CASE WHEN p.estilo = ? THEN 1 ELSE 0 END)');
        params.push(currentProduct.estilo);
      } else {
        scoreConditions.push('0');
      }

      const scoreFormula = scoreConditions.join(' + ');

      const query = `
        SELECT
          p.id,
          p.name,
          p.code,
          p.description,
          p.image,
          p.color,
          p.acabado,
          p.estilo,
          COALESCE(u.name, 'UNIDAD') as unit,
          COALESCE(c.name, '') as category_name,
          COALESCE(b.name, '') as brand_name,
          p.price_1 as sale_price,
          COALESCE(t.rate, 0) as tax_rate,
          COALESCE(SUM(s.quantity), 0) as stock_available,
          (${scoreFormula}) as similarity_score
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN tax_rates t ON p.tax_id = t.id
        LEFT JOIN units u ON p.unit_id = u.id
        LEFT JOIN stock s ON p.id = s.product_id
        WHERE p.id != ?
          AND p.deleted_at IS NULL
          AND p.is_active = 1
          AND p.show_in_online_store = 1
        GROUP BY p.id, p.name, p.code, p.description, p.image, p.color, p.acabado, p.estilo, u.name, c.name, b.name, p.price_1, t.rate
        HAVING similarity_score > 0
        ORDER BY similarity_score DESC, RAND()
        LIMIT ?
      `;

      params.push(id);
      params.push(limit);

      let products = await db.execute(query, params);

      // Obtener ofertas activas para estos productos
      const productIds = products.map(p => p.id);
      const offerMap = await EcommerceProductsController.getActiveOffersForProducts(productIds);

      // Aplicar ofertas a productos
      products = EcommerceProductsController.applyOffersToProducts(products, offerMap);

      // Configurar disponibilidad según configuración de e-commerce
      if (allowOrderWithoutStock === 1) {
        products.forEach(product => {
          product.allow_order_without_stock = true;
          product.in_stock = true;
        });
      } else {
        products.forEach(product => {
          product.allow_order_without_stock = false;
          product.in_stock = product.stock_available > 0;
        });
      }

      res.json({
        success: true,
        data: products,
        config: {
          allow_order_without_stock: allowOrderWithoutStock === 1
        }
      });

    } catch (error) {
      logger.error('Error in getRelatedProducts:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener productos relacionados'
      });
    }
  }
}

module.exports = EcommerceProductsController;

