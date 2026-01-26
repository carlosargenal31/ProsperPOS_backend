// ===================================================================
// PROSPERPOS - SERVICIO DE CÓDIGOS DE BARRA
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class BarcodeService {
  /**
   * Obtener productos para códigos de barra
   */
  static async getProductsForBarcodes(filters) {
    try {
      const params = [];
      let query = `
        SELECT
          p.id,
          p.code AS sku,
          p.name AS product_name,
          p.price_1 AS price,
          p.image,
          c.name AS category_name,
          sc.name AS subcategory_name,
          b.name AS brand_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.deleted_at IS NULL
          AND p.code IS NOT NULL
          AND p.code != ''
      `;

      if (filters.category_id) {
        query += ' AND p.category_id = ?';
        params.push(filters.category_id);
      }

      if (filters.subcategory_id) {
        query += ' AND p.subcategory_id = ?';
        params.push(filters.subcategory_id);
      }

      if (filters.product_id) {
        query += ' AND p.id = ?';
        params.push(filters.product_id);
      }

      if (filters.branch_id) {
        query += ' AND p.branch_id = ?';
        params.push(filters.branch_id);
      }

      query += ' ORDER BY p.name ASC';

      const products = await db.query(query, params);

      return products.map(p => ({
        id: p.id,
        label: p.product_name,
        value: p.product_name,
        name: p.product_name,
        sku: p.sku || '',  // p.sku viene del alias en la query (p.code AS sku)
        code: p.sku || '', // Mantener consistencia
        price: p.price || 0,
        selling_price: p.price || 0,
        category_name: p.category_name || '',
        subcategory_name: p.subcategory_name || '',
        brand_name: p.brand_name || '',
        image: p.image
      }));
    } catch (error) {
      logger.error('Error in BarcodeService.getProductsForBarcodes:', error);
      throw error;
    }
  }

  /**
   * Generar PDF con códigos de barra
   * (Esta función podría implementarse en el futuro si se requiere generación en el servidor)
   */
  static async generateBarcodePDF(options) {
    try {
      // TODO: Implementar generación de PDF con códigos de barra en el servidor
      // Por ahora, la generación se hace en el frontend con jsbarcode y jsPDF
      throw new Error('Generación de PDF no implementada en el servidor. Use el frontend.');
    } catch (error) {
      logger.error('Error in BarcodeService.generateBarcodePDF:', error);
      throw error;
    }
  }

  /**
   * Obtener categorías para el selector
   */
  static async getCategories() {
    try {
      const query = `
        SELECT
          id,
          name AS label,
          name AS value
        FROM categories
        WHERE deleted_at IS NULL
        ORDER BY name ASC
      `;

      const [categories] = await db.query(query);
      return categories;
    } catch (error) {
      logger.error('Error in BarcodeService.getCategories:', error);
      throw error;
    }
  }

  /**
   * Obtener subcategorías para el selector
   */
  static async getSubcategories(categoryId) {
    try {
      let query = `
        SELECT
          sc.id,
          sc.name AS label,
          sc.name AS value,
          sc.category_id,
          c.name AS category_name
        FROM subcategories sc
        LEFT JOIN categories c ON sc.category_id = c.id
        WHERE sc.deleted_at IS NULL
      `;

      const params = [];

      if (categoryId) {
        query += ' AND sc.category_id = ?';
        params.push(categoryId);
      }

      query += ' ORDER BY sc.name ASC';

      const [subcategories] = await db.query(query, params);
      return subcategories;
    } catch (error) {
      logger.error('Error in BarcodeService.getSubcategories:', error);
      throw error;
    }
  }
}

module.exports = BarcodeService;
