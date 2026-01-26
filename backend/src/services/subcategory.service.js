// ===================================================================
// PROSPERPOS - SERVICIO DE SUBCATEGORÍAS
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');
const { getInstance: getGCSInstance } = require('../utils/google-cloud-storage');

class SubcategoryService {

  /**
   * Obtener todas las subcategorías con filtros
   */
  static async getSubcategories(filters = {}) {
    try {
      const {
        search = '',
        is_active = null,
        category_id = null,
        sort_by = 'id',
        sort_order = 'ASC',
        page = 1,
        limit = 15
      } = filters;

      let whereClause = 'WHERE s.deleted_at IS NULL';
      const params = [];

      if (search) {
        whereClause += ' AND s.name LIKE ?';
        params.push(`%${search}%`);
      }

      if (is_active !== null) {
        whereClause += ' AND s.is_active = ?';
        params.push(is_active ? 1 : 0);
      }

      if (category_id) {
        whereClause += ' AND s.category_id = ?';
        params.push(category_id);
      }

      // Mapeo de campos para ordenamiento
      const sortFieldMap = {
        'id': 's.id',
        'name': 's.name',
        'category_name': 'c.name',
        'products_count': 'products_count',
        'is_active': 's.is_active'
      };

      const orderByField = sortFieldMap[sort_by] || 's.id';
      const orderByDirection = sort_order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      const query = `
        SELECT
          s.id,
          s.name,
          s.category_id,
          s.image_url,
          s.is_active,
          s.created_at,
          s.updated_at,
          c.name as category_name,
          (SELECT COUNT(*) FROM products p WHERE p.subcategory_id = s.id AND p.deleted_at IS NULL) as products_count
        FROM subcategories s
        LEFT JOIN categories c ON s.category_id = c.id
        ${whereClause}
        ORDER BY ${orderByField} ${orderByDirection}
      `;

      const subcategories = await db.execute(query, params);

      logger.info(`getSubcategories: Devolviendo ${subcategories.length} subcategorías con orden ${orderByField} ${orderByDirection}`);

      return subcategories;

    } catch (error) {
      logger.error('Error in getSubcategories:', error);
      throw error;
    }
  }

  /**
   * Obtener subcategoría por ID
   */
  static async getSubcategoryById(id) {
    try {
      const query = `
        SELECT
          s.id,
          s.name,
          s.category_id,
          s.image_url,
          s.is_active,
          s.created_at,
          s.updated_at,
          c.name as category_name,
          (SELECT COUNT(*) FROM products p WHERE p.subcategory_id = s.id AND p.deleted_at IS NULL) as products_count
        FROM subcategories s
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.id = ? AND s.deleted_at IS NULL
      `;

      const rows = await db.execute(query, [id]);
      return rows[0] || null;

    } catch (error) {
      logger.error('Error in getSubcategoryById:', error);
      throw error;
    }
  }

  /**
   * Obtener subcategorías por categoría padre
   */
  static async getSubcategoriesByParent(category_id) {
    try {
      const query = `
        SELECT
          s.id,
          s.name,
          s.image_url,
          s.is_active,
          (SELECT COUNT(*) FROM products p WHERE p.subcategory_id = s.id AND p.deleted_at IS NULL) as products_count
        FROM subcategories s
        WHERE s.category_id = ? AND s.deleted_at IS NULL
        ORDER BY s.id ASC
      `;

      const subcategories = await db.execute(query, [category_id]);
      return subcategories;

    } catch (error) {
      logger.error('Error in getSubcategoriesByParent:', error);
      throw error;
    }
  }

  /**
   * Crear nueva subcategoría
   */
  static async createSubcategory(subcategoryData) {
    try {
      const {
        name,
        category_id,
        image_url,
        is_active = true,
        created_by
      } = subcategoryData;

      // Verificar que la categoría padre existe
      const category = await db.execute(
        'SELECT id, name FROM categories WHERE id = ? AND deleted_at IS NULL',
        [category_id]
      );

      if (category.length === 0) {
        throw new Error('La categoría no existe');
      }

      // Verificar nombre duplicado en la misma categoría
      const existing = await db.execute(
        'SELECT id FROM subcategories WHERE name = ? AND category_id = ? AND deleted_at IS NULL',
        [name, category_id]
      );

      if (existing.length > 0) {
        throw new Error('Ya existe una subcategoría con ese nombre en esta categoría');
      }

      // Insertar subcategoría
      const insertQuery = `
        INSERT INTO subcategories (
          name, category_id, image_url, is_active, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())
      `;

      const result = await db.execute(insertQuery, [
        name,
        category_id,
        image_url || null,
        is_active ? 1 : 0,
        created_by
      ]);

      return {
        id: result.insertId,
        name,
        category_id,
        category_name: category[0].name
      };

    } catch (error) {
      logger.error('Error in createSubcategory:', error);
      throw error;
    }
  }

  /**
   * Actualizar subcategoría
   */
  static async updateSubcategory(id, subcategoryData) {
    try {
      const {
        name,
        category_id,
        image_url,
        is_active,
        updated_by
      } = subcategoryData;

      // Verificar que existe
      const existing = await db.execute(
        'SELECT id, category_id FROM subcategories WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Subcategoría no encontrada');
      }

      // Si se cambia la categoría, verificar que existe
      const checkCategoryId = category_id || existing[0].category_id;
      if (category_id && category_id !== existing[0].category_id) {
        const category = await db.execute(
          'SELECT id FROM categories WHERE id = ? AND deleted_at IS NULL',
          [category_id]
        );

        if (category.length === 0) {
          throw new Error('La categoría no existe');
        }
      }

      // Verificar nombre duplicado
      const duplicate = await db.execute(
        'SELECT id FROM subcategories WHERE name = ? AND category_id = ? AND id != ? AND deleted_at IS NULL',
        [name, checkCategoryId, id]
      );

      if (duplicate.length > 0) {
        throw new Error('Ya existe otra subcategoría con ese nombre en esta categoría');
      }

      // Actualizar
      const updateQuery = `
        UPDATE subcategories SET
          name = ?,
          category_id = ?,
          image_url = ?,
          is_active = ?,
          updated_by = ?,
          updated_at = NOW()
        WHERE id = ?
      `;

      await db.execute(updateQuery, [
        name,
        checkCategoryId,
        image_url || null,
        is_active ? 1 : 0,
        updated_by,
        id
      ]);

      return { id, name };

    } catch (error) {
      logger.error('Error in updateSubcategory:', error);
      throw error;
    }
  }

  /**
   * Eliminar subcategoría (soft delete)
   */
  static async deleteSubcategory(id, deleted_by) {
    try {
      // Verificar que existe
      const existing = await db.execute(
        'SELECT id FROM subcategories WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Subcategoría no encontrada');
      }

      // Verificar productos asociados
      const products = await db.execute(
        'SELECT COUNT(*) as count FROM products WHERE subcategory_id = ? AND deleted_at IS NULL',
        [id]
      );

      if (products[0].count > 0) {
        throw new Error(`No se puede eliminar. Tiene ${products[0].count} producto(s) asociado(s)`);
      }

      // Soft delete (sin deleted_by si la columna no existe)
      await db.execute(
        'UPDATE subcategories SET deleted_at = NOW() WHERE id = ?',
        [id]
      );

      return { success: true };

    } catch (error) {
      logger.error('Error in deleteSubcategory:', error);
      throw error;
    }
  }

  /**
   * Cambiar estado de subcategoría
   */
  static async toggleStatus(id, is_active, updated_by) {
    try {
      const query = `
        UPDATE subcategories
        SET is_active = ?, updated_by = ?, updated_at = NOW()
        WHERE id = ? AND deleted_at IS NULL
      `;

      const result = await db.execute(query, [is_active ? 1 : 0, updated_by, id]);

      if (result.affectedRows === 0) {
        throw new Error('Subcategoría no encontrada');
      }

      return { id, is_active };

    } catch (error) {
      logger.error('Error in toggleStatus:', error);
      throw error;
    }
  }

  /**
   * Obtener subcategorías activas
   */
  static async getActiveSubcategories() {
    try {
      const query = `
        SELECT
          s.id,
          s.name,
          s.category_id,
          s.image_url,
          s.is_active,
          c.name as category_name
        FROM subcategories s
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.is_active = 1 AND s.deleted_at IS NULL
        ORDER BY c.name ASC, s.id ASC
      `;

      const subcategories = await db.execute(query);
      return subcategories;

    } catch (error) {
      logger.error('Error in getActiveSubcategories:', error);
      throw error;
    }
  }

  /**
   * Subir imagen de subcategoría a Google Cloud Storage
   */
  static async uploadSubcategoryImage(subcategoryId, fileBuffer, fileName, contentType) {
    try {
      const gcs = getGCSInstance();

      // Extraer extensión del archivo
      const extension = fileName.split('.').pop() || 'jpg';

      // Crear nombre único para la subcategoría
      const uniqueFileName = `subcategory_${subcategoryId}.${extension}`;

      // Subir imagen a GCS en la carpeta 'categories' (subcategorías están dentro de categories)
      const result = await gcs.uploadFile(fileBuffer, uniqueFileName, 'categories', {
        contentType,
        subcategoryId
      });

      // Actualizar URL de imagen en la base de datos
      await db.execute(
        'UPDATE subcategories SET image_url = ?, updated_at = NOW() WHERE id = ?',
        [result.url, subcategoryId]
      );

      logger.info('Subcategory image uploaded successfully', { subcategoryId, url: result.url });

      return {
        success: true,
        url: result.url,
        subcategoryId
      };

    } catch (error) {
      logger.error('Error uploading subcategory image:', error);
      throw error;
    }
  }

  /**
   * Eliminar imagen de subcategoría
   */
  static async deleteSubcategoryImage(subcategoryId) {
    try {
      // Obtener la URL actual de la imagen
      const subcategory = await this.getSubcategoryById(subcategoryId);

      if (!subcategory || !subcategory.image_url) {
        return { success: true, message: 'No hay imagen para eliminar' };
      }

      const gcs = getGCSInstance();

      // Eliminar imagen de GCS
      await gcs.deleteFile(subcategory.image_url);

      // Actualizar base de datos para remover la URL
      await db.execute(
        'UPDATE subcategories SET image_url = NULL, updated_at = NOW() WHERE id = ?',
        [subcategoryId]
      );

      logger.info('Subcategory image deleted successfully', { subcategoryId });

      return { success: true };

    } catch (error) {
      logger.error('Error deleting subcategory image:', error);
      throw error;
    }
  }
}

module.exports = SubcategoryService;
