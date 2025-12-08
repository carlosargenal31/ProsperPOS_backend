// ===================================================================
// PROSPERPOS - SERVICIO DE MARCAS
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class BrandService {

  /**
   * Obtener todas las marcas con filtros
   */
  static async getBrands(filters = {}) {
    try {
      const {
        search = '',
        is_active = null
      } = filters;

      let whereClause = 'WHERE b.deleted_at IS NULL';
      const params = [];

      if (search) {
        whereClause += ' AND b.name LIKE ?';
        params.push(`%${search}%`);
      }

      if (is_active !== null) {
        whereClause += ' AND b.is_active = ?';
        params.push(is_active ? 1 : 0);
      }

      // Intentar con products_count, si falla intentar sin la columna brand_id
      let query = `
        SELECT
          b.*,
          COALESCE((SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND p.deleted_at IS NULL), 0) as products_count
        FROM brands b
        ${whereClause}
        ORDER BY b.id ASC
      `;

      try {
        const brands = await db.execute(query, params);
        return brands;
      } catch (err) {
        // Si falla por la columna brand_id, ejecutar sin products_count
        if (err.code === 'ER_BAD_FIELD_ERROR') {
          query = `
            SELECT
              b.*,
              0 as products_count
            FROM brands b
            ${whereClause}
            ORDER BY b.id ASC
          `;
          const brands = await db.execute(query, params);
          return brands;
        }
        throw err;
      }

    } catch (error) {
      logger.error('Error in getBrands:', error);
      throw error;
    }
  }

  /**
   * Obtener marca por ID
   */
  static async getBrandById(id) {
    try {
      let query = `
        SELECT
          b.*,
          COALESCE((SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND p.deleted_at IS NULL), 0) as products_count
        FROM brands b
        WHERE b.id = ? AND b.deleted_at IS NULL
      `;

      try {
        const rows = await db.execute(query, [id]);
        return rows[0] || null;
      } catch (err) {
        // Si falla por la columna brand_id, ejecutar sin products_count
        if (err.code === 'ER_BAD_FIELD_ERROR') {
          query = `
            SELECT
              b.*,
              0 as products_count
            FROM brands b
            WHERE b.id = ? AND b.deleted_at IS NULL
          `;
          const rows = await db.execute(query, [id]);
          return rows[0] || null;
        }
        throw err;
      }

    } catch (error) {
      logger.error('Error in getBrandById:', error);
      throw error;
    }
  }

  /**
   * Crear nueva marca
   */
  static async createBrand(brandData) {
    try {
      const {
        name,
        logo_url,
        is_active = true,
        created_by
      } = brandData;

      // Verificar nombre duplicado (solo si el nombre está presente)
      if (name && name.trim()) {
        const existing = await db.execute(
          'SELECT id FROM brands WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND deleted_at IS NULL',
          [name.trim()]
        );

        if (existing.length > 0) {
          throw new Error('Ya existe una marca con ese nombre');
        }
      }

      // Insertar marca
      const insertQuery = `
        INSERT INTO brands (
          name, logo_url,
          is_active, created_by, created_at
        ) VALUES (?, ?, ?, ?, NOW())
      `;

      const result = await db.execute(insertQuery, [
        name,
        logo_url || null,
        is_active ? 1 : 0,
        created_by || 1
      ]);

      return {
        id: result.insertId,
        name
      };

    } catch (error) {
      logger.error('Error in createBrand:', error);
      throw error;
    }
  }

  /**
   * Actualizar marca
   */
  static async updateBrand(id, brandData) {
    try {
      const {
        name,
        logo_url,
        is_active,
        updated_by
      } = brandData;

      // Verificar que existe
      const existing = await db.execute(
        'SELECT id FROM brands WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Marca no encontrada');
      }

      // Verificar nombre duplicado
      const duplicate = await db.execute(
        'SELECT id FROM brands WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND id != ? AND deleted_at IS NULL',
        [name, id]
      );

      if (duplicate.length > 0) {
        throw new Error('Ya existe otra marca con ese nombre');
      }

      // Actualizar
      const updateQuery = `
        UPDATE brands SET
          name = ?, logo_url = ?, is_active = ?,
          updated_by = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await db.execute(updateQuery, [
        name,
        logo_url || null,
        is_active ? 1 : 0,
        updated_by || 1,
        id
      ]);

      return { id, name };

    } catch (error) {
      logger.error('Error in updateBrand:', error);
      throw error;
    }
  }

  /**
   * Eliminar marca (soft delete)
   */
  static async deleteBrand(id, deleted_by) {
    try {
      // Verificar que existe
      const existing = await db.execute(
        'SELECT id FROM brands WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Marca no encontrada');
      }

      // Verificar productos asociados (ignorar si no existe la columna)
      try {
        const products = await db.execute(
          'SELECT COUNT(*) as count FROM products WHERE brand_id = ? AND deleted_at IS NULL',
          [id]
        );

        if (products[0].count > 0) {
          throw new Error(`No se puede eliminar. Tiene ${products[0].count} producto(s) asociado(s)`);
        }
      } catch (err) {
        // Si la columna brand_id no existe, continuar con la eliminación
        if (err.code !== 'ER_BAD_FIELD_ERROR') {
          throw err;
        }
      }

      // Soft delete (sin deleted_by porque la columna no existe)
      await db.execute(
        'UPDATE brands SET deleted_at = NOW() WHERE id = ?',
        [id]
      );

      return { success: true };

    } catch (error) {
      logger.error('Error in deleteBrand:', error);
      throw error;
    }
  }

  /**
   * Obtener marcas activas
   */
  static async getActiveBrands() {
    try {
      const query = `
        SELECT
          b.id,
          b.name,
          b.code,
          b.slug,
          b.description,
          b.logo_url,
          b.website,
          b.is_active
        FROM brands b
        WHERE b.is_active = 1 AND b.deleted_at IS NULL
        ORDER BY b.name ASC
      `;

      const brands = await db.execute(query);
      return brands;

    } catch (error) {
      logger.error('Error in getActiveBrands:', error);
      throw error;
    }
  }
}

module.exports = BrandService;