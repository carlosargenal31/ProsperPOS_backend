// ===================================================================
// PROSPERPOS - SERVICIO DE CATEGORÍAS
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class CategoryService {

  /**
   * Obtener todas las categorías con filtros
   */
  static async getCategories(filters = {}) {
    try {
      const {
        search = '',
        is_active = null
      } = filters;

      let whereClause = 'WHERE deleted_at IS NULL';
      const params = [];

      if (search) {
        whereClause += ' AND name LIKE ?';
        params.push(`%${search}%`);
      }

      if (is_active !== null) {
        whereClause += ' AND is_active = ?';
        params.push(is_active ? 1 : 0);
      }

      const query = `
        SELECT
          c.*,
          (SELECT COUNT(*) FROM subcategories s WHERE s.category_id = c.id AND s.deleted_at IS NULL) as subcategories_count,
          (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.deleted_at IS NULL) as products_count
        FROM categories c
        ${whereClause}
        ORDER BY c.id ASC
      `;

      const result = await db.execute(query, params);

      // MySQL2 devuelve directamente el array de resultados, no [rows, fields]
      const categories = result;

      logger.info(`getCategories: Devolviendo ${categories.length} categorías`);

      return categories;

    } catch (error) {
      logger.error('Error in getCategories:', error);
      throw error;
    }
  }

  /**
   * Obtener categoría por ID
   */
  static async getCategoryById(id) {
    try {
      const query = `
        SELECT
          c.*,
          (SELECT COUNT(*) FROM subcategories s WHERE s.category_id = c.id AND s.deleted_at IS NULL) as subcategories_count,
          (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.deleted_at IS NULL) as products_count
        FROM categories c
        WHERE c.id = ? AND c.deleted_at IS NULL
      `;

      const rows = await db.execute(query, [id]);
      return rows[0] || null;

    } catch (error) {
      logger.error('Error in getCategoryById:', error);
      throw error;
    }
  }

  /**
   * Crear nueva categoría
   */
  static async createCategory(categoryData) {
    try {
      const {
        name,
        image_url,
        is_active = true,
        created_by
      } = categoryData;

      // Verificar nombre duplicado
      const existing = await db.execute(
        'SELECT id FROM categories WHERE name = ? AND deleted_at IS NULL',
        [name]
      );

      if (existing.length > 0) {
        throw new Error('Ya existe una categoría con ese nombre');
      }

      // Insertar categoría (el ID se genera automáticamente con AUTO_INCREMENT)
      const insertQuery = `
        INSERT INTO categories (
          name, image_url, is_active, created_by, created_at
        ) VALUES (?, ?, ?, ?, NOW())
      `;

      const result = await db.execute(insertQuery, [
        name,
        image_url || null,
        is_active ? 1 : 0,
        created_by || 1
      ]);

      return {
        id: result.insertId,
        name
      };

    } catch (error) {
      logger.error('Error in createCategory:', error);
      throw error;
    }
  }

  /**
   * Actualizar categoría
   */
  static async updateCategory(id, categoryData) {
    try {
      const {
        name,
        image_url,
        is_active,
        updated_by
      } = categoryData;

      // Verificar que existe
      const existing = await db.execute(
        'SELECT id FROM categories WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Categoría no encontrada');
      }

      // Verificar nombre duplicado
      const duplicate = await db.execute(
        'SELECT id FROM categories WHERE name = ? AND id != ? AND deleted_at IS NULL',
        [name, id]
      );

      if (duplicate.length > 0) {
        throw new Error('Ya existe otra categoría con ese nombre');
      }

      // Actualizar
      const updateQuery = `
        UPDATE categories SET
          name = ?,
          image_url = ?,
          is_active = ?,
          updated_by = ?,
          updated_at = NOW()
        WHERE id = ?
      `;

      await db.execute(updateQuery, [
        name,
        image_url || null,
        is_active ? 1 : 0,
        updated_by,
        id
      ]);

      return { id, name };

    } catch (error) {
      logger.error('Error in updateCategory:', error);
      throw error;
    }
  }

  /**
   * Eliminar categoría (soft delete)
   */
  static async deleteCategory(id, deleted_by) {
    try {
      // Verificar que existe
      const existing = await db.execute(
        'SELECT id FROM categories WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Categoría no encontrada');
      }

      // Verificar productos asociados
      const products = await db.execute(
        'SELECT COUNT(*) as count FROM products WHERE category_id = ? AND deleted_at IS NULL',
        [id]
      );

      if (products[0].count > 0) {
        throw new Error(`No se puede eliminar. Tiene ${products[0].count} producto(s) asociado(s)`);
      }

      // Verificar subcategorías
      const subcategories = await db.execute(
        'SELECT COUNT(*) as count FROM subcategories WHERE category_id = ? AND deleted_at IS NULL',
        [id]
      );

      if (subcategories[0].count > 0) {
        throw new Error(`No se puede eliminar. Tiene ${subcategories[0].count} subcategoría(s)`);
      }

      // Soft delete (sin deleted_by porque la columna no existe)
      await db.execute(
        'UPDATE categories SET deleted_at = NOW() WHERE id = ?',
        [id]
      );

      return { success: true };

    } catch (error) {
      logger.error('Error in deleteCategory:', error);
      throw error;
    }
  }

  /**
   * Obtener subcategorías por categoría
   */
  static async getSubcategories(category_id) {
    try {
      const query = `
        SELECT
          s.*,
          (SELECT COUNT(*) FROM products p WHERE p.subcategory_id = s.id AND p.deleted_at IS NULL) as products_count
        FROM subcategories s
        WHERE s.category_id = ? AND s.deleted_at IS NULL
        ORDER BY s.id ASC
      `;

      const subcategories = await db.execute(query, [category_id]);
      return subcategories;

    } catch (error) {
      logger.error('Error in getSubcategories:', error);
      throw error;
    }
  }

  /**
   * Obtener categorías activas
   */
  static async getActiveCategories() {
    try {
      const query = `
        SELECT
          c.id,
          c.name,
          c.image_url,
          c.is_active
        FROM categories c
        WHERE c.is_active = 1 AND c.deleted_at IS NULL
        ORDER BY c.id ASC
      `;

      const categories = await db.execute(query);
      return categories;

    } catch (error) {
      logger.error('Error in getActiveCategories:', error);
      throw error;
    }
  }
}

module.exports = CategoryService;