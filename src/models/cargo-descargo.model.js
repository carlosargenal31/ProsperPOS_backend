const db = require('../utils/database');

class CargoDescargo {
  /**
   * Obtener todos los documentos con filtros
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT
          cd.*,
          w.nombre as warehouse_name,
          CONCAT(IFNULL(u.first_name, ''), ' ', IFNULL(u.last_name, '')) as registered_by_name,
          IFNULL(COUNT(cdd.id), 0) as total_items,
          IFNULL(SUM(cdd.quantity), 0) as total_quantity
        FROM cargo_descargo cd
        LEFT JOIN warehouses w ON cd.warehouse_id = w.id
        LEFT JOIN users u ON cd.registered_by = u.id
        LEFT JOIN cargo_descargo_details cdd ON cd.id = cdd.cargo_descargo_id
        WHERE 1=1
      `;

      const params = [];

      if (filters.document_type) {
        query += ` AND cd.document_type = ?`;
        params.push(filters.document_type);
      }

      if (filters.warehouse_id) {
        query += ` AND cd.warehouse_id = ?`;
        params.push(filters.warehouse_id);
      }

      if (filters.status) {
        query += ` AND cd.status = ?`;
        params.push(filters.status);
      }

      if (filters.date_from && filters.date_from !== '') {
        query += ` AND cd.registration_date >= ?`;
        params.push(filters.date_from);
      }

      if (filters.date_to && filters.date_to !== '') {
        query += ` AND cd.registration_date <= ?`;
        params.push(filters.date_to);
      }

      if (filters.search && filters.search !== '') {
        query += ` AND (cd.document_number LIKE ? OR cd.issuer LIKE ? OR cd.concept LIKE ?)`;
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      query += ` GROUP BY cd.id ORDER BY cd.registration_date DESC, cd.created_at DESC`;

      if (filters.limit) {
        const limit = parseInt(filters.limit) || 20;
        const offset = parseInt(filters.offset) || 0;
        query += ` LIMIT ${limit} OFFSET ${offset}`;
      }

      const documents = await db.query(query, params);
      return documents;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener documento por ID con detalles
   */
  static async getById(id) {
    try {
      // db.query YA retorna solo los rows, NO [rows, fields]
      const rows = await db.query(
        `SELECT
          cd.*,
          w.nombre as warehouse_name,
          CONCAT(IFNULL(u.first_name, ''), ' ', IFNULL(u.last_name, '')) as registered_by_name
        FROM cargo_descargo cd
        LEFT JOIN warehouses w ON cd.warehouse_id = w.id
        LEFT JOIN users u ON cd.registered_by = u.id
        WHERE cd.id = ?`,
        [id]
      );

      if (!rows || rows.length === 0) {
        return null;
      }

      const document = rows[0];

      // Obtener detalles
      const detailRows = await db.query(
        `SELECT
          cdd.*,
          p.name as product_name,
          p.code as product_code,
          p.image as product_image
        FROM cargo_descargo_details cdd
        LEFT JOIN products p ON cdd.product_id = p.id
        WHERE cdd.cargo_descargo_id = ?
        ORDER BY cdd.id`,
        [id]
      );

      document.details = detailRows || [];
      return document;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crear nuevo documento
   */
  static async create(documentData, details, userId) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Generar número de documento automático
      const documentNumber = await this.generateDocumentNumber(documentData.document_type, connection);

      // Insertar documento principal
      const [result] = await connection.query(
        `INSERT INTO cargo_descargo (
          document_number, document_type, warehouse_id,
          issuer, concept, registration_date,
          registered_by, subtotal, tax_amount, total_amount, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          documentNumber,
          documentData.document_type,
          documentData.warehouse_id,
          documentData.issuer,
          documentData.concept || '',
          documentData.registration_date,
          userId,
          documentData.subtotal || 0,
          documentData.tax_amount || 0,
          documentData.total_amount || 0,
          documentData.status || 'BORRADOR',
          documentData.notes || ''
        ]
      );

      const documentId = result.insertId;

      // Insertar detalles
      if (details && details.length > 0) {
        for (const detail of details) {
          await connection.query(
            `INSERT INTO cargo_descargo_details (
              cargo_descargo_id, product_id, product_code, product_name,
              quantity, unit_cost, total_cost, warehouse_location,
              sub_warehouse, current_stock, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              documentId,
              detail.product_id,
              detail.product_code,
              detail.product_name,
              detail.quantity,
              detail.unit_cost || 0,
              detail.total_cost || 0,
              detail.warehouse_location || '',
              detail.sub_warehouse || '',
              detail.current_stock || 0,
              detail.notes || ''
            ]
          );
        }
      }

