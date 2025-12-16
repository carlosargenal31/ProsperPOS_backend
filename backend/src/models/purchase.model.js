/**
 * Purchase Model
 * Handles all database operations for purchases, purchase items, and payments
 */

const db = require('../utils/database');
const logger = require('../utils/logger');

class Purchase {
  /**
   * Get all purchases with filters and pagination
   */
  static async getAll(filters = {}) {
    try {
      const {
        search = '',
        supplier_id,
        status,
        document_type,
        date_from,
        date_to,
        page = 1,
        limit = 50
      } = filters;

      const offset = (page - 1) * limit;
      let whereConditions = ['1=1', 'pd.deleted_at IS NULL', 'pd.status != "Returned"']; // Excluir eliminados y devueltos
      const params = [];

      if (search) {
        whereConditions.push(`(
          pd.purchase_number LIKE ? OR
          pd.supplier_name LIKE ? OR
          pd.supplier_id_number LIKE ?
        )`);
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam);
      }

      if (supplier_id) {
        whereConditions.push('pd.supplier_name = ?');
        params.push(supplier_id); // Actually receiving supplier_name from frontend
      }

      if (status) {
        whereConditions.push('pd.status = ?');
        params.push(status);
      }

      if (document_type) {
        whereConditions.push('pd.document_type = ?');
        params.push(document_type);
      }

      if (date_from) {
        whereConditions.push('DATE(pd.purchase_date) >= ?');
        params.push(date_from);
      }

      if (date_to) {
        whereConditions.push('DATE(pd.purchase_date) <= ?');
        params.push(date_to);
      }

      const whereClause = whereConditions.join(' AND ');

      // Count query
      const countQuery = `SELECT COUNT(*) as total FROM purchases_documents pd WHERE ${whereClause}`;
      const countResult = await db.query(countQuery, params);
      const totalRecords = countResult && countResult[0] ? countResult[0].total : 0;

      console.log('📊 Count result:', countResult);
      console.log('📊 Total records:', totalRecords);

      // Main query - usar valores directos en lugar de placeholders para LIMIT/OFFSET
      const limitValue = parseInt(limit) || 50;
      const offsetValue = parseInt(offset) || 0;

      const query = `
        SELECT
          pd.*,
          COALESCE(CONCAT(u.first_name, ' ', u.last_name), u.username, 'Sistema') as created_by_name
        FROM purchases_documents pd
        LEFT JOIN users u ON pd.created_by = u.id
        WHERE ${whereClause}
        ORDER BY pd.created_at DESC
        LIMIT ${limitValue} OFFSET ${offsetValue}
      `;

      console.log('📊 Purchase.getAll - Query:', query);
      console.log('📊 Query params:', params);

      // Ejecutar query - db.query ya retorna el array de resultados directamente
      const purchases = await db.query(query, params);

      console.log('📊 Purchases found:', purchases.length);
      console.log('📊 First purchase:', purchases[0]);

      return {
        data: purchases,
        pagination: {
          currentPage: parseInt(page),
          perPage: parseInt(limit),
          totalRecords,
          totalPages: Math.ceil(totalRecords / limit)
        }
      };
    } catch (error) {
      logger.error('Error in Purchase.getAll:', error);
      throw error;
    }
  }

  /**
   * Get purchase by ID with items
   */
  static async getById(id) {
    try {
      const [purchases] = await db.query(
        `SELECT
          pd.*,
          COALESCE(CONCAT(u.first_name, ' ', u.last_name), u.username, 'Sistema') as created_by_name
        FROM purchases_documents pd
        LEFT JOIN users u ON pd.created_by = u.id
        WHERE pd.id = ?`,
        [id]
      );

      if (purchases.length === 0) {
        return null;
      }

      const purchase = purchases[0];

      const [items] = await db.query(
        'SELECT * FROM purchases_documents_items WHERE purchase_id = ? ORDER BY id',
        [id]
      );

      return {
        ...purchase,
        items
      };
    } catch (error) {
      logger.error('Error in Purchase.getById:', error);
      throw error;
    }
  }

  /**
   * Create a new purchase
   */
  static async create(purchaseData, items = []) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Generate purchase number
      const purchaseNumber = await this.generatePurchaseNumber(connection, purchaseData.document_type);

      // Calculate totals from items OR use provided values from OCR/form
      let netAmount = parseFloat(purchaseData.net_amount || 0);
      let taxAmount = parseFloat(purchaseData.tax_amount || 0);
      let totalAmount = parseFloat(purchaseData.total_amount || 0);

      // If items exist, calculate from items
      if (items && items.length > 0) {
        netAmount = 0;
        taxAmount = 0;
        items.forEach(item => {
          const subtotal = parseFloat(item.quantity) * parseFloat(item.unit_price);
          const itemDiscount = parseFloat(item.discount_amount || 0);
          const itemTax = parseFloat(item.tax_amount || 0);
          netAmount += (subtotal - itemDiscount);
          taxAmount += itemTax;
        });
        totalAmount = netAmount + taxAmount;
      }

      // Insert purchase
      const [result] = await connection.query(
        `INSERT INTO purchases_documents (
          purchase_number,
          document_type,
          purchase_date,
          agency,
          invoice_number,
          supplier_name,
          supplier_id_number,
          status,
          net_amount,
          discount_amount,
          surcharge_amount,
          tax_amount,
          total_amount,
          notes,
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          purchaseNumber,
          purchaseData.document_type || 'FACTURA',
          purchaseData.purchase_date || new Date(),
          purchaseData.agency || 'AGENCIA PRINCIPAL',
          purchaseData.invoice_number || null,
          purchaseData.supplier_name,
          purchaseData.supplier_id_number || null,
          purchaseData.status || 'Completed',
          netAmount,
          parseFloat(purchaseData.discount_amount) || 0,
          parseFloat(purchaseData.surcharge_amount) || 0,
          taxAmount,
          totalAmount,
          purchaseData.notes || null,
          purchaseData.created_by || null
        ]
      );

      const purchaseId = result.insertId;

      // Insert purchase items
      if (items && items.length > 0) {
        for (const item of items) {
          const subtotal = parseFloat(item.quantity) * parseFloat(item.unit_price);
          const itemDiscount = parseFloat(item.discount_amount || 0);
          const itemTax = parseFloat(item.tax_amount || 0);
          const total = subtotal - itemDiscount + itemTax;

          await connection.query(
            `INSERT INTO purchases_documents_items (
              purchase_id,
              product_id,
              product_code,
              product_name,
              quantity,
              unit_price,
              discount_percentage,
              discount_amount,
              tax_percentage,
              tax_amount,
              subtotal,
              total
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              purchaseId,
              item.product_id || null,
              item.product_code || null,
              item.product_name,
              item.quantity,
              item.unit_price,
              item.discount_percentage || 0,
              itemDiscount,
              item.tax_percentage || 0,
              itemTax,
              subtotal - itemDiscount,
              total
            ]
          );
        }
      }

      await connection.commit();

      return {
        id: purchaseId,
        purchase_number: purchaseNumber,
        message: 'Compra creada exitosamente'
      };
    } catch (error) {
      await connection.rollback();
      logger.error('Error in Purchase.create:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Update a purchase
   */
  static async update(id, purchaseData) {
    try {
      const updates = [];
      const params = [];

      const allowedFields = [
        'supplier_name', 'supplier_id_number',
        'invoice_number', 'purchase_date',
        'net_amount', 'discount_amount', 'surcharge_amount',
        'tax_amount', 'total_amount',
        'status', 'notes'
      ];

      allowedFields.forEach(field => {
        if (purchaseData[field] !== undefined) {
          updates.push(`${field} = ?`);
          params.push(purchaseData[field]);
        }
      });

      if (updates.length === 0) {
        throw new Error('No hay datos para actualizar');
      }

      params.push(id);

      const result = await db.query(
        `UPDATE purchases_documents SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      if (result.affectedRows === 0) {
        throw new Error('Compra no encontrada');
      }

      return { message: 'Compra actualizada exitosamente' };
    } catch (error) {
      logger.error('Error in Purchase.update:', error);
      throw error;
    }
  }

  /**
   * Delete a purchase (soft delete)
   */
  static async delete(id) {
    try {
      // Soft delete - solo marca como eliminado, NO borra de la BD
      const result = await db.query(
        'UPDATE purchases_documents SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (result.affectedRows === 0) {
        throw new Error('Compra no encontrada o ya fue eliminada');
      }

      return { message: 'Compra eliminada exitosamente' };
    } catch (error) {
      logger.error('Error in Purchase.delete:', error);
      throw error;
    }
  }

  /**
   * Generate unique purchase number
   */
  static async generatePurchaseNumber(connection, documentType) {
    try {
      const prefix = documentType === 'ORDEN_COMPRA' ? 'OC' : 'COM';
      const [lastPurchase] = await connection.query(
        `SELECT purchase_number FROM purchases_documents
         WHERE purchase_number LIKE ?
         ORDER BY id DESC LIMIT 1`,
        [`${prefix}%`]
      );

      let nextNumber = 1;
      if (lastPurchase.length > 0) {
        const lastNumber = lastPurchase[0].purchase_number.replace(prefix, '');
        nextNumber = parseInt(lastNumber) + 1;
      }

      const paddedNumber = String(nextNumber).padStart(8, '0');
      return `${prefix}${paddedNumber}`;
    } catch (error) {
      logger.error('Error generating purchase number:', error);
      throw error;
    }
  }

  /**
   * Get Purchase Book Report (Libro de Compras)
   * Returns detailed purchase information grouped by period
   */
  static async getPurchaseBookReport(filters = {}) {
    try {
      const {
        date_from,
        date_to,
        supplier_id,
        document_type
      } = filters;

      let whereConditions = ['1=1'];
      const params = [];

      if (date_from) {
        whereConditions.push('pd.purchase_date >= ?');
        params.push(date_from);
      }

      if (date_to) {
        whereConditions.push('pd.purchase_date <= ?');
        params.push(date_to);
      }

      if (supplier_id) {
        whereConditions.push('pd.supplier_id = ?');
        params.push(supplier_id);
      }

      if (document_type) {
        whereConditions.push('pd.document_type = ?');
        params.push(document_type);
      }

      const whereClause = whereConditions.join(' AND ');

      // Get detailed purchase records
      const [purchases] = await db.query(
        `SELECT
          pd.id,
          pd.purchase_number,
          pd.purchase_date,
          pd.document_type,
          pd.supplier_name,
          pd.supplier_id_number,
          pd.net_amount,
          pd.tax_amount,
          pd.total_amount,
          pd.status,
          COUNT(pdi.id) as items_count
        FROM purchases_documents pd
        LEFT JOIN purchases_documents_items pdi ON pd.id = pdi.purchase_id
        WHERE ${whereClause}
        GROUP BY pd.id
        ORDER BY pd.purchase_date DESC, pd.purchase_number DESC`,
        params
      );

      // Get summary by supplier
      const [supplierSummary] = await db.query(
        `SELECT
          pd.supplier_name,
          pd.supplier_id_number,
          COUNT(DISTINCT pd.id) as total_purchases,
          SUM(pd.net_amount) as total_net,
          SUM(pd.tax_amount) as total_tax,
          SUM(pd.total_amount) as total_amount,
          MIN(pd.purchase_date) as first_purchase_date,
          MAX(pd.purchase_date) as last_purchase_date
        FROM purchases_documents pd
        WHERE ${whereClause}
        GROUP BY pd.supplier_name, pd.supplier_id_number
        ORDER BY total_amount DESC`,
        params
      );

      // Get overall totals
      const [totals] = await db.query(
        `SELECT
          COUNT(DISTINCT pd.id) as total_documents,
          SUM(pd.net_amount) as total_net,
          SUM(pd.tax_amount) as total_tax,
          SUM(pd.total_amount) as total_amount
        FROM purchases_documents pd
        WHERE ${whereClause}`,
        params
      );

      return {
        purchases,
        supplierSummary,
        totals: totals[0] || {
          total_documents: 0,
          total_net: 0,
          total_tax: 0,
          total_amount: 0
        },
        filters: {
          date_from: date_from || null,
          date_to: date_to || null,
          supplier_id: supplier_id || null,
          document_type: document_type || null
        }
      };
    } catch (error) {
      logger.error('Error getting purchase book report:', error);
      throw error;
    }
  }

  /**
   * Get Supplier Account Statement
   * Returns all purchases for a specific supplier with running balance
   */
  static async getSupplierStatement(supplierId, filters = {}) {
    try {
      const {
        date_from,
        date_to
      } = filters;

      let whereConditions = ['pd.supplier_id = ?'];
      const params = [supplierId];

      if (date_from) {
        whereConditions.push('pd.purchase_date >= ?');
        params.push(date_from);
      }

      if (date_to) {
        whereConditions.push('pd.purchase_date <= ?');
        params.push(date_to);
      }

      const whereClause = whereConditions.join(' AND ');

      // Get supplier info
      const [supplierInfo] = await db.query(
        `SELECT DISTINCT
          supplier_name,
          supplier_id_number
        FROM purchases_documents
        WHERE supplier_id = ?
        LIMIT 1`,
        [supplierId]
      );

      if (supplierInfo.length === 0) {
        throw new Error('Proveedor no encontrado');
      }

      // Get all transactions
      const [transactions] = await db.query(
        `SELECT
          pd.id,
          pd.purchase_number,
          pd.purchase_date,
          pd.document_type,
          pd.net_amount,
          pd.tax_amount,
          pd.total_amount,
          pd.status,
          pd.notes
        FROM purchases_documents pd
        WHERE ${whereClause}
        ORDER BY pd.purchase_date ASC, pd.id ASC`,
        params
      );

      // Get totals
      const [totals] = await db.query(
        `SELECT
          COUNT(*) as total_purchases,
          SUM(total_amount) as total_amount
        FROM purchases_documents pd
        WHERE ${whereClause}`,
        params
      );

      return {
        supplier: supplierInfo[0],
        transactions,
        totals: totals[0] || {
          total_purchases: 0,
          total_amount: 0
        },
        filters: {
          date_from: date_from || null,
          date_to: date_to || null
        }
      };
    } catch (error) {
      logger.error('Error getting supplier statement:', error);
      throw error;
    }
  }
}

module.exports = Purchase;
