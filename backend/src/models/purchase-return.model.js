// ===================================================================
// PROSPERPOS - MODELO DE DEVOLUCIONES DE COMPRAS
// ===================================================================

const db = require('../utils/database');

class PurchaseReturnModel {
  /**
   * Crear una nueva devolución de compra
   */
  static async create(data) {
    const sql = `
      INSERT INTO purchase_returns (
        purchase_id,
        purchase_number,
        supplier_id,
        supplier_name,
        supplier_rtn,
        return_type,
        correlative,
        emission_date,
        notes,
        credit_note_received,
        subtotal,
        discount,
        tax,
        total,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db.query(sql, [
      data.purchase_id,
      data.purchase_number,
      data.supplier_id,
      data.supplier_name,
      data.supplier_rtn || null,
      data.return_type || 'partial',
      data.correlative,
      data.emission_date,
      data.notes || null,
      data.credit_note_received || false,
      data.subtotal,
      data.discount,
      data.tax,
      data.total,
      data.created_by
    ]);

    return result.insertId;
  }

  /**
   * Registrar la Nota de Crédito del proveedor
   */
  static async registerCreditNote(purchaseReturnId, creditNoteData, userId) {
    const sql = `
      UPDATE purchase_returns
      SET
        credit_note_received = TRUE,
        credit_note_number = ?,
        credit_note_date = ?,
        credit_note_cai = ?,
        credit_note_authorization = ?,
        credit_note_notes = ?,
        original_purchase_invoice = ?,
        updated_by = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    await db.query(sql, [
      creditNoteData.credit_note_number,
      creditNoteData.credit_note_date,
      creditNoteData.credit_note_cai || null,
      creditNoteData.credit_note_authorization || null,
      creditNoteData.credit_note_notes || null,
      creditNoteData.original_purchase_invoice || null,
      userId,
      purchaseReturnId
    ]);

    return true;
  }