      await connection.commit();
      return await this.getById(documentId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar documento
   */
  static async update(id, documentData, details) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Verificar que el documento existe y está en BORRADOR
      const [existing] = await connection.query(
        'SELECT status FROM cargo_descargo WHERE id = ?',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Documento no encontrado');
      }

      if (existing[0].status !== 'BORRADOR') {
        throw new Error('Solo se pueden editar documentos en estado BORRADOR');
      }

      // Actualizar documento principal
      await connection.query(
        `UPDATE cargo_descargo SET
          warehouse_id = ?,
          issuer = ?, concept = ?, registration_date = ?,
          subtotal = ?, tax_amount = ?, total_amount = ?, notes = ?
        WHERE id = ?`,
        [
          documentData.warehouse_id,
          documentData.issuer,
          documentData.concept || '',
          documentData.registration_date,
          documentData.subtotal || 0,
          documentData.tax_amount || 0,
          documentData.total_amount || 0,
          documentData.notes || '',
          id
        ]
      );

      // Eliminar detalles anteriores
      await connection.query('DELETE FROM cargo_descargo_details WHERE cargo_descargo_id = ?', [id]);

      // Insertar nuevos detalles
      if (details && details.length > 0) {
        for (const detail of details) {
          await connection.query(
            `INSERT INTO cargo_descargo_details (
              cargo_descargo_id, product_id, product_code, product_name,
              quantity, unit_cost, total_cost, warehouse_location,
              sub_warehouse, current_stock, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              detail.product_id,
              detail.product_code,
              detail.product_name,
              detail.quantity,
              detail.unit_cost || 0,
              detail.total_cost || 0,
              detail.warehouse_location || '',
              detail.sub_warehouse || '',
              detail.current_stock || 0,
              detail.notes || ''
            ]
          );
        }
      }

      await connection.commit();
      return await this.getById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Procesar documento (cambiar de BORRADOR a PROCESADO y actualizar inventario)
   */
  static async process(id) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [existing] = await connection.query(
        'SELECT status FROM cargo_descargo WHERE id = ?',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Documento no encontrado');
      }

      if (existing[0].status !== 'BORRADOR') {
        throw new Error('Solo se pueden procesar documentos en estado BORRADOR');
      }

      // Actualizar estado (el trigger se encargará del inventario)
      await connection.query(
        'UPDATE cargo_descargo SET status = ? WHERE id = ?',
        ['PROCESADO', id]
      );

      await connection.commit();
      return await this.getById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Cancelar documento
   */
  static async cancel(id) {
    try {
      const existing = await db.query(
        'SELECT status FROM cargo_descargo WHERE id = ?',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Documento no encontrado');
      }

      if (existing[0].status === 'PROCESADO') {
        throw new Error('No se pueden cancelar documentos ya procesados');
      }

      await db.query(
        'UPDATE cargo_descargo SET status = ? WHERE id = ?',
        ['CANCELADO', id]
      );

      return await this.getById(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Eliminar documento (solo BORRADOR o CANCELADO)
   */
  static async delete(id) {
    try {
      const existing = await db.query(
        'SELECT status FROM cargo_descargo WHERE id = ?',
        [id]
      );

      if (existing.length === 0) {
        throw new Error('Documento no encontrado');
      }

      if (existing[0].status === 'PROCESADO') {
        throw new Error('No se pueden eliminar documentos procesados');
      }

      await db.query('DELETE FROM cargo_descargo WHERE id = ?', [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generar número de documento automático
   */
  static async generateDocumentNumber(documentType, connection = db) {
    try {
      const prefix = documentType === 'CARGO' ? 'CG' : 'DG';
      const year = new Date().getFullYear();

      const [result] = await connection.query(
        `SELECT document_number FROM cargo_descargo
         WHERE document_type = ?
         AND YEAR(registration_date) = ?
         ORDER BY id DESC LIMIT 1`,
        [documentType, year]
      );

      let nextNumber = 1;
      if (result.length > 0) {
        const lastNumber = result[0].document_number;
        const match = lastNumber.match(/\d+$/);
        if (match) {
          nextNumber = parseInt(match[0]) + 1;
        }
      }

      return `${prefix}-${year}-${String(nextNumber).padStart(6, '0')}`;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener resumen por almacén
   */
  static async getSummaryByWarehouse(warehouseId, dateFrom, dateTo) {
    try {
      const summary = await db.query(
        `SELECT
          cd.document_type,
          COUNT(*) as total_documents,
          SUM(cd.total_amount) as total_amount,
          SUM(cdd.quantity) as total_quantity
        FROM cargo_descargo cd
        LEFT JOIN cargo_descargo_details cdd ON cd.id = cdd.cargo_descargo_id
        WHERE cd.warehouse_id = ?
          AND cd.status = 'PROCESADO'
          AND cd.registration_date BETWEEN ? AND ?
        GROUP BY cd.document_type`,
        [warehouseId, dateFrom, dateTo]
      );

      return summary;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = CargoDescargo;
