// ===================================================================
// PROSPERPOS - MODELO DE CLIENTES
// ===================================================================

const db = require('../utils/database');
const { logError } = require('../utils/logger');

class Customer {
  
  /**
   * Obtener todos los clientes
   */
  static async getAll(filters = {}) {
    try {
      const { search = '', status = null, page = 1, limit = 50 } = filters;
      
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE deleted_at IS NULL';
      const params = [];

      if (search) {
        whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ? OR document_number LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (status !== null) {
        whereClause += ' AND status = ?';
        params.push(status);
      }

      const query = `
        SELECT 
          c.*,
          (SELECT COUNT(*) FROM sales s WHERE s.customer_id = c.id AND s.deleted_at IS NULL) as sales_count,
          (SELECT COALESCE(SUM(s.total), 0) FROM sales s WHERE s.customer_id = c.id AND s.deleted_at IS NULL) as total_sales
        FROM customers c
        ${whereClause}
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `;

      params.push(parseInt(limit), offset);
      const [customers] = await db.execute(query, params);
      
      // Contar total
      const countQuery = `SELECT COUNT(*) as total FROM customers c ${whereClause}`;
      const [countResult] = await db.execute(countQuery, params.slice(0, -2));
      
      return {
        customers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      };

    } catch (error) {
      logError('Error getting customers:', error);
      throw error;
    }
  }

  /**
   * Obtener cliente por ID
   */
  static async getById(id) {
    try {
      const query = `
        SELECT 
          c.*,
          (SELECT COUNT(*) FROM sales s WHERE s.customer_id = c.id AND s.deleted_at IS NULL) as sales_count,
          (SELECT COALESCE(SUM(s.total), 0) FROM sales s WHERE s.customer_id = c.id AND s.deleted_at IS NULL) as total_sales
        FROM customers c
        WHERE c.id = ? AND c.deleted_at IS NULL
      `;

      const [rows] = await db.execute(query, [id]);
      return rows[0] || null;

    } catch (error) {
      logError('Error getting customer by ID:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo cliente
   */
  static async create(customerData) {
    try {
      const {
        first_name,
        last_name,
        email,
        phone,
        document_type,
        document_number,
        address,
        city,
        state,
        country,
        postal_code,
        status = 'active',
        created_by
      } = customerData;

      // Verificar email duplicado
      if (email) {
        const [existing] = await db.execute(
          'SELECT id FROM customers WHERE email = ? AND deleted_at IS NULL',
          [email]
        );

        if (existing.length > 0) {
          throw new Error('Ya existe un cliente con ese email');
        }
      }

      // Insertar cliente
      const insertQuery = `
        INSERT INTO customers (
          first_name, last_name, email, phone,
          document_type, document_number,
          address, city, state, country, postal_code,
          status, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const [result] = await db.execute(insertQuery, [
        first_name, last_name, email, phone,
        document_type, document_number,
        address, city, state, country, postal_code,
        status, created_by
      ]);

      return {
        id: result.insertId,
        first_name,
        last_name,
        message: 'Cliente creado exitosamente'
      };

    } catch (error) {
      logError('Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Actualizar cliente
   */
  static async update(id, customerData) {
    try {
      const {
        first_name,
        last_name,
        email,
        phone,
        document_type,
        document_number,
        address,
        city,
        state,
        country,
        postal_code,
        status,
        updated_by
      } = customerData;

      // Verificar que existe
      const [existing] = await db.execute(
        'SELECT id FROM customers WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Cliente no encontrado');
      }

      // Verificar email duplicado
      if (email) {
        const [duplicate] = await db.execute(
          'SELECT id FROM customers WHERE email = ? AND id != ? AND deleted_at IS NULL',
          [email, id]
        );

        if (duplicate.length > 0) {
          throw new Error('Ya existe otro cliente con ese email');
        }
      }

      // Actualizar
      const updateQuery = `
        UPDATE customers SET
          first_name = ?, last_name = ?, email = ?, phone = ?,
          document_type = ?, document_number = ?,
          address = ?, city = ?, state = ?, country = ?, postal_code = ?,
          status = ?, updated_by = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await db.execute(updateQuery, [
        first_name, last_name, email, phone,
        document_type, document_number,
        address, city, state, country, postal_code,
        status, updated_by, id
      ]);

      return { 
        id, 
        first_name,
        last_name,
        message: 'Cliente actualizado exitosamente' 
      };

    } catch (error) {
      logError('Error updating customer:', error);
      throw error;
    }
  }

  /**
   * Eliminar cliente (soft delete)
   */
  static async delete(id, deleted_by) {
    try {
      // Verificar que existe
      const [existing] = await db.execute(
        'SELECT id FROM customers WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Cliente no encontrado');
      }

      // Verificar ventas asociadas
      const [sales] = await db.execute(
        'SELECT COUNT(*) as count FROM sales WHERE customer_id = ? AND deleted_at IS NULL',
        [id]
      );

      if (sales[0].count > 0) {
        throw new Error(`No se puede eliminar. Tiene ${sales[0].count} venta(s) asociada(s)`);
      }

      // Soft delete
      await db.execute(
        'UPDATE customers SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
        [deleted_by, id]
      );

      return { message: 'Cliente eliminado exitosamente' };

    } catch (error) {
      logError('Error deleting customer:', error);
      throw error;
    }
  }

  /**
   * Buscar clientes para POS (búsqueda rápida)
   */
  static async searchForPOS(searchTerm, limit = 10) {
    try {
      const query = `
        SELECT 
          id, first_name, last_name, email, phone, document_number
        FROM customers 
        WHERE deleted_at IS NULL 
          AND status = 'active'
          AND (
            first_name LIKE ? OR 
            last_name LIKE ? OR 
            email LIKE ? OR 
            phone LIKE ? OR
            document_number LIKE ?
          )
        LIMIT ?
      `;

      const search = `%${searchTerm}%`;
      const [customers] = await db.execute(query, [
        search, search, search, search, search, parseInt(limit)
      ]);

      return customers;

    } catch (error) {
      logError('Error searching customers for POS:', error);
      throw error;
    }
  }

  /**
   * Obtener clientes activos
   */
  static async getActive() {
    try {
      const query = `
        SELECT id, first_name, last_name, email, phone
        FROM customers 
        WHERE status = 'active' AND deleted_at IS NULL
        ORDER BY first_name ASC, last_name ASC
      `;

      const [customers] = await db.execute(query);
      return customers;

    } catch (error) {
      logError('Error getting active customers:', error);
      throw error;
    }
  }
}

module.exports = Customer;