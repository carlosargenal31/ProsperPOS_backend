// ===================================================================
// PROSPERPOS - CONTROLADOR DE DEVOLUCIONES DE VENTAS
// ===================================================================

const logger = require('../utils/logger');
const db = require('../utils/database');

class SalesReturnsController {
  /**
   * Procesar una devolución de venta
   */
  static async processReturn(req, res) {
    try {
      const {
        invoice_id,
        return_type,
        items,
        order_number,
        correlative,
        emission_date,
        notes,
        qr_code,
        credit_note_resolution_id,
        return_money,
        affect_sales_book,
        totals
      } = req.body;

      const userId = req.user.id;

      // Validar que exista la factura
      const invoiceSql = 'SELECT * FROM invoices WHERE id = ? AND deleted_at IS NULL';
      const invoices = await db.query(invoiceSql, [invoice_id]);

      if (!invoices || invoices.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada'
        });
      }

      const invoice = invoices[0];

      // Insertar el registro de devolución
      const returnSql = `
        INSERT INTO sales_returns (
          invoice_id,
          invoice_number,
          customer_id,
          customer_name,
          return_type,
          correlative,
          emission_date,
          notes,
          credit_note_resolution_id,
          return_money,
          affect_sales_book,
          subtotal,
          discount,
          tax,
          total,
          created_by,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const returnResult = await db.query(returnSql, [
        invoice_id,
        invoice.invoice_number,
        invoice.customer_id,
        invoice.customer_name,
        return_type,
        correlative,
        emission_date,
        notes,
        credit_note_resolution_id || null,
        return_money ? 1 : 0,
        affect_sales_book ? 1 : 0,
        totals.subtotal,
        totals.discount,
        totals.tax,
        totals.total,
        userId
      ]);

      const returnId = returnResult.insertId;

      // Insertar los items de la devolución
      for (const item of items) {
        const itemSql = `
          INSERT INTO sales_return_items (
            sales_return_id,
            product_id,
            product_name,
            quantity,
            unit_price,
            discount_value,
            tax_rate,
            warehouse_id,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        await db.query(itemSql, [
          returnId,
          item.product_id,
          item.product_name || '',
          item.return_quantity,
          item.unit_price,
          item.discount_value || 0,
          item.tax_rate || 0,
          item.warehouse_id
        ]);
      }

      // ===================================================================
      // GENERAR NOTA DE CRÉDITO AUTOMÁTICAMENTE
      // ===================================================================

      // 1. Generar correlativo autonumérico NC-000001
      const countCreditNotesSql = 'SELECT COUNT(*) as total FROM credit_notes';
      const countResult = await db.query(countCreditNotesSql);
      const creditNoteCount = countResult[0].total + 1;
      const creditNoteCorrelative = `NC-${String(creditNoteCount).padStart(6, '0')}`;

      // 2. Obtener resolución de nota de crédito activa AUTOMÁTICAMENTE
      let resolutionData = null;
      let creditNoteNumber = null;
      let resolvedCreditNoteResolutionId = credit_note_resolution_id;

      // Si no se proporciona resolución, buscar la activa para notas de crédito
      if (!resolvedCreditNoteResolutionId) {
        const findResolutionSql = `
          SELECT * FROM resolutions
          WHERE tipo_documento = 'credit_note' AND is_active = 1 AND deleted_at IS NULL
          ORDER BY id DESC
          LIMIT 1
        `;
        const foundResolutions = await db.query(findResolutionSql);
        if (foundResolutions && foundResolutions.length > 0) {
          resolvedCreditNoteResolutionId = foundResolutions[0].id;
        }
      }

      // Obtener datos de la resolución y generar número
      if (resolvedCreditNoteResolutionId) {
        const resolutionSql = `
          SELECT * FROM resolutions
          WHERE id = ? AND is_active = 1 AND deleted_at IS NULL
        `;
        const resolutions = await db.query(resolutionSql, [resolvedCreditNoteResolutionId]);

        if (resolutions && resolutions.length > 0) {
          resolutionData = resolutions[0];

          // Generar número de nota de crédito
          const prefix = resolutionData.prefijo_control || '';
          const suffix = resolutionData.sufijo_control || '';
          const currentNumber = resolutionData.nro_actual_control || 1;
          creditNoteNumber = `${prefix}${String(currentNumber).padStart(8, '0')}${suffix}`;

          // Incrementar el contador de la resolución
          const updateResolutionSql = `
            UPDATE resolutions
            SET nro_actual_control = nro_actual_control + 1
            WHERE id = ?
          `;
          await db.query(updateResolutionSql, [resolvedCreditNoteResolutionId]);
        }
      }

      // 3. Insertar nota de crédito
      const creditNoteSql = `
        INSERT INTO credit_notes (
          correlative,
          credit_note_number,
          invoice_id,
          invoice_number,
          sales_return_id,
          customer_id,
          customer_name,
          customer_rtn,
          emission_date,
          resolution_id,
          cai,
          authorization_number,
          start_range,
          end_range,
          notes,
          subtotal,
          discount,
          tax,
          total,
          created_by,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const creditNoteResult = await db.query(creditNoteSql, [
        creditNoteCorrelative,
        creditNoteNumber,
        invoice_id,
        invoice.invoice_number,
        returnId,
        invoice.customer_id,
        invoice.customer_name,
        invoice.customer_rtn || null,
        emission_date,
        resolvedCreditNoteResolutionId || null,
        resolutionData?.cai || resolutionData?.numero_resolucion || null,
        resolutionData?.numero_autorizacion || null,
        resolutionData?.nro_inicial_control || null,
        resolutionData?.nro_final_control || null,
        notes,
        totals.subtotal,
        totals.discount,
        totals.tax,
        totals.total,
        userId
      ]);

      const creditNoteId = creditNoteResult.insertId;

      // 4. Insertar items de la nota de crédito
      for (const item of items) {
        const itemTotal = item.return_quantity * item.unit_price;
        const discount = (itemTotal * (item.discount_value || 0)) / 100;
        const subtotalItem = itemTotal - discount;
        const tax = (subtotalItem * (item.tax_rate || 0)) / 100;
        const totalItem = subtotalItem + tax;

        const creditNoteItemSql = `
          INSERT INTO credit_note_items (
            credit_note_id,
            product_id,
            product_code,
            product_name,
            quantity,
            unit_price,
            discount_value,
            tax_rate,
            subtotal,
            total,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        await db.query(creditNoteItemSql, [
          creditNoteId,
          item.product_id,
          item.product_code || null,
          item.product_name || '',
          item.return_quantity,
          item.unit_price,
          item.discount_value || 0,
          item.tax_rate || 0,
          subtotalItem,
          totalItem
        ]);
      }

      // 5. Actualizar sales_returns con el ID de la nota de crédito
      const updateReturnSql = `
        UPDATE sales_returns
        SET credit_note_id = ?
        WHERE id = ?
      `;
      await db.query(updateReturnSql, [creditNoteId, returnId]);

      // 6. Actualizar el estado de la factura a 'returned'
      const updateInvoiceSql = `UPDATE invoices SET payment_status = 'returned' WHERE id = ?`;
      await db.query(updateInvoiceSql, [invoice_id]);

      // 7. Si return_money = 1, crear transacción de caja tipo DEVOLUCION
      if (return_money) {
        // Buscar la sesión de caja abierta del usuario
        const openSessionSql = `
          SELECT id FROM cash_register_sessions
          WHERE user_id = ? AND status = 'ABIERTA'
          ORDER BY created_at DESC LIMIT 1
        `;
        const openSessions = await db.query(openSessionSql, [userId]);

        if (openSessions.length > 0) {
          const sessionId = openSessions[0].id;

          // Crear transacción de devolución
          const transactionSql = `
            INSERT INTO cash_register_transactions (
              session_id, transaction_type, amount, description,
              payment_method, beneficiary, beneficiary_type, user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;

          await db.query(transactionSql, [
            sessionId,
            'DEVOLUCION',
            totals.total,
            `Devolución de venta ${correlative} - Factura ${invoice.invoice_number}`,
            'EFECTIVO',
            invoice.customer_name,
            'CLIENTE',
            userId
          ]);

          logger.info('Transacción de devolución registrada en caja', {
            sessionId,
            amount: totals.total,
            returnId
          });
        }
      }

      logger.info('Devolución de venta procesada exitosamente', { returnId, creditNoteId, userId });

      res.json({
        success: true,
        message: 'Devolución procesada exitosamente',
        data: {
          return_id: returnId,
          return_correlative: correlative,
          credit_note_id: creditNoteId,
          credit_note_correlative: creditNoteCorrelative,
          credit_note_number: creditNoteNumber,
          invoice_number: invoice.invoice_number,
          resolution_data: resolutionData
        }
      });
    } catch (error) {
      logger.error('Error in SalesReturnsController.processReturn:', error);
      res.status(500).json({
        success: false,
        message: 'Error al procesar la devolución',
        error: error.message
      });
    }
  }

  /**
   * Obtener todas las devoluciones
   */
  static async getAll(req, res) {
    try {
      const sql = `
        SELECT
          sr.*,
          i.invoice_number,
          i.customer_name,
          cn.correlative as credit_note_correlative,
          cn.credit_note_number
        FROM sales_returns sr
        LEFT JOIN invoices i ON sr.invoice_id = i.id
        LEFT JOIN credit_notes cn ON sr.credit_note_id = cn.id
        ORDER BY sr.created_at DESC
      `;

      const returns = await db.query(sql);

      res.json({
        success: true,
        data: returns
      });
    } catch (error) {
      logger.error('Error in SalesReturnsController.getAll:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las devoluciones',
        error: error.message
      });
    }
  }

  /**
   * Obtener una devolución por ID con sus items
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;

      // Obtener la devolución
      const returnSql = `
        SELECT
          sr.*,
          i.invoice_number,
          i.customer_name,
          cn.correlative as credit_note_correlative,
          cn.credit_note_number
        FROM sales_returns sr
        LEFT JOIN invoices i ON sr.invoice_id = i.id
        LEFT JOIN credit_notes cn ON sr.credit_note_id = cn.id
        WHERE sr.id = ?
      `;

      const returns = await db.query(returnSql, [id]);

      if (!returns || returns.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Devolución no encontrada'
        });
      }

      const returnData = returns[0];

      // Obtener los items de la devolución con códigos de producto y unidad
      const itemsSql = `
        SELECT
          sri.*,
          p.code as product_code,
          COALESCE(u.name, 'UNIDAD') as product_unit
        FROM sales_return_items sri
        LEFT JOIN products p ON sri.product_id = p.id
        LEFT JOIN units u ON p.unit_id = u.id
        WHERE sri.sales_return_id = ?
      `;

      const items = await db.query(itemsSql, [id]);

      // Formatear los items para el frontend
      returnData.items = items.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_code: item.product_code,
        product_name: item.product_name,
        product_unit: item.product_unit,
        return_quantity: item.quantity,
        unit_price: item.unit_price,
        discount_value: item.discount_value,
        tax_rate: item.tax_rate,
        warehouse_id: item.warehouse_id
      }));

      // Obtener datos de resolución si existe
      if (returnData.credit_note_resolution_id) {
        const resolutionSql = 'SELECT * FROM resolutions WHERE id = ?';
        const resolutions = await db.query(resolutionSql, [returnData.credit_note_resolution_id]);
        returnData.resolution_data = resolutions && resolutions.length > 0 ? resolutions[0] : null;
      }

      res.json({
        success: true,
        data: returnData
      });
    } catch (error) {
      logger.error('Error in SalesReturnsController.getById:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la devolución',
        error: error.message
      });
    }
  }
}

module.exports = SalesReturnsController;
