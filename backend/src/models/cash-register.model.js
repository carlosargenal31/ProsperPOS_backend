const db = require('../utils/database');
const { AppError } = require('../utils/errors');

class CashRegister {
  /**
   * Obtener todas las sesiones de caja con filtros
   */
  static async getAllSessions(filters = {}) {
    try {
      let query = `
        SELECT
          s.*,
          CONCAT(u.first_name, ' ', u.last_name) as user_name,
          b.nombre as branch_name
        FROM cash_register_sessions s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN branches b ON s.branch_id = b.id
        WHERE 1=1
      `;

      const params = [];

      // Filtros
      if (filters.session_type) {
        query += ` AND s.session_type = ?`;
        params.push(filters.session_type);
      }

      if (filters.user_id) {
        query += ` AND s.user_id = ?`;
        params.push(filters.user_id);
      }

      if (filters.branch_id) {
        query += ` AND s.branch_id = ?`;
        params.push(filters.branch_id);
      }

      if (filters.status) {
        query += ` AND s.status = ?`;
        params.push(filters.status);
      }

      if (filters.date_from) {
        query += ` AND s.date_from >= ?`;
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        query += ` AND s.date_to <= ?`;
        params.push(filters.date_to);
      }

      if (filters.search) {
        query += ` AND (s.consecutive LIKE ? OR u.name LIKE ? OR b.name LIKE ?)`;
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      query += ` ORDER BY s.created_at DESC`;

      // Paginación
      if (filters.limit) {
        query += ` LIMIT ?`;
        params.push(parseInt(filters.limit));

        if (filters.offset) {
          query += ` OFFSET ?`;
          params.push(parseInt(filters.offset));
        }
      }

      const sessions = await db.query(query, params);

      // Calcular efectivo disponible para cada sesión
      for (const session of sessions) {
        // Calcular ventas en efectivo desde la apertura
        const dateFrom = typeof session.date_from === 'object'
          ? session.date_from.toISOString().split('T')[0]
          : String(session.date_from).split('T')[0];

        const dateTo = session.date_to
          ? (typeof session.date_to === 'object'
            ? session.date_to.toISOString().split('T')[0]
            : String(session.date_to).split('T')[0])
          : new Date().toISOString().split('T')[0];

        const dateTimeFrom = `${dateFrom} ${session.time_from}`;
        const dateTimeTo = session.date_to && session.time_to
          ? `${dateTo} ${session.time_to}`
          : new Date().toISOString().slice(0, 19).replace('T', ' ');

        // Obtener ventas en efectivo
        const cashSales = await db.query(`
          SELECT COALESCE(SUM(ip.amount), 0) as total_cash_sales
          FROM invoice_payments ip
          INNER JOIN invoices i ON ip.invoice_id = i.id
          WHERE i.created_by = ?
            AND ip.payment_date >= ?
            AND ip.payment_date <= ?
            AND ip.payment_method = 'EFECTIVO'
            AND i.status != 'cancelled'
            AND ip.deleted_at IS NULL
        `, [session.user_id, dateTimeFrom, dateTimeTo]);

        // Obtener retiros de efectivo
        const withdrawals = await db.query(`
          SELECT COALESCE(SUM(amount), 0) as total_withdrawals
          FROM cash_register_transactions
          WHERE session_id = ?
            AND transaction_type = 'RETIRO'
            AND payment_method = 'EFECTIVO'
        `, [session.id]);

        const totalCashSales = parseFloat(cashSales[0]?.total_cash_sales || 0);
        const totalWithdrawals = parseFloat(withdrawals[0]?.total_withdrawals || 0);
        const openingAmount = parseFloat(session.opening_amount || 0);

        // Calcular efectivo disponible: apertura + ventas - retiros
        session.total_cash = openingAmount + totalCashSales - totalWithdrawals;
      }

      return sessions;
    } catch (error) {
      console.error('Error en getAllSessions:', error);
      throw error;
    }
  }

  /**
   * Obtener sesión por ID con detalles
   */
  static async getSessionById(id) {
    try {
      const sessions = await db.query(
        `SELECT
          s.*,
          CONCAT(u.first_name, ' ', u.last_name) as user_name,
          u.email as user_email,
          b.nombre as branch_name
        FROM cash_register_sessions s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN branches b ON s.branch_id = b.id
        WHERE s.id = ?`,
        [id]
      );

      if (sessions.length === 0) {
        return null;
      }

      const session = sessions[0];

      // Obtener transacciones asociadas
      const transactions = await db.query(
        `SELECT * FROM cash_register_transactions WHERE session_id = ? ORDER BY created_at DESC`,
        [id]
      );

      // Obtener denominaciones asociadas
      const denominations = await db.query(
        `SELECT * FROM cash_register_denominations WHERE session_id = ? ORDER BY unit_value DESC`,
        [id]
      );

      // Obtener pagos bancarios asociados
      const bankPayments = await db.query(
        `SELECT * FROM cash_register_bank_payments WHERE session_id = ?`,
        [id]
      );

      // Calcular totales del sistema basados en ventas reales
      const salesTotals = await this.calculateSystemTotals(session);

      session.transactions = transactions;
      session.denominations = denominations;
      session.bank_payments = bankPayments;
      session.system_totals = salesTotals;

      // Actualizar total_by_system si no está establecido
      if (!session.total_by_system || session.total_by_system === 0) {
        session.total_by_system = salesTotals.total_general;
      }

      // Calcular el total de ventas del día (sin incluir apertura)
      session.sales_total = salesTotals.total_general - parseFloat(session.opening_amount || 0);
      session.sales_by_method = {
        cash: salesTotals.total_cash - parseFloat(session.opening_amount || 0),
        card_credit: salesTotals.total_card_credit,
        card_debit: salesTotals.total_card_debit,
        transfer: salesTotals.total_transfer,
        credit_note: salesTotals.total_credit_note,
        check: salesTotals.total_check,
        link_payment: salesTotals.total_link_payment
      };

      // Calcular efectivo disponible en caja: apertura + ventas en efectivo - retiros
      const withdrawals = await db.query(`
        SELECT COALESCE(SUM(amount), 0) as total_withdrawals
        FROM cash_register_transactions
        WHERE session_id = ?
          AND transaction_type = 'RETIRO'
          AND payment_method = 'EFECTIVO'
      `, [id]);

      const totalWithdrawals = parseFloat(withdrawals[0]?.total_withdrawals || 0);
      const openingAmount = parseFloat(session.opening_amount || 0);
      const cashSalesAmount = salesTotals.total_cash - openingAmount;

      // Efectivo disponible = apertura + ventas en efectivo - retiros
      session.total_cash = openingAmount + cashSalesAmount - totalWithdrawals;

      return session;
    } catch (error) {
      console.error('Error en getSessionById:', error);
      throw error;
    }
  }

  /**
   * Calcular totales del sistema basados en ventas desde la apertura de caja
   */
  static async calculateSystemTotals(session) {
    try {
      // Formatear fechas correctamente para SQL
      let dateFrom = session.date_from;
      if (typeof dateFrom === 'object' && dateFrom instanceof Date) {
        dateFrom = dateFrom.toISOString().split('T')[0];
      } else if (typeof dateFrom === 'object') {
        // Si es un objeto pero no Date, intentar convertir a string
        dateFrom = String(dateFrom).split('T')[0];
      }

      // Formatear date_to correctamente
      let dateTo = session.date_to;
      if (dateTo) {
        if (typeof dateTo === 'object' && dateTo instanceof Date) {
          dateTo = dateTo.toISOString().split('T')[0];
        } else if (typeof dateTo === 'object') {
          dateTo = String(dateTo).split('T')[0];
        }
      }

      const dateTimeFrom = `${dateFrom} ${session.time_from}`;
      const dateTimeTo = dateTo && session.time_to
        ? `${dateTo} ${session.time_to}`
        : new Date().toISOString().slice(0, 19).replace('T', ' ');

      // Obtener pagos desde la apertura de caja
      const salesQuery = `
        SELECT
          ip.payment_method,
          SUM(ip.amount) as total
        FROM invoice_payments ip
        INNER JOIN invoices i ON ip.invoice_id = i.id
        WHERE i.created_by = ?
          AND ip.payment_date >= ?
          AND ip.payment_date <= ?
          AND i.status != 'cancelled'
          AND ip.deleted_at IS NULL
        GROUP BY ip.payment_method
      `;

      const sales = await db.query(salesQuery, [
        session.user_id,
        dateTimeFrom,
        dateTimeTo
      ]);

      const totals = {
        total_cash_sales: 0, // Solo ventas en efectivo (para mostrar en la sección de ventas)
        total_cash: 0, // Efectivo disponible en caja (apertura + ventas - movimientos)
        total_card_credit: 0,
        total_card_debit: 0,
        total_transfer: 0,
        total_credit_note: 0,
        total_check: 0,
        total_link_payment: 0,
        total_general: 0
      };

      sales.forEach(sale => {
        const amount = parseFloat(sale.total || 0);
        const method = sale.payment_method?.toUpperCase().trim();

        switch (method) {
          case 'EFECTIVO':
            totals.total_cash_sales += amount; // Solo ventas en efectivo
            totals.total_cash += amount; // También para el cálculo del efectivo en caja
            break;
          case 'TARJETA':
          case 'TARJ. CREDITO':
          case 'TARJ_CREDITO':
          case 'TARJETA CREDITO':
          case 'TARJETA DE CREDITO':
            totals.total_card_credit += amount;
            break;
          case 'TARJ. DEBITO':
          case 'TARJ_DEBITO':
          case 'TARJETA DEBITO':
          case 'TARJETA DE DEBITO':
            totals.total_card_debit += amount;
            break;
          case 'TRANSFERENCIA':
            totals.total_transfer += amount;
            break;
          case 'NOTA DE CREDITO':
          case 'NOTA_CREDITO':
            totals.total_credit_note += amount;
            break;
          case 'CHEQUE':
            totals.total_check += amount;
            break;
          case 'LINK DE PAGO':
          case 'LINK_PAGO':
          case 'LINK PAGO':
            totals.total_link_payment += amount;
            break;
        }
        totals.total_general += amount;
      });

      // Sumar apertura de caja solo al efectivo disponible en caja (NO a las ventas)
      totals.total_cash += parseFloat(session.opening_amount || 0);
      totals.total_general += parseFloat(session.opening_amount || 0);

      // Obtener transacciones de caja para restar del total general
      const transactionsQuery = `
        SELECT transaction_type, SUM(amount) as total
        FROM cash_register_transactions
        WHERE session_id = ?
          AND transaction_type IN ('EGRESO', 'RETIRO', 'DEVOLUCION')
        GROUP BY transaction_type
      `;

      const transactions = await db.query(transactionsQuery, [session.id]);

      // Restar egresos, retiros y devoluciones del total general
      transactions.forEach(transaction => {
        const amount = parseFloat(transaction.total || 0);
        totals.total_general -= amount;

        // Solo restar RETIROS y EGRESOS del efectivo
        // Las DEVOLUCIONES se manejan como NOTAS DE CREDITO separadamente
        if (transaction.transaction_type === 'RETIRO' ||
            transaction.transaction_type === 'EGRESO') {
          totals.total_cash -= amount;
        }
      });

      // Obtener notas de crédito de tipo EFECTIVO y restarlas del efectivo
      const creditNotesQuery = `
        SELECT SUM(total_local) as total
        FROM cash_register_bank_payments
        WHERE session_id = ?
          AND payment_method = 'NOTA DE CREDITO'
          AND (credit_note_type = 'EFECTIVO' OR credit_note_type IS NULL)
      `;

      const creditNotes = await db.query(creditNotesQuery, [session.id]);
      const creditNotesInCash = parseFloat(creditNotes[0]?.total || 0);

      // Restar notas de crédito en efectivo del total de efectivo
      totals.total_cash -= creditNotesInCash;

      return totals;
    } catch (error) {
      console.error('Error en calculateSystemTotals:', error);
      throw error;
    }
  }

  /**
   * Crear nueva sesión de caja
   */
  static async createSession(sessionData, userId) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Generar consecutivo (siempre ARQUEO)
      const consecutive = await this.generateConsecutive('ARQUEO', connection);

      // Insertar sesión
      const [result] = await connection.query(
        `INSERT INTO cash_register_sessions (
          consecutive, session_type, user_id, branch_id, agency,
          date_from, date_to, time_from, time_to,
          total_card, total_cash, total_transfer, total_sum,
          opening_amount, final_total,
          currency, exchange_rate, payment_method,
          bank, reference, bank_commission_percentage, bank_commission_total,
          total_by_count, total_by_system, difference,
          notes, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          consecutive,
          sessionData.session_type || 'ARQUEO',
          sessionData.user_id || userId,
          sessionData.branch_id || null,
          sessionData.agency || null,
          sessionData.date_from,
          sessionData.date_to || null,
          sessionData.time_from,
          sessionData.time_to || null,
          sessionData.total_card || 0,
          sessionData.total_cash || 0,
          sessionData.total_transfer || 0,
          sessionData.total_sum || 0,
          sessionData.opening_amount || 0,
          sessionData.final_total || 0,
          sessionData.currency || 'LEMPIRA',
          sessionData.exchange_rate || 0,
          sessionData.payment_method || null,
          sessionData.bank || null,
          sessionData.reference || null,
          sessionData.bank_commission_percentage || 0,
          sessionData.bank_commission_total || 0,
          sessionData.total_by_count || 0,
          sessionData.total_by_system || 0,
          sessionData.difference || 0,
          sessionData.notes || null,
          sessionData.status || 'ABIERTA',
          userId
        ]
      );

      const sessionId = result.insertId;

      // Insertar denominaciones si existen
      if (sessionData.denominations && sessionData.denominations.length > 0) {
        for (const denomination of sessionData.denominations) {
          await connection.query(
            `INSERT INTO cash_register_denominations (
              session_id, denomination, currency, quantity, unit_value, total_value
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              sessionId,
              denomination.denomination,
              denomination.currency || 'LEMPIRA',
              denomination.quantity,
              denomination.unit_value,
              denomination.total_value
            ]
          );
        }
      }

      // Insertar pagos bancarios si existen
      if (sessionData.bank_payments && sessionData.bank_payments.length > 0) {
        for (const payment of sessionData.bank_payments) {
          await connection.query(
            `INSERT INTO cash_register_bank_payments (
              session_id, bank, reference, currency, total_ext, total_local
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              sessionId,
              payment.bank,
              payment.reference || null,
              payment.currency || 'LEMPIRA',
              payment.total_ext || 0,
              payment.total_local || 0
            ]
          );
        }
      }

      await connection.commit();

      return await this.getSessionById(sessionId);
    } catch (error) {
      await connection.rollback();
      console.error('Error en createSession:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Sanitizar valor decimal - convierte a decimal válido
   */
  static sanitizeDecimal(value, decimals = 2) {
    if (value === null || value === undefined || value === '') {
      return '0.00';
    }

    // Si ya es un número, simplemente formatearlo
    if (typeof value === 'number') {
      return value.toFixed(decimals);
    }

    // Si es string, convertir directamente
    // Asumimos formato USA: punto = decimal, coma = separador de miles (opcional)
    if (typeof value === 'string') {
      // Remover solo las comas (separadores de miles en formato USA)
      value = value.replace(/,/g, '');
    }

    // Convertir a número
    const num = parseFloat(value);

    // Si no es un número válido, retornar 0
    if (isNaN(num)) {
      return '0.00';
    }

    // Retornar como string con decimales fijos
    return num.toFixed(decimals);
  }

  /**
   * Actualizar sesión de caja
   */
  static async updateSession(id, sessionData) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Verificar que la sesión existe
      const existing = await connection.query(
        'SELECT * FROM cash_register_sessions WHERE id = ?',
        [id]
      );

      if (!existing || existing.length === 0) {
        throw new AppError('Sesión de caja no encontrada', 404);
      }

      // Si la sesión está abierta o revisado, NO permitir llenar date_to ni time_to a menos que esté cerrando
      if ((existing[0].status === 'ABIERTA' || existing[0].status === 'REVISADO') && sessionData.status !== 'CERRADA') {
        if (sessionData.date_to || sessionData.time_to) {
          throw new AppError('No se puede establecer fecha/hora final en una caja abierta o revisada. Debe cerrar la caja primero.', 400);
        }
      }

      // Construir query de actualización dinámicamente
      const updates = [];
      const values = [];

      if (sessionData.agency !== undefined) {
        updates.push('agency = ?');
        values.push(sessionData.agency);
      }
      if (sessionData.date_from !== undefined) {
        updates.push('date_from = ?');
        // Convertir fecha ISO a formato YYYY-MM-DD
        let dateFrom = sessionData.date_from;
        if (typeof dateFrom === 'string' && dateFrom.includes('T')) {
          dateFrom = dateFrom.split('T')[0];
        }
        values.push(dateFrom);
      }
      if (sessionData.date_to !== undefined) {
        updates.push('date_to = ?');
        // Convertir fecha ISO a formato YYYY-MM-DD
        let dateTo = sessionData.date_to;
        if (dateTo && typeof dateTo === 'string' && dateTo.includes('T')) {
          dateTo = dateTo.split('T')[0];
        }
        values.push(dateTo);
      }
      if (sessionData.time_from !== undefined) {
        updates.push('time_from = ?');
        values.push(sessionData.time_from);
      }
      if (sessionData.time_to !== undefined) {
        updates.push('time_to = ?');
        values.push(sessionData.time_to);
      }
      if (sessionData.total_card !== undefined) {
        updates.push('total_card = ?');
        values.push(this.sanitizeDecimal(sessionData.total_card));
      }
      if (sessionData.total_cash !== undefined) {
        updates.push('total_cash = ?');
        values.push(this.sanitizeDecimal(sessionData.total_cash));
      }
      if (sessionData.total_transfer !== undefined) {
        updates.push('total_transfer = ?');
        values.push(this.sanitizeDecimal(sessionData.total_transfer));
      }
      if (sessionData.total_sum !== undefined) {
        updates.push('total_sum = ?');
        values.push(this.sanitizeDecimal(sessionData.total_sum));
      }
      if (sessionData.opening_amount !== undefined) {
        updates.push('opening_amount = ?');
        values.push(this.sanitizeDecimal(sessionData.opening_amount));
      }
      if (sessionData.final_total !== undefined) {
        updates.push('final_total = ?');
        values.push(this.sanitizeDecimal(sessionData.final_total));
      }
      if (sessionData.currency !== undefined) {
        updates.push('currency = ?');
        values.push(sessionData.currency);
      }
      if (sessionData.exchange_rate !== undefined) {
        updates.push('exchange_rate = ?');
        values.push(this.sanitizeDecimal(sessionData.exchange_rate, 4));
      }
      if (sessionData.payment_method !== undefined) {
        updates.push('payment_method = ?');
        values.push(sessionData.payment_method);
      }
      if (sessionData.bank !== undefined) {
        updates.push('bank = ?');
        values.push(sessionData.bank);
      }
      if (sessionData.reference !== undefined) {
        updates.push('reference = ?');
        values.push(sessionData.reference);
      }
      if (sessionData.bank_commission_percentage !== undefined) {
        updates.push('bank_commission_percentage = ?');
        values.push(this.sanitizeDecimal(sessionData.bank_commission_percentage));
      }
      if (sessionData.bank_commission_total !== undefined) {
        updates.push('bank_commission_total = ?');
        values.push(this.sanitizeDecimal(sessionData.bank_commission_total));
      }
      if (sessionData.total_by_count !== undefined) {
        updates.push('total_by_count = ?');
        values.push(this.sanitizeDecimal(sessionData.total_by_count));
      }
      if (sessionData.total_by_system !== undefined) {
        updates.push('total_by_system = ?');
        values.push(this.sanitizeDecimal(sessionData.total_by_system));
      }
      if (sessionData.difference !== undefined) {
        updates.push('difference = ?');
        values.push(this.sanitizeDecimal(sessionData.difference));
      }
      if (sessionData.notes !== undefined) {
        updates.push('notes = ?');
        values.push(sessionData.notes);
      }
      if (sessionData.status !== undefined) {
        updates.push('status = ?');
        values.push(sessionData.status);
      }

      if (updates.length > 0) {
        values.push(id);
        await connection.query(
          `UPDATE cash_register_sessions SET ${updates.join(', ')} WHERE id = ?`,
          values
        );
      }

      // Actualizar denominaciones si se proporcionan
      if (sessionData.denominations) {
        // Eliminar denominaciones existentes
        await connection.query('DELETE FROM cash_register_denominations WHERE session_id = ?', [id]);

        // Insertar nuevas denominaciones
        for (const denomination of sessionData.denominations) {
          await connection.query(
            `INSERT INTO cash_register_denominations (
              session_id, denomination, currency, quantity, unit_value, total_value
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              id,
              denomination.denomination,
              denomination.currency || 'LEMPIRA',
              parseInt(denomination.quantity || 0),
              this.sanitizeDecimal(denomination.unit_value),
              this.sanitizeDecimal(denomination.total_value)
            ]
          );
        }
      }

      // Actualizar pagos bancarios si se proporcionan
      if (sessionData.bank_payments) {
        // Eliminar pagos bancarios existentes
        await connection.query('DELETE FROM cash_register_bank_payments WHERE session_id = ?', [id]);

        // Insertar nuevos pagos bancarios
        for (const payment of sessionData.bank_payments) {
          await connection.query(
            `INSERT INTO cash_register_bank_payments (
              session_id, bank, reference, currency, total_ext, total_local, payment_method
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              payment.bank || null,
              payment.reference || null,
              payment.currency || 'LEMPIRA',
              this.sanitizeDecimal(payment.total_ext || 0),
              this.sanitizeDecimal(payment.total_local || 0),
              payment.payment_method || null
            ]
          );
        }
      }

      await connection.commit();

      return await this.getSessionById(id);
    } catch (error) {
      await connection.rollback();
      console.error('Error en updateSession:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Crear transacción de caja (egreso o retiro)
   */
  static async createTransaction(transactionData, userId) {
    try {
      const result = await db.query(
        `INSERT INTO cash_register_transactions (
          session_id, transaction_type, amount, description,
          payment_method, bank, reference,
          beneficiary, beneficiary_type, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionData.session_id,
          transactionData.transaction_type,
          transactionData.amount,
          transactionData.description || null,
          transactionData.payment_method || 'EFECTIVO',
          transactionData.bank || null,
          transactionData.reference || null,
          transactionData.beneficiary || null,
          transactionData.beneficiary_type || null,
          userId
        ]
      );

      const transaction = await db.query(
        'SELECT * FROM cash_register_transactions WHERE id = ?',
        [result.insertId]
      );

      return transaction[0];
    } catch (error) {
      console.error('Error en createTransaction:', error);
      throw error;
    }
  }

  /**
   * Obtener transacciones por sesión
   */
  static async getTransactionsBySession(sessionId) {
    try {
      const transactions = await db.query(
        `SELECT
          t.*,
          CONCAT(u.first_name, ' ', u.last_name) as user_name
        FROM cash_register_transactions t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.session_id = ?
        ORDER BY t.created_at DESC`,
        [sessionId]
      );

      return transactions;
    } catch (error) {
      console.error('Error en getTransactionsBySession:', error);
      throw error;
    }
  }

  /**
   * Cerrar sesión de caja
   */
  static async closeSession(id, closingData) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Verificar que la sesión existe y está abierta
      const [existing] = await connection.query(
        'SELECT * FROM cash_register_sessions WHERE id = ? AND status = ?',
        [id, 'ABIERTA']
      );

      if (existing.length === 0) {
        throw new AppError('Sesión de caja no encontrada o ya cerrada', 404);
      }

      // Actualizar sesión con datos de cierre
      await connection.query(
        `UPDATE cash_register_sessions SET
          date_to = ?, time_to = ?,
          total_by_count = ?, total_by_system = ?, difference = ?,
          notes = ?, status = 'CERRADA'
        WHERE id = ?`,
        [
          closingData.date_to,
          closingData.time_to,
          closingData.total_by_count || 0,
          closingData.total_by_system || 0,
          closingData.difference || 0,
          closingData.notes || existing[0].notes,
          id
        ]
      );

      await connection.commit();

      return await this.getSessionById(id);
    } catch (error) {
      await connection.rollback();
      console.error('Error en closeSession:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Eliminar sesión de caja (solo si está en BORRADOR)
   */
  static async deleteSession(id) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Verificar que la sesión existe
      const existing = await connection.query(
        'SELECT * FROM cash_register_sessions WHERE id = ?',
        [id]
      );

      if (!existing || existing.length === 0) {
        throw new AppError('Sesión de caja no encontrada', 404);
      }

      // Eliminar sesión (las transacciones y denominaciones se eliminan en cascada)
      await connection.query('DELETE FROM cash_register_sessions WHERE id = ?', [id]);

      await connection.commit();

      return { success: true, message: 'Sesión eliminada exitosamente' };
    } catch (error) {
      await connection.rollback();
      console.error('Error en deleteSession:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Generar consecutivo para sesión de arqueo
   */
  static async generateConsecutive(sessionType = 'ARQUEO', connection = null) {
    try {
      const prefix = 'ARQ';
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const periodPrefix = `${prefix}-${year}${month}`;

      // Buscar el último consecutivo del período actual
      let lastSession;
      if (connection && connection.query) {
        [lastSession] = await connection.query(
          `SELECT consecutive FROM cash_register_sessions
           WHERE consecutive LIKE ?
           ORDER BY consecutive DESC LIMIT 1`,
          [`${periodPrefix}%`]
        );
      } else {
        lastSession = await db.query(
          `SELECT consecutive FROM cash_register_sessions
           WHERE consecutive LIKE ?
           ORDER BY consecutive DESC LIMIT 1`,
          [`${periodPrefix}%`]
        );
      }

      let number = 1;
      if (lastSession && lastSession.length > 0 && lastSession[0].consecutive) {
        const lastConsecutive = lastSession[0].consecutive;
        const lastNumber = parseInt(lastConsecutive.split('-').pop());
        number = lastNumber + 1;
      }

      // Generar consecutivo y verificar que no exista
      let consecutive = `${periodPrefix}-${String(number).padStart(6, '0')}`;

      // Verificar si ya existe (por seguridad)
      let exists;
      if (connection && connection.query) {
        [exists] = await connection.query(
          'SELECT id FROM cash_register_sessions WHERE consecutive = ?',
          [consecutive]
        );
      } else {
        exists = await db.query(
          'SELECT id FROM cash_register_sessions WHERE consecutive = ?',
          [consecutive]
        );
      }

      // Si existe, incrementar hasta encontrar uno disponible
      let iterations = 0;
      while (exists && exists.length > 0 && iterations < 100) {
        iterations++;
        number++;
        consecutive = `${periodPrefix}-${String(number).padStart(6, '0')}`;
        if (connection && connection.query) {
          [exists] = await connection.query(
            'SELECT id FROM cash_register_sessions WHERE consecutive = ?',
            [consecutive]
          );
        } else {
          exists = await db.query(
            'SELECT id FROM cash_register_sessions WHERE consecutive = ?',
            [consecutive]
          );
        }
      }

      if (iterations >= 100) {
        throw new Error('No se pudo generar un consecutivo único después de 100 intentos');
      }

      return consecutive;
    } catch (error) {
      console.error('Error en generateConsecutive:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen de caja por rango de fechas
   */
  static async getSummary(dateFrom = null, dateTo = null, branchId = null) {
    try {
      let query = `
        SELECT
          COUNT(*) as total_sessions,
          SUM(CASE WHEN status = 'ABIERTA' THEN 1 ELSE 0 END) as open_sessions,
          SUM(CASE WHEN status = 'CERRADA' THEN 1 ELSE 0 END) as closed_sessions,
          SUM(opening_amount) as total_opening,
          SUM(total_cash) as total_cash,
          SUM(total_card) as total_card,
          SUM(total_transfer) as total_transfer,
          SUM(final_total) as total_final,
          SUM(difference) as total_difference
        FROM cash_register_sessions
        WHERE 1=1
      `;

      const params = [];

      if (dateFrom) {
        query += ` AND date_from >= ?`;
        params.push(dateFrom);
      }

      if (dateTo) {
        query += ` AND date_from <= ?`;
        params.push(dateTo);
      }

      if (branchId) {
        query += ` AND branch_id = ?`;
        params.push(branchId);
      }

      const summary = await db.query(query, params);
      return summary[0];
    } catch (error) {
      console.error('Error en getSummary:', error);
      throw error;
    }
  }
}

module.exports = CashRegister;
