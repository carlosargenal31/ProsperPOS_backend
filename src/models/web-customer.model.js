// ===================================================================
// PROSPERPOS - MODELO DE CLIENTES WEB (E-COMMERCE)
// ===================================================================

const db = require('../utils/database');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

class WebCustomer {

  /**
   * Crear nuevo cliente web
   */
  static async create(customerData) {
    try {
      const {
        email,
        password,
        first_name,
        last_name,
        phone,
        document_type,
        document_number
      } = customerData;

      // Verificar si el email ya existe
      const [existing] = await db.execute(
        'SELECT id FROM web_customers WHERE email = ? AND deleted_at IS NULL',
        [email]
      );

      if (existing.length > 0) {
        throw new Error('El email ya está registrado');
      }

      // Hash de la contraseña
      const password_hash = await bcrypt.hash(password, 10);

      // Insertar cliente
      const insertQuery = `
        INSERT INTO web_customers (
          email, password_hash, first_name, last_name, phone,
          document_type, document_number, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW())
      `;

      const [result] = await db.execute(insertQuery, [
        email, password_hash, first_name, last_name, phone,
        document_type, document_number
      ]);

      return {
        id: result.insertId,
        email,
        first_name,
        last_name,
        message: 'Cuenta creada exitosamente'
      };

    } catch (error) {
      logger.error('Error creating web customer:', error);
      throw error;
    }
  }

  /**
   * Autenticar cliente
   */
  static async authenticate(email, password) {
    try {
      const query = `
        SELECT
          id, email, password_hash, first_name, last_name,
          phone, status, email_verified
        FROM web_customers
        WHERE email = ? AND deleted_at IS NULL
      `;

      const [rows] = await db.execute(query, [email]);

      if (rows.length === 0) {
        throw new Error('Credenciales inválidas');
      }

      const customer = rows[0];

      if (customer.status !== 'active') {
        throw new Error('Cuenta inactiva o bloqueada');
      }

      // Verificar contraseña
      const isValid = await bcrypt.compare(password, customer.password_hash);

      if (!isValid) {
        throw new Error('Credenciales inválidas');
      }

      // Actualizar último login
      await db.execute(
        'UPDATE web_customers SET last_login = NOW() WHERE id = ?',
        [customer.id]
      );

      // Retornar datos sin el hash
      delete customer.password_hash;

      return customer;

    } catch (error) {
      logger.error('Error authenticating web customer:', error);
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
          id, email, first_name, last_name, phone,
          document_type, document_number,
          shipping_address, shipping_city, shipping_state,
          shipping_country, shipping_postal_code,
          profile_image, email_verified, status, last_login,
          created_at
        FROM web_customers
        WHERE id = ? AND deleted_at IS NULL
      `;

      const [rows] = await db.execute(query, [id]);
      return rows[0] || null;

    } catch (error) {
      logger.error('Error getting web customer by ID:', error);
      throw error;
    }
  }

  /**
   * Actualizar perfil de cliente
   */
  static async updateProfile(id, data) {
    try {
      const {
        first_name,
        last_name,
        phone,
        document_type,
        document_number,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_country,
        shipping_postal_code
      } = data;

      const updateQuery = `
        UPDATE web_customers SET
          first_name = ?, last_name = ?, phone = ?,
          document_type = ?, document_number = ?,
          shipping_address = ?, shipping_city = ?,
          shipping_state = ?, shipping_country = ?,
          shipping_postal_code = ?,
          updated_at = NOW()
        WHERE id = ? AND deleted_at IS NULL
      `;

      await db.execute(updateQuery, [
        first_name, last_name, phone,
        document_type, document_number,
        shipping_address, shipping_city,
        shipping_state, shipping_country,
        shipping_postal_code,
        id
      ]);

      return { message: 'Perfil actualizado exitosamente' };

    } catch (error) {
      logger.error('Error updating web customer profile:', error);
      throw error;
    }
  }

  /**
   * Cambiar contraseña
   */
  static async changePassword(id, currentPassword, newPassword) {
    try {
      // Obtener contraseña actual
      const [rows] = await db.execute(
        'SELECT password_hash FROM web_customers WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (rows.length === 0) {
        throw new Error('Cliente no encontrado');
      }

      // Verificar contraseña actual
      const isValid = await bcrypt.compare(currentPassword, rows[0].password_hash);

      if (!isValid) {
        throw new Error('Contraseña actual incorrecta');
      }

      // Hash de nueva contraseña
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Actualizar
      await db.execute(
        'UPDATE web_customers SET password_hash = ?, updated_at = NOW() WHERE id = ?',
        [newPasswordHash, id]
      );

      return { message: 'Contraseña actualizada exitosamente' };

    } catch (error) {
      logger.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Obtener direcciones de envío del cliente
   */
  static async getAddresses(customerId) {
    try {
      const query = `
        SELECT * FROM customer_addresses
        WHERE customer_id = ?
        ORDER BY is_default DESC, created_at DESC
      `;

      const [addresses] = await db.execute(query, [customerId]);
      return addresses;

    } catch (error) {
      logger.error('Error getting customer addresses:', error);
      throw error;
    }
  }

  /**
   * Agregar dirección de envío
   */
  static async addAddress(customerId, addressData) {
    try {
      const {
        address_label,
        recipient_name,
        recipient_phone,
        address_line1,
        address_line2,
        city,
        state,
        country,
        postal_code,
        is_default
      } = addressData;

      // Si es predeterminada, quitar el flag de otras direcciones
      if (is_default) {
        await db.execute(
          'UPDATE customer_addresses SET is_default = FALSE WHERE customer_id = ?',
          [customerId]
        );
      }

      const insertQuery = `
        INSERT INTO customer_addresses (
          customer_id, address_label, recipient_name, recipient_phone,
          address_line1, address_line2, city, state, country,
          postal_code, is_default, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const [result] = await db.execute(insertQuery, [
        customerId, address_label, recipient_name, recipient_phone,
        address_line1, address_line2, city, state, country,
        postal_code, is_default
      ]);

      return {
        id: result.insertId,
        message: 'Dirección agregada exitosamente'
      };

    } catch (error) {
      logger.error('Error adding address:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de pedidos del cliente
   */
  static async getOrders(customerId, filters = {}) {
    try {
      const { page = 1, limit = 10, status = null } = filters;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE customer_id = ?';
      const params = [customerId];

      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      }

      const query = `
        SELECT
          id, order_number, status, payment_status,
          total, customer_notes,
          created_at, updated_at
        FROM web_orders
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      params.push(parseInt(limit), offset);
      const [orders] = await db.execute(query, params);

      return orders;

    } catch (error) {
      logger.error('Error getting customer orders:', error);
      throw error;
    }
  }
}

module.exports = WebCustomer;
