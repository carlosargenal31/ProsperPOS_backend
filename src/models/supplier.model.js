// ===================================================================
// PROSPERPOS - MODELO DE PROVEEDORES
// ===================================================================

const db = require('../utils/database');
const { logError } = require('../utils/logger');

class Supplier {
  
  /**
   * Obtener todos los proveedores
   */
  static async getAll(filters = {}) {
    try {
      const { search = '', status = null, page = 1, limit = 50 } = filters;
      
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE deleted_at IS NULL';
      const params = [];

      if (search) {
        whereClause += ' AND (company_name LIKE ? OR contact_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (status !== null) {
        whereClause += ' AND status = ?';
        params.push(status);
      }

      const query = `
        SELECT 
          s.*,
          (SELECT COUNT(*) FROM purchases p WHERE p.supplier_id = s.id AND p.deleted_at IS NULL) as purchases_count
        FROM suppliers s
        ${whereClause}
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?
      `;

      params.push(parseInt(limit), offset);
      const [suppliers] = await db.execute(query, params);
      
      // Contar total
      const countQuery = `SELECT COUNT(*) as total FROM suppliers s ${whereClause}`;
      const [countResult] = await db.execute(countQuery, params.slice(0, -2));
      
      return {
        suppliers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      };

    } catch (error) {
      logError('Error getting suppliers:', error);
      throw error;
    }
  }

  /**
   * Obtener proveedor por ID
   */
  static async getById(id) {
    try {
      const query = `
        SELECT 
          s.*,
          (SELECT COUNT(*) FROM purchases p WHERE p.supplier_id = s.id AND p.deleted_at IS NULL) as purchases_count
        FROM suppliers s
        WHERE s.id = ? AND s.deleted_at IS NULL
      `;

      const [rows] = await db.execute(query, [id]);
      return rows[0] || null;

    } catch (error) {
      logError('Error getting supplier by ID:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo proveedor
   */
  static async create(supplierData) {
    try {
      const {
        company_name,
        contact_name,
        email,
        phone,
        tax_id,
        address,
        city,
        state,
        country,
        postal_code,
        website,
        notes,
        status = 'active',
        created_by
      } = supplierData;

      // Verificar email duplicado
      if (email) {
        const [existing] = await db.execute(
          'SELECT id FROM suppliers WHERE email = ? AND deleted_at IS NULL',
          [email]
        );

        if (existing.length > 0) {
          throw new Error('Ya existe un proveedor con ese email');
        }
      }

      // Insertar proveedor
      const insertQuery = `
        INSERT INTO suppliers (
          company_name, contact_name, email, phone, tax_id,
          address, city, state, country, postal_code,
          website, notes, status, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const [result] = await db.execute(insertQuery, [
        company_name, contact_name, email, phone, tax_id,
        address, city, state, country, postal_code,
        website, notes, status, created_by
      ]);

      return {
        id: result.insertId,
        company_name,
        message: 'Proveedor creado exitosamente'
      };

    } catch (error) {
      logError('Error creating supplier:', error);
      throw error;
    }
  }

  /**
   * Actualizar proveedor
   */
  static async update(id, supplierData) {
    try {
      const {
        company_name,
        contact_name,
        email,
        phone,
        tax_id,
        address,
        city,
        state,
        country,
        postal_code,
        website,
        notes,
        status,
        updated_by
      } = supplierData;

      // Verificar que existe
      const [existing] = await db.execute(
        'SELECT id FROM suppliers WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Proveedor no encontrado');
      }

      // Verificar email duplicado
      if (email) {
        const [duplicate] = await db.execute(
          'SELECT id FROM suppliers WHERE email = ? AND id != ? AND deleted_at IS NULL',
          [email, id]
        );

        if (duplicate.length > 0) {
          throw new Error('Ya existe otro proveedor con ese email');
        }
      }

      // Actualizar
      const updateQuery = `
        UPDATE suppliers SET
          company_name = ?, contact_name = ?, email = ?, phone = ?,
          tax_id = ?, address = ?, city = ?, state = ?, country = ?,
          postal_code = ?, website = ?, notes = ?, status = ?,
          updated_by = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await db.execute(updateQuery, [
        company_name, contact_name, email, phone, tax_id,
        address, city, state, country, postal_code,
        website, notes, status, updated_by, id
      ]);

      return { 
        id, 
        company_name,
        message: 'Proveedor actualizado exitosamente' 
      };

    } catch (error) {
      logError('Error updating supplier:', error);
      throw error;
    }
  }

  /**
   * Eliminar proveedor (soft delete)
   */
  static async delete(id, deleted_by) {
    try {
      // Verificar que existe
      const [existing] = await db.execute(
        'SELECT id FROM suppliers WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Proveedor no encontrado');
      }

      // Verificar compras asociadas
      const [purchases] = await db.execute(
        'SELECT COUNT(*) as count FROM purchases WHERE supplier_id = ? AND deleted_at IS NULL',
        [id]
      );

      if (purchases[0].count > 0) {
        throw new Error(`No se puede eliminar. Tiene ${purchases[0].count} compra(s) asociada(s)`);
      }

      // Soft delete
      await db.execute(
        'UPDATE suppliers SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
        [deleted_by, id]
      );

      return { message: 'Proveedor eliminado exitosamente' };

    } catch (error) {
      logError('Error deleting supplier:', error);
      throw error;
    }
  }

  /**
   * Obtener proveedores activos
   */
  static async getActive() {
    try {
      const query = `
        SELECT id, company_name, contact_name, email, phone
        FROM suppliers 
        WHERE status = 'active' AND deleted_at IS NULL
        ORDER BY company_name ASC
      `;

      const [suppliers] = await db.execute(query);
      return suppliers;

    } catch (error) {
      logError('Error getting active suppliers:', error);
      throw error;
    }
  }
}

module.exports = Supplier;