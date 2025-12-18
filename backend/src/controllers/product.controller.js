// ===================================================================
// PROSPERPOS - CONTROLADOR DE PRODUCTOS E INVENTARIO
// ===================================================================

const ProductService = require('../services/product.service');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class ProductController {
  
  // =================================================================
  // MÉTODOS DE PRODUCTOS
  // =================================================================

  /**
   * Obtener todos los productos para búsqueda (sin paginación)
   */
  static async getAllProductsForSearch(req, res) {
    try {
      const { search = '', status = 'active' } = req.query;

      const products = await ProductService.getAllProductsForSearch({ search, status });

      return sendSuccessResponse(res, products, 'Productos obtenidos exitosamente');

    } catch (error) {
      logger.error('Error getting all products for search:', error);
      return sendErrorResponse(res, 500, 'Error al obtener productos');
    }
  }

  /**
   * Obtener lista de productos con filtros y paginación
   */
  static async getProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        category_id,
        brand_id,
        supplier_id,
        status = 'active',
        min_price,
        max_price,
        sort_by = 'created_at',
        sort_order = 'DESC',
        warehouse_id,
        includeStock
      } = req.query;

      const store_id = req.user?.store_id || 1;

      const filters = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        category_id,
        brand_id,
        supplier_id,
        status,
        min_price: min_price ? parseFloat(min_price) : null,
        max_price: max_price ? parseFloat(max_price) : null,
        sort_by,
        sort_order,
        store_id,
        warehouse_id: warehouse_id ? parseInt(warehouse_id) : null,
        includeStock: includeStock === 'true' || includeStock === true
      };

      const result = await ProductService.getProducts(filters);

      return sendSuccessResponse(res, result, 'Productos obtenidos exitosamente');

    } catch (error) {
      logger.error('Error getting products:', error);
      return sendErrorResponse(res, 500, 'Error al obtener productos');
    }
  }

  /**
   * Obtener producto por ID
   */
  static async getProduct(req, res) {
    try {
      const { id } = req.params;
      const store_id = req.user?.store_id || 1;

      const product = await ProductService.getProductById(id, store_id);

      if (!product) {
        return sendErrorResponse(res, 404, 'Producto no encontrado');
      }

      return sendSuccessResponse(res, product, 'Producto obtenido exitosamente');

    } catch (error) {
      logger.error('Error getting product:', error);
      return sendErrorResponse(res, 500, 'Error al obtener producto');
    }
  }

  /**
   * Obtener producto por código de barras
   */
  static async getProductByBarcode(req, res) {
    try {
      const { barcode } = req.params;
      const store_id = req.user?.store_id || 1;

      const product = await ProductService.getProductByBarcode(barcode, store_id);

      if (!product) {
        return sendErrorResponse(res, 404, 'Producto no encontrado');
      }

      return sendSuccessResponse(res, product, 'Producto encontrado');

    } catch (error) {
      logger.error('Error getting product by barcode:', error);
      return sendErrorResponse(res, 500, 'Error al buscar producto');
    }
  }

  /**
   * Crear nuevo producto
   */
  static async createProduct(req, res) {
    try {
      const productData = {
        ...req.body,
        created_by: req.user.id,
        store_id: req.user?.store_id || 1
      };

      const product = await ProductService.createProduct(productData);

      logger.info('Product created', {
        productId: product.id,
        userId: req.user.id,
        name: product.name
      });

      return sendSuccessResponse(res, product, 'Producto creado exitosamente', 201);

    } catch (error) {
      logger.error('Error creating product:', error);
      
      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }
      
      return sendErrorResponse(res, 500, 'Error al crear producto');
    }
  }

  /**
   * Actualizar producto
   */
  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        updated_by: req.user.id,
        store_id: req.user?.store_id || 1
      };

      const product = await ProductService.updateProduct(id, updateData);

      if (!product) {
        return sendErrorResponse(res, 404, 'Producto no encontrado');
      }

      logger.info('Product updated', {
        productId: id,
        userId: req.user.id
      });

      return sendSuccessResponse(res, product, 'Producto actualizado exitosamente');

    } catch (error) {
      logger.error('Error updating product:', error);
      
      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }
      
      if (error.message.includes('no encontrado')) {
        return sendErrorResponse(res, 404, error.message);
      }
      
      return sendErrorResponse(res, 500, 'Error al actualizar producto');
    }
  }

  /**
   * Eliminar producto (soft delete)
   */
  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const deleted_by = req.user.id;

      const result = await ProductService.deleteProduct(id, deleted_by);

      if (!result.success) {
        return sendErrorResponse(res, result.statusCode || 500, result.message);
      }

      logger.info('Product deleted', {
        productId: id,
        userId: deleted_by
      });

      return sendSuccessResponse(res, null, result.message);

    } catch (error) {
      logger.error('Error deleting product:', error);
      return sendErrorResponse(res, 500, 'Error al eliminar producto');
    }
  }

  /**
   * Generar código de producto
   */
  static async generateProductCode(req, res) {
    try {
      const { category_id } = req.query;

      const code = await ProductService.generateProductCode(category_id);

      return sendSuccessResponse(res, { code }, 'Código generado exitosamente');

    } catch (error) {
      logger.error('Error generating product code:', error);
      return sendErrorResponse(res, 500, 'Error al generar código');
    }
  }

  // =================================================================
  // MÉTODOS DE INVENTARIO
  // =================================================================

  /**
   * Obtener resumen de inventario
   */
  static async getInventorySummary(req, res) {
    try {
      const store_id = req.user?.store_id || 1;

      const summary = await ProductService.getInventorySummary(store_id);

      return sendSuccessResponse(res, summary, 'Resumen obtenido exitosamente');

    } catch (error) {
      logger.error('Error getting inventory summary:', error);
      return sendErrorResponse(res, 500, 'Error al obtener resumen');
    }
  }

  /**
   * Obtener productos con stock bajo
   */
  static async getLowStockProducts(req, res) {
    try {
      const { limit = 20 } = req.query;
      const store_id = req.user?.store_id || 1;

      const products = await ProductService.getLowStockProducts(store_id, parseInt(limit));

      return sendSuccessResponse(res, products, 'Productos con stock bajo obtenidos');

    } catch (error) {
      logger.error('Error getting low stock products:', error);
      return sendErrorResponse(res, 500, 'Error al obtener productos');
    }
  }

  /**
   * Obtener stock actual
   */
  static async getStock(req, res) {
    try {
      const {
        warehouse_id,
        product_id,
        low_stock,
        page = 1,
        limit = 20
      } = req.query;

      const store_id = req.user?.store_id || 1;

      const filters = {
        warehouse_id: warehouse_id ? parseInt(warehouse_id) : null,
        product_id: product_id ? parseInt(product_id) : null,
        low_stock: low_stock === 'true',
        page: parseInt(page),
        limit: parseInt(limit),
        store_id
      };

      const result = await ProductService.getStock(filters);

      return sendSuccessResponse(res, result, 'Stock obtenido exitosamente');

    } catch (error) {
      logger.error('Error getting stock:', error);
      return sendErrorResponse(res, 500, 'Error al obtener stock');
    }
  }

  /**
   * Verificar disponibilidad de stock
   */
  static async checkStock(req, res) {
    try {
      const { product_id, quantity } = req.query;
      const store_id = req.user?.store_id || 1;

      if (!product_id || !quantity) {
        return sendErrorResponse(res, 400, 'product_id y quantity son requeridos');
      }

      const result = await ProductService.checkStock(
        parseInt(product_id),
        parseFloat(quantity),
        store_id
      );

      return sendSuccessResponse(res, result, 'Verificación completada');

    } catch (error) {
      logger.error('Error checking stock:', error);
      return sendErrorResponse(res, 500, 'Error al verificar stock');
    }
  }

  /**
   * Validar stock para múltiples productos (para ventas)
   */
  static async validateStockForSale(req, res) {
    try {
      const { items } = req.body;
      const store_id = req.user?.store_id || 1;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return sendErrorResponse(res, 400, 'Items son requeridos');
      }

      const result = await ProductService.validateStockForSale(items, store_id);

      return sendSuccessResponse(res, result, 'Validación completada');

    } catch (error) {
      logger.error('Error validating stock:', error);
      return sendErrorResponse(res, 500, 'Error al validar stock');
    }
  }

  /**
   * Ajustar stock de producto
   */
  static async adjustStock(req, res) {
    try {
      const {
        product_id,
        new_quantity,
        reason,
        warehouse_id = 1,
        notes
      } = req.body;

      const store_id = req.user?.store_id || 1;
      const adjusted_by = req.user.id;

      const result = await ProductService.adjustStock({
        product_id,
        new_quantity,
        reason,
        warehouse_id,
        store_id,
        adjusted_by,
        notes
      });

      logger.info('Stock adjusted', {
        productId: product_id,
        userId: adjusted_by,
        newQuantity: new_quantity
      });

      return sendSuccessResponse(res, result, 'Stock ajustado exitosamente');

    } catch (error) {
      logger.error('Error adjusting stock:', error);
      return sendErrorResponse(res, 500, error.message || 'Error al ajustar stock');
    }
  }

  /**
   * Transferir stock entre almacenes
   */
  static async transferStock(req, res) {
    try {
      const {
        product_id,
        from_warehouse_id,
        to_warehouse_id,
        quantity,
        notes
      } = req.body;

      const store_id = req.user?.store_id || 1;
      const transferred_by = req.user.id;

      if (from_warehouse_id === to_warehouse_id) {
        return sendErrorResponse(res, 400, 'Los almacenes deben ser diferentes');
      }

      const result = await ProductService.transferStock({
        product_id,
        from_warehouse_id,
        to_warehouse_id,
        quantity,
        store_id,
        transferred_by,
        notes
      });

      logger.info('Stock transferred', {
        productId: product_id,
        userId: transferred_by,
        quantity
      });

      return sendSuccessResponse(res, result, 'Transferencia completada exitosamente');

    } catch (error) {
      logger.error('Error transferring stock:', error);
      return sendErrorResponse(res, 500, error.message || 'Error al transferir stock');
    }
  }

  // =================================================================
  // MÉTODOS DE REPORTES
  // =================================================================

  /**
   * Reporte de movimientos de inventario
   */
  static async getMovementsReport(req, res) {
    try {
      const {
        warehouse_id,
        product_id,
        movement_type,
        date_from,
        date_to,
        page = 1,
        limit = 20
      } = req.query;

      const store_id = req.user?.store_id || 1;

      const filters = {
        warehouse_id: warehouse_id ? parseInt(warehouse_id) : null,
        product_id: product_id ? parseInt(product_id) : null,
        movement_type,
        date_from,
        date_to,
        page: parseInt(page),
        limit: parseInt(limit),
        store_id
      };

      const result = await ProductService.getMovementsReport(filters);

      return sendSuccessResponse(res, result, 'Reporte obtenido exitosamente');

    } catch (error) {
      logger.error('Error getting movements report:', error);
      return sendErrorResponse(res, 500, 'Error al obtener reporte');
    }
  }

  /**
   * Reporte de valorización de inventario
   */
  static async getValuationReport(req, res) {
    try {
      const { warehouse_id } = req.query;
      const store_id = req.user?.store_id || 1;

      const report = await ProductService.getValuationReport(
        store_id,
        warehouse_id ? parseInt(warehouse_id) : null
      );

      return sendSuccessResponse(res, report, 'Reporte de valorización obtenido');

    } catch (error) {
      logger.error('Error getting valuation report:', error);
      return sendErrorResponse(res, 500, 'Error al obtener reporte');
    }
  }

  /**
   * Reporte de productos con stock crítico
   */
  static async getCriticalStockReport(req, res) {
    try {
      const store_id = req.user?.store_id || 1;

      const report = await ProductService.getCriticalStockReport(store_id);

      return sendSuccessResponse(res, report, 'Reporte de stock crítico obtenido');

    } catch (error) {
      logger.error('Error getting critical stock report:', error);
      return sendErrorResponse(res, 500, 'Error al obtener reporte');
    }
  }
}

module.exports = ProductController;