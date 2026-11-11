// ===================================================================
// PROSPERPOS - MODELO DE CATEGORÍAS
// ===================================================================

const db = require('../utils/database');
const { logError } = require('../utils/logger');

class Category {
  
  /**
   * Obtener todas las categorías
   */
  static async getAll(filters = {}) {
    try {
      const { search = '', is_active = null, parent_id = null } = filters;
      
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

      if (parent_id !== null) {
        if (parent_id === '0' || parent_id === 0) {
          whereClause += ' AND parent_id IS NULL';
        } else {
          whereClause += ' AND parent_id = ?';
          params.push(parent_id);
        }
      }

      const query = `
        SELECT 
          c.*,
          (SELECT COUNT(*) FROM categories sub WHERE sub.parent_id = c.id AND sub.deleted_at IS NULL) as subcategories_count,
          (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.deleted_at IS NULL) as products_count
        FROM categories c
        ${whereClause}
        ORDER BY c.sort_order ASC, c.name ASC
      `;

      const [categories] = await db.execute(query, params);
      return categories;

    } catch (error) {
      logError('Error getting categories:', error);
      throw error;
    }
  }

  /**
   * Obtener categoría por ID
   */
  static async getById(id) {
    try {
      const query = `
        SELECT 
          c.*,
          parent.name as parent_name,
          (SELECT COUNT(*) FROM categories sub WHERE sub.parent_id = c.id AND sub.deleted_at IS NULL) as subcategories_count,
          (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.deleted_at IS NULL) as products_count
        FROM categories c
        LEFT JOIN categories parent ON c.parent_id = parent.id
        WHERE c.id = ? AND c.deleted_at IS NULL
      `;

      const [rows] = await db.execute(query, [id]);
      return rows[0] || null;

    } catch (error) {
      logError('Error getting category by ID:', error);
      throw error;
    }
  }

  /**
   * Crear nueva categoría
   */
  static async create(categoryData) {
    try {
      const {
        name,
        slug,
        description,
        parent_id,
        image_url,
        sort_order = 0,
        is_active = true,
        meta_title,
        meta_description,
        created_by
      } = categoryData;

      // Verificar duplicados
      const [existing] = await db.execute(
        'SELECT id FROM categories WHERE name = ? AND deleted_at IS NULL',
        [name]
      );

      if (existing.length > 0) {
        throw new Error('Ya existe una categoría con ese nombre');
      }

      // Generar slug si no existe
      const finalSlug = slug || name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Verificar que el padre existe si se proporciona
      if (parent_id) {
        const [parent] = await db.execute(
          'SELECT id FROM categories WHERE id = ? AND deleted_at IS NULL',
          [parent_id]
        );

        if (parent.length === 0) {
          throw new Error('La categoría padre no existe');
        }
      }

      // Insertar categoría
      const insertQuery = `
        INSERT INTO categories (
          name, slug, description, parent_id, image_url, sort_order,
          is_active, meta_title, meta_description, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const [result] = await db.execute(insertQuery, [
        name, finalSlug, description, parent_id, image_url, sort_order,
        is_active ? 1 : 0, meta_title, meta_description, created_by
      ]);

      return {
        id: result.insertId,
        name,
        slug: finalSlug,
        message: 'Categoría creada exitosamente'
      };

    } catch (error) {
      logError('Error creating category:', error);
      throw error;
    }
  }

  /**
   * Actualizar categoría
   */
  static async update(id, categoryData) {
    try {
      const {
        name,
        slug,
        description,
        parent_id,
        image_url,
        sort_order,
        is_active,
        meta_title,
        meta_description,
        updated_by
      } = categoryData;

      // Verificar que existe
      const [existing] = await db.execute(
        'SELECT id FROM categories WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Categoría no encontrada');
      }

      // Verificar nombre duplicado
      const [duplicate] = await db.execute(
        'SELECT id FROM categories WHERE name = ? AND id != ? AND deleted_at IS NULL',
        [name, id]
      );

      if (duplicate.length > 0) {
        throw new Error('Ya existe otra categoría con ese nombre');
      }

      // No permitir que sea su propio padre
      if (parent_id && parseInt(parent_id) === parseInt(id)) {
        throw new Error('Una categoría no puede ser su propio padre');
      }

      // Verificar que el padre existe
      if (parent_id) {
        const [parent] = await db.execute(
          'SELECT id FROM categories WHERE id = ? AND deleted_at IS NULL',
          [parent_id]
        );

        if (parent.length === 0) {
          throw new Error('La categoría padre no existe');
        }
      }

      // Actualizar
      const updateQuery = `
        UPDATE categories SET
          name = ?, slug = ?, description = ?, parent_id = ?,
          image_url = ?, sort_order = ?, is_active = ?,
          meta_title = ?, meta_description = ?,
          updated_by = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await db.execute(updateQuery, [
        name, slug, description, parent_id, image_url, sort_order,
        is_active ? 1 : 0, meta_title, meta_description, updated_by, id
      ]);

      return { 
        id, 
        name,
        message: 'Categoría actualizada exitosamente' 
      };

    } catch (error) {
      logError('Error updating category:', error);
      throw error;
    }
  }