  /**
   * Obtener todas las devoluciones
   */
  static async findAll(filters = {}) {
    let sql = `
      SELECT
        pr.*,
        p.purchase_number as purchase_document_number,
        p.invoice_number,
        p.status as purchase_status,
        p.document_type,
        s.nombre as supplier_name,
        s.doc_identificacion as supplier_rtn,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM purchase_returns pr
      LEFT JOIN purchases_documents p ON pr.purchase_id = p.id
      LEFT JOIN suppliers s ON pr.supplier_id = s.id
      LEFT JOIN users u ON pr.created_by = u.id
      WHERE pr.deleted_at IS NULL
    `;

    const params = [];

    // Filtros opcionales
    if (filters.supplier_id) {
      sql += ' AND pr.supplier_id = ?';
      params.push(filters.supplier_id);
    }

    if (filters.return_type) {
      sql += ' AND pr.return_type = ?';
      params.push(filters.return_type);
    }

    if (filters.credit_note_received !== undefined) {
      sql += ' AND pr.credit_note_received = ?';
      params.push(filters.credit_note_received);
    }

    if (filters.date_from) {
      sql += ' AND pr.emission_date >= ?';
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      sql += ' AND pr.emission_date <= ?';
      params.push(filters.date_to);
    }

    if (filters.search) {
      sql += ` AND (
        pr.correlative LIKE ? OR
        pr.purchase_number LIKE ? OR
        pr.credit_note_number LIKE ? OR
        s.nombre LIKE ?
      )`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY pr.created_at DESC';

    // Paginación - usar valores directos en lugar de placeholders
    if (filters.limit) {
      const limit = parseInt(filters.limit) || 50;
      const offset = filters.page ? (parseInt(filters.page) - 1) * limit : 0;
      sql += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    return await db.query(sql, params);
  }

  /**
   * Obtener una devolución por ID
   */
  static async findById(id) {
    const sql = `
      SELECT
        pr.*,
        p.purchase_number as purchase_document_number,
        p.invoice_number,
        p.status as purchase_status,
        p.document_type,
        p.purchase_date,
        s.nombre as supplier_name,
        s.doc_identificacion as supplier_rtn,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM purchase_returns pr
      LEFT JOIN purchases_documents p ON pr.purchase_id = p.id
      LEFT JOIN suppliers s ON pr.supplier_id = s.id
      LEFT JOIN users u ON pr.created_by = u.id
      WHERE pr.id = ? AND pr.deleted_at IS NULL
    `;

    const results = await db.query(sql, [id]);
    return results && results.length > 0 ? results[0] : null;
  }

  /**
   * Obtener items de una devolución
   */
  static async findItemsByReturnId(purchaseReturnId) {
    const sql = `
      SELECT
        pri.*,
        p.name as product_name,
        p.code as product_code,
        w.name as warehouse_name
      FROM purchase_return_items pri
      LEFT JOIN products p ON pri.product_id = p.id
      LEFT JOIN warehouses w ON pri.warehouse_id = w.id
      WHERE pri.purchase_return_id = ?
      ORDER BY pri.id
    `;

    return await db.query(sql, [purchaseReturnId]);
  }

  /**
   * Crear items de devolución
   */
  static async createItem(data) {
    const sql = `
      INSERT INTO purchase_return_items (
        purchase_return_id,
        product_id,
        product_code,
        product_name,
        quantity,
        unit_price,
        discount_value,
        tax_rate,
        subtotal,
        total,
        warehouse_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db.query(sql, [
      data.purchase_return_id,
      data.product_id,
      data.product_code || null,
      data.product_name,
      data.quantity,
      data.unit_price,
      data.discount_value || 0,
      data.tax_rate || 0,
      data.subtotal,
      data.total,
      data.warehouse_id
    ]);

    return result.insertId;
  }

  /**
   * Actualizar una devolución
   */
  static async update(id, data, userId) {
    const sql = `
      UPDATE purchase_returns
      SET
        notes = ?,
        updated_by = ?,
        updated_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
    `;

    await db.query(sql, [
      data.notes || null,
      userId,
      id
    ]);

    return true;
  }

  /**
   * Eliminar (soft delete) una devolución
   */
  static async delete(id, userId) {
    const sql = `
      UPDATE purchase_returns
      SET
        deleted_at = NOW(),
        updated_by = ?
      WHERE id = ? AND deleted_at IS NULL
    `;

    await db.query(sql, [userId, id]);
    return true;
  }

  /**
   * Generar correlativo único para devolución
   */
  static async generateCorrelative() {
    const sql = 'SELECT COUNT(*) as total FROM purchase_returns';
    const result = await db.query(sql);
    const count = result[0].total + 1;
    return `DEVCOM-${String(count).padStart(6, '0')}`;
  }

  /**
   * Contar devoluciones
   */
  static async count(filters = {}) {
    let sql = `
      SELECT COUNT(*) as total
      FROM purchase_returns pr
      LEFT JOIN suppliers s ON pr.supplier_id = s.id
      WHERE pr.deleted_at IS NULL
    `;

    const params = [];

    if (filters.supplier_id) {
      sql += ' AND pr.supplier_id = ?';
      params.push(filters.supplier_id);
    }

    if (filters.return_type) {
      sql += ' AND pr.return_type = ?';
      params.push(filters.return_type);
    }

    if (filters.credit_note_received !== undefined) {
      sql += ' AND pr.credit_note_received = ?';
      params.push(filters.credit_note_received);
    }

    if (filters.date_from) {
      sql += ' AND pr.emission_date >= ?';
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      sql += ' AND pr.emission_date <= ?';
      params.push(filters.date_to);
    }

    if (filters.search) {
      sql += ` AND (
        pr.correlative LIKE ? OR
        pr.purchase_number LIKE ? OR
        pr.credit_note_number LIKE ? OR
        s.nombre LIKE ?
      )`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const result = await db.query(sql, params);
    return result[0].total;
  }
}

module.exports = PurchaseReturnModel;
