// ===================================================================
// PROSPERPOS - MODELO DE MARCAS
// ===================================================================

const db = require('../utils/database');
const { logError } = require('../utils/logger');

class Brand {
  
  /**
   * Obtener todas las marcas
   */
  static async getAll(filters = {}) {
    try {
      const { search = '', is_active = null } = filters;
      
      let whereClause = 'WHERE deleted_at IS NULL';
      const params = [];

      if (search) {
        whereClause += ' AND (name LIKE ? OR code LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      if (is_active !== null) {
        whereClause += ' AND is_active = ?';
        params.push(is_active ? 1 : 0);
      }

      const query = `
        SELECT 
          b.*,
          (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND p.deleted_at IS NULL) as products_count
        FROM brands b
        ${whereClause}
        ORDER BY b.name ASC
      `;

      const [brands] = await db.execute(query, params);
      return brands;

    } catch (error) {
      logError('Error getting brands:', error);
      throw error;
    }
  }

  /**
   * Obtener marca por ID
   */
  static async getById(id) {
    try {
      const query = `
        SELECT 
          b.*,
          (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND p.deleted_at IS NULL) as products_count
        FROM brands b
        WHERE b.id = ? AND b.deleted_at IS NULL
      `;

      const [rows] = await db.execute(query, [id]);
      return rows[0] || null;

    } catch (error) {
      logError('Error getting brand by ID:', error);
      throw error;
    }
  }

  /**
   * Crear nueva marca
   */
  static async create(brandData) {
    try {
      const {
        name,
        code,
        slug,
        description,
        logo_url,
        website,
        is_active = true,
        created_by
      } = brandData;

      // Verificar duplicados
      const [existing] = await db.execute(
        'SELECT id FROM brands WHERE name = ? AND deleted_at IS NULL',
        [name]
      );

      if (existing.length > 0) {
        throw new Error('Ya existe una marca con ese nombre');
      }

      // Generar slug si no existe
      const finalSlug = slug || name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Insertar marca
      const insertQuery = `
        INSERT INTO brands (
          name, code, slug, description, logo_url, website,
          is_active, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const [result] = await db.execute(insertQuery, [
        name, code, finalSlug, description, logo_url, website,
        is_active ? 1 : 0, created_by
      ]);

      return {
        id: result.insertId,
        name,
        slug: finalSlug,
        message: 'Marca creada exitosamente'
      };

    } catch (error) {
      logError('Error creating brand:', error);
      throw error;
    }
  }

  /**
   * Actualizar marca
   */
  static async update(id, brandData) {
    try {
      const {
        name,
        code,
        slug,
        description,
        logo_url,
        website,
        is_active,
        updated_by
      } = brandData;

      // Verificar que existe
      const [existing] = await db.execute(
        'SELECT id FROM brands WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Marca no encontrada');
      }

      // Verificar nombre duplicado
      const [duplicate] = await db.execute(
        'SELECT id FROM brands WHERE name = ? AND id != ? AND deleted_at IS NULL',
        [name, id]
      );

      if (duplicate.length > 0) {
        throw new Error('Ya existe otra marca con ese nombre');
      }

      // Actualizar
      const updateQuery = `
        UPDATE brands SET
          name = ?, code = ?, slug = ?, description = ?,
          logo_url = ?, website = ?, is_active = ?,
          updated_by = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await db.execute(updateQuery, [
        name, code, slug, description, logo_url, website,
        is_active ? 1 : 0, updated_by, id
      ]);

      return { 
        id, 
        name,
        message: 'Marca actualizada exitosamente' 
      };

    } catch (error) {
      logError('Error updating brand:', error);
      throw error;
    }
  }

  /**
   * Eliminar marca (soft delete)
   */
  static async delete(id, deleted_by) {
    try {
      // Verificar que existe
      const [existing] = await db.execute(
        'SELECT id FROM brands WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Marca no encontrada');
      }

      // Verificar productos asociados
      const [products] = await db.execute(
        'SELECT COUNT(*) as count FROM products WHERE brand_id = ? AND deleted_at IS NULL',
        [id]
      );

      if (products[0].count > 0) {
        throw new Error(`No se puede eliminar. Tiene ${products[0].count} producto(s) asociado(s)`);
      }

      // Soft delete
      await db.execute(
        'UPDATE brands SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
        [deleted_by, id]
      );

      return { message: 'Marca eliminada exitosamente' };

    } catch (error) {
      logError('Error deleting brand:', error);
      throw error;
    }
  }

  /**
   * Buscar marca por nombre
   */
  static async findByName(name) {
    try {
      const query = `
        SELECT * FROM brands 
        WHERE name = ? AND deleted_at IS NULL
        LIMIT 1
      `;

      const [rows] = await db.execute(query, [name]);
      return rows[0] || null;

    } catch (error) {
      logError('Error finding brand by name:', error);
      throw error;
    }
  }

  /**
   * Buscar marca por slug
   */
  static async findBySlug(slug) {
    try {
      const query = `
        SELECT * FROM brands 
        WHERE slug = ? AND deleted_at IS NULL
        LIMIT 1
      `;

      const [rows] = await db.execute(query, [slug]);
      return rows[0] || null;

    } catch (error) {
      logError('Error finding brand by slug:', error);
      throw error;
    }
  }

  /**
   * Obtener marcas activas
   */
  static async getActive() {
    try {
      const query = `
        SELECT * FROM brands 
        WHERE is_active = 1 AND deleted_at IS NULL
        ORDER BY name ASC
      `;

      const [brands] = await db.execute(query);
      return brands;

    } catch (error) {
      logError('Error getting active brands:', error);
      throw error;
    }
  }
}

module.exports = Brand;