  /**
   * Eliminar categoría (soft delete)
   */
  static async delete(id, deleted_by) {
    try {
      // Verificar que existe
      const [existing] = await db.execute(
        'SELECT id FROM categories WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Categoría no encontrada');
      }

      // Verificar productos asociados
      const [products] = await db.execute(
        'SELECT COUNT(*) as count FROM products WHERE category_id = ? AND deleted_at IS NULL',
        [id]
      );

      if (products[0].count > 0) {
        throw new Error(`No se puede eliminar. Tiene ${products[0].count} producto(s) asociado(s)`);
      }

      // Verificar subcategorías
      const [subcategories] = await db.execute(
        'SELECT COUNT(*) as count FROM categories WHERE parent_id = ? AND deleted_at IS NULL',
        [id]
      );

      if (subcategories[0].count > 0) {
        throw new Error(`No se puede eliminar. Tiene ${subcategories[0].count} subcategoría(s)`);
      }

      // Soft delete
      await db.execute(
        'UPDATE categories SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
        [deleted_by, id]
      );

      return { message: 'Categoría eliminada exitosamente' };

    } catch (error) {
      logError('Error deleting category:', error);
      throw error;
    }
  }

  /**
   * Obtener subcategorías
   */
  static async getSubcategories(parent_id) {
    try {
      const query = `
        SELECT 
          c.*,
          (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.deleted_at IS NULL) as products_count
        FROM categories c
        WHERE c.parent_id = ? AND c.deleted_at IS NULL
        ORDER BY c.sort_order ASC, c.name ASC
      `;

      const [subcategories] = await db.execute(query, [parent_id]);
      return subcategories;

    } catch (error) {
      logError('Error getting subcategories:', error);
      throw error;
    }
  }

  /**
   * Obtener categorías raíz (sin padre)
   */
  static async getRootCategories() {
    try {
      const query = `
        SELECT 
          c.*,
          (SELECT COUNT(*) FROM categories sub WHERE sub.parent_id = c.id AND sub.deleted_at IS NULL) as subcategories_count,
          (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.deleted_at IS NULL) as products_count
        FROM categories c
        WHERE c.parent_id IS NULL AND c.deleted_at IS NULL
        ORDER BY c.sort_order ASC, c.name ASC
      `;

      const [categories] = await db.execute(query);
      return categories;

    } catch (error) {
      logError('Error getting root categories:', error);
      throw error;
    }
  }

  /**
   * Buscar categoría por nombre
   */
  static async findByName(name) {
    try {
      const query = `
        SELECT * FROM categories 
        WHERE name = ? AND deleted_at IS NULL
        LIMIT 1
      `;

      const [rows] = await db.execute(query, [name]);
      return rows[0] || null;

    } catch (error) {
      logError('Error finding category by name:', error);
      throw error;
    }
  }

  /**
   * Buscar categoría por slug
   */
  static async findBySlug(slug) {
    try {
      const query = `
        SELECT * FROM categories 
        WHERE slug = ? AND deleted_at IS NULL
        LIMIT 1
      `;

      const [rows] = await db.execute(query, [slug]);
      return rows[0] || null;

    } catch (error) {
      logError('Error finding category by slug:', error);
      throw error;
    }
  }

  /**
   * Obtener categorías activas
   */
  static async getActive() {
    try {
      const query = `
        SELECT * FROM categories 
        WHERE is_active = 1 AND deleted_at IS NULL
        ORDER BY sort_order ASC, name ASC
      `;

      const [categories] = await db.execute(query);
      return categories;

    } catch (error) {
      logError('Error getting active categories:', error);
      throw error;
    }
  }

  /**
   * Reordenar categorías
   */
  static async reorder(categoryOrders) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      for (const order of categoryOrders) {
        await connection.execute(
          'UPDATE categories SET sort_order = ? WHERE id = ?',
          [order.sort_order, order.id]
        );
      }

      await connection.commit();
      return { message: 'Categorías reordenadas exitosamente' };

    } catch (error) {
      await connection.rollback();
      logError('Error reordering categories:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Category;