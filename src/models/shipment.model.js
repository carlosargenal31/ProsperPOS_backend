const db = require('../utils/database');

const ShipmentModel = {
  /**
   * Obtener todos los envíos con filtros opcionales
   */
  async getAll(filters = {}) {
    try {
      let query = `
        SELECT
          s.*,
          c.nombre as customer_full_name,
          c.telefono as customer_main_phone,
          w.nombre as warehouse_name,
          b.nombre as branch_name,
          v.placa as vehicle_plate_number,
          CONCAT(u1.first_name, ' ', u1.last_name) as created_by_name,
          CONCAT(u2.first_name, ' ', u2.last_name) as delivered_by_name
        FROM shipments s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN warehouses w ON s.origin_warehouse_id = w.id
        LEFT JOIN branches b ON s.origin_branch_id = b.id
        LEFT JOIN vehicles v ON s.vehicle_id = v.id
        LEFT JOIN users u1 ON s.created_by = u1.id
        LEFT JOIN users u2 ON s.delivered_by = u2.id
        WHERE 1=1
      `;

      const params = [];

      if (filters.status) {
        query += ` AND s.status = ?`;
        params.push(filters.status);
      }

      if (filters.customer_id) {
        query += ` AND s.customer_id = ?`;
        params.push(filters.customer_id);
      }

      if (filters.start_date) {
        query += ` AND s.emission_date >= ?`;
        params.push(filters.start_date);
      }

      if (filters.end_date) {
        query += ` AND s.emission_date <= ?`;
        params.push(filters.end_date);
      }

      if (filters.warehouse_id) {
        query += ` AND s.origin_warehouse_id = ?`;
        params.push(filters.warehouse_id);
      }

      if (filters.search) {
        query += ` AND (s.shipment_number LIKE ? OR s.customer_name LIKE ? OR s.receiver_name LIKE ?)`;
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      query += ` ORDER BY s.created_at DESC`;

      if (filters.limit) {
        const limitNum = Number(filters.limit);
        if (!isNaN(limitNum) && limitNum > 0) {
          query += ` LIMIT ${limitNum}`;

          if (filters.offset) {
            const offsetNum = Number(filters.offset);
            if (!isNaN(offsetNum) && offsetNum >= 0) {
              query += ` OFFSET ${offsetNum}`;
            }
          }
        }
      }

      const rows = await db.query(query, params);
      return rows;
    } catch (error) {
      console.error('Error in ShipmentModel.getAll:', error);
      throw error;
    }
  },

  /**
   * Obtener un envío por ID
   */
  async getById(id) {
    try {
      const query = `
        SELECT
          s.*,
          c.nombre as customer_full_name,
          c.email as customer_email,
          c.telefono as customer_main_phone,
          w.nombre as warehouse_name,
          w.ubicacion as warehouse_address,
          b.nombre as branch_name,
          b.direccion as branch_address,
          v.placa as license_plate,
          v.marca as vehicle_make,
          v.modelo as vehicle_model_name,
          CONCAT(u1.first_name, ' ', u1.last_name) as created_by_name,
          CONCAT(u2.first_name, ' ', u2.last_name) as delivered_by_name,
          inv.invoice_number as invoice_number
        FROM shipments s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN warehouses w ON s.origin_warehouse_id = w.id
        LEFT JOIN branches b ON s.origin_branch_id = b.id
        LEFT JOIN vehicles v ON s.vehicle_id = v.id
        LEFT JOIN users u1 ON s.created_by = u1.id
        LEFT JOIN users u2 ON s.delivered_by = u2.id
        LEFT JOIN invoices inv ON s.invoice_id = inv.id
        WHERE s.id = ?
      `;

      const rows = await db.query(query, [id]);

      if (rows.length === 0) {
        return null;
      }

      // Obtener los ítems del envío
      const itemsQuery = `
        SELECT
          si.*,
          p.name as product_full_name,
          p.code as product_full_code
        FROM shipment_items si
        LEFT JOIN products p ON si.product_id = p.id
        WHERE si.shipment_id = ?
      `;

      const items = await db.query(itemsQuery, [id]);

      return {
        ...rows[0],
        items
      };
    } catch (error) {
      console.error('Error in ShipmentModel.getById:', error);
      throw error;
    }
  },

  /**
   * Obtener envío por número de guía
   */
  async getByShipmentNumber(shipmentNumber) {
    try {
      const query = `SELECT * FROM shipments WHERE shipment_number = ?`;
      const rows = await db.query(query, [shipmentNumber]);
      return (rows && rows.length > 0) ? rows[0] : null;
    } catch (error) {
      console.error('Error in ShipmentModel.getByShipmentNumber:', error);
      throw error;
    }
  },

  /**
   * Crear un nuevo envío
   */
  async create(shipmentData) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Generar número de guía si no se proporciona
      if (!shipmentData.shipment_number) {
        shipmentData.shipment_number = await this.generateShipmentNumber(connection);
      }

      const insertQuery = `
        INSERT INTO shipments (
          shipment_number, invoice_id, sale_id, document_type, delivery_type, status,
          customer_id, customer_name, customer_phone, customer_document,
          receiver_name, receiver_phone, receiver_id_document,
          receiver_alt_name, receiver_alt_phone, receiver_alt_id_document,
          receiver_alt2_name, receiver_alt2_phone, receiver_alt2_id_document,
          origin_warehouse_id, origin_warehouse_name, origin_branch_id,
          origin_address, origin_city, origin_state, origin_country,
          destination_address, destination_reference, destination_city,
          destination_state, destination_country, destination_coordinates,
          driver_employee_id, assistant_employee_id, assistant_name, assistant_phone,
          driver_name, driver_phone, driver_id, driver_license,
          vehicle_id, vehicle_plate, vehicle_type, vehicle_brand, vehicle_model,
          emission_date, estimated_delivery_date, departure_time,
          notes, special_instructions, package_quantity, total_weight,
          declared_value, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        shipmentData.shipment_number,
        shipmentData.invoice_id || null,
        shipmentData.sale_id || null,
        shipmentData.document_type || 'guia_remision',
        shipmentData.delivery_type === 'recoger' ? 'recoger' : 'enviar',
        shipmentData.status || 'pendiente',
        shipmentData.customer_id || null,
        shipmentData.customer_name,
        shipmentData.customer_phone || null,
        shipmentData.customer_document || null,
        shipmentData.receiver_name,
        shipmentData.receiver_phone,
        shipmentData.receiver_id_document || null,
        shipmentData.receiver_alt_name || null,
        shipmentData.receiver_alt_phone || null,
        shipmentData.receiver_alt_id_document || null,
        shipmentData.receiver_alt2_name || null,
        shipmentData.receiver_alt2_phone || null,
        shipmentData.receiver_alt2_id_document || null,
        shipmentData.origin_warehouse_id || null,
        shipmentData.origin_warehouse_name || null,
        shipmentData.origin_branch_id || null,
        shipmentData.origin_address,
        shipmentData.origin_city || null,
        shipmentData.origin_state || null,
        shipmentData.origin_country || 'Honduras',
        shipmentData.destination_address,
        shipmentData.destination_reference || null,
        shipmentData.destination_city || null,
        shipmentData.destination_state || null,
        shipmentData.destination_country || 'Honduras',
        shipmentData.destination_coordinates || null,
        shipmentData.driver_employee_id || null,
        shipmentData.assistant_employee_id || null,
        shipmentData.assistant_name || null,
        shipmentData.assistant_phone || null,
        shipmentData.driver_name || null,
        shipmentData.driver_phone || null,
        shipmentData.driver_id || null,
        shipmentData.driver_license || null,
        shipmentData.vehicle_id || null,
        shipmentData.vehicle_plate || null,
        shipmentData.vehicle_type || null,
        shipmentData.vehicle_brand || null,
        shipmentData.vehicle_model || null,
        shipmentData.emission_date,
        shipmentData.estimated_delivery_date || null,
        shipmentData.departure_time || null,
        shipmentData.notes || null,
        shipmentData.special_instructions || null,
        shipmentData.package_quantity || 1,
        shipmentData.total_weight || null,
        shipmentData.declared_value || null,
        shipmentData.created_by || null
      ];

      const [result] = await connection.query(insertQuery, values);
      const shipmentId = result.insertId;

      // Insertar ítems si existen
      if (shipmentData.items && shipmentData.items.length > 0) {
        for (const item of shipmentData.items) {
          const itemQuery = `
            INSERT INTO shipment_items (
              shipment_id, product_id, product_name, product_code,
              quantity, unit, weight, description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;

          await connection.query(itemQuery, [
            shipmentId,
            item.product_id || null,
            item.product_name,
            item.product_code || null,
            item.quantity || 1,
            item.unit || null,
            item.weight || null,
            item.description || null
          ]);
        }
      }

      await connection.commit();
      return shipmentId;
    } catch (error) {
      await connection.rollback();
      console.error('Error in ShipmentModel.create:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Actualizar un envío
   */
  async update(id, shipmentData) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const updateFields = [];
      const values = [];

      // Construir dinámicamente los campos a actualizar
      const allowedFields = [
        'status', 'delivery_type', 'customer_id', 'customer_name', 'customer_phone',
        'customer_document', 'receiver_name', 'receiver_phone',
        'receiver_id_document', 'receiver_alt_name', 'receiver_alt_phone',
        'receiver_alt_id_document', 'receiver_alt2_name', 'receiver_alt2_phone',
        'receiver_alt2_id_document', 'origin_warehouse_id', 'origin_warehouse_name',
        'origin_branch_id', 'origin_address', 'origin_city', 'origin_state',
        'destination_address', 'destination_reference', 'destination_city',
        'destination_state', 'destination_coordinates', 'driver_employee_id',
        'assistant_employee_id', 'assistant_name', 'assistant_phone', 'driver_name',
        'driver_phone', 'driver_id', 'driver_license', 'vehicle_id',
        'vehicle_plate', 'vehicle_type', 'vehicle_brand', 'vehicle_model',
        'emission_date', 'estimated_delivery_date', 'actual_delivery_date',
        'departure_time', 'arrival_time', 'notes', 'special_instructions',
        'package_quantity', 'total_weight', 'declared_value', 'delivered_by',
        'signature_url', 'photo_url'
      ];

      for (const field of allowedFields) {
        if (shipmentData.hasOwnProperty(field)) {
          updateFields.push(`${field} = ?`);
          const value = shipmentData[field];
          values.push(value === '' || value === undefined ? null : value);
        }
      }

      if (updateFields.length > 0) {
        values.push(id);
        const updateQuery = `UPDATE shipments SET ${updateFields.join(', ')} WHERE id = ?`;
        await connection.query(updateQuery, values);
      }

      // Actualizar ítems si se proporcionan
      if (shipmentData.items) {
        // Eliminar ítems existentes
        await connection.query('DELETE FROM shipment_items WHERE shipment_id = ?', [id]);

        // Insertar nuevos ítems
        for (const item of shipmentData.items) {
          const itemQuery = `
            INSERT INTO shipment_items (
              shipment_id, product_id, product_name, product_code,
              quantity, unit, weight, description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;

          await connection.query(itemQuery, [
            id,
            item.product_id || null,
            item.product_name,
            item.product_code || null,
            item.quantity || 1,
            item.unit || null,
            item.weight || null,
            item.description || null
          ]);
        }
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      console.error('Error in ShipmentModel.update:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Eliminar un envío
   */
  async delete(id) {
    try {
      const query = `DELETE FROM shipments WHERE id = ?`;
      const result = await db.query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in ShipmentModel.delete:', error);
      throw error;
    }
  },

  /**
   * Actualizar estado del envío
   */
  async updateStatus(id, status, userId = null) {
    try {
      const updates = { status };

      if (status === 'entregado' && !userId) {
        throw new Error('User ID required for delivery status');
      }

      if (status === 'entregado') {
        updates.delivered_by = userId;
        updates.actual_delivery_date = new Date();
      }

      return await this.update(id, updates);
    } catch (error) {
      console.error('Error in ShipmentModel.updateStatus:', error);
      throw error;
    }
  },

  /**
   * Generar número de guía automático
   */
  async generateShipmentNumber(connection = null) {
    try {
      const query = `
        SELECT shipment_number
        FROM shipments
        WHERE shipment_number REGEXP '^[0-9]+$'
        ORDER BY CAST(shipment_number AS UNSIGNED) DESC
        LIMIT 1
      `;

      let rows;
      if (connection) {
        const [result] = await connection.query(query);
        rows = result;
      } else {
        rows = await db.query(query);
      }

      if (!rows || rows.length === 0 || !rows[0] || !rows[0].shipment_number) {
        return '0000000001';
      }

      const lastNumber = rows[0].shipment_number;
      const nextNumber = parseInt(lastNumber) + 1;
      return String(nextNumber).padStart(10, '0');
    } catch (error) {
      console.error('Error in ShipmentModel.generateShipmentNumber:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de envíos
   */
  async getStatistics(filters = {}) {
    try {
      let query = `
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pendiente' THEN 1 ELSE 0 END) as pendiente,
          SUM(CASE WHEN status = 'en_camino' THEN 1 ELSE 0 END) as en_camino,
          SUM(CASE WHEN status = 'entregado' THEN 1 ELSE 0 END) as entregado,
          SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END) as cancelado,
          SUM(declared_value) as total_declared_value
        FROM shipments
        WHERE 1=1
      `;

      const params = [];

      if (filters.start_date) {
        query += ` AND emission_date >= ?`;
        params.push(filters.start_date);
      }

      if (filters.end_date) {
        query += ` AND emission_date <= ?`;
        params.push(filters.end_date);
      }

      const rows = await db.query(query, params);
      return rows[0];
    } catch (error) {
      console.error('Error in ShipmentModel.getStatistics:', error);
      throw error;
    }
  }
};

module.exports = ShipmentModel;
