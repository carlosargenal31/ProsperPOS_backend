const CashRegister = require('../models/cash-register.model');
const { AppError } = require('../utils/errors');

class CashRegisterService {
  /**
   * Obtener todas las sesiones de caja
   */
  async getAllSessions(filters) {
    try {
      const sessions = await CashRegister.getAllSessions(filters);
      return sessions || [];
    } catch (error) {
      console.error('Error en getAllSessions:', error);
      throw new AppError('Error al obtener sesiones de caja', 500, error);
    }
  }

  /**
   * Obtener sesión por ID
   */
  async getSessionById(id) {
    try {
      const session = await CashRegister.getSessionById(id);
      if (!session) {
        throw new AppError('Sesión de caja no encontrada', 404);
      }
      return session;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al obtener sesión de caja', 500, error);
    }
  }

  /**
   * Crear nueva sesión de caja
   */
  async createSession(sessionData, userId) {
    try {
      console.log('createSession - sessionData:', JSON.stringify(sessionData, null, 2));

      // Validaciones
      if (!sessionData.session_type || !['APERTURA', 'CIERRE', 'ARQUEO'].includes(sessionData.session_type)) {
        throw new AppError('Tipo de sesión inválido. Debe ser APERTURA, CIERRE o ARQUEO', 400);
      }

      if (!sessionData.date_from) {
        throw new AppError('Fecha inicial requerida', 400);
      }

      if (!sessionData.time_from) {
        throw new AppError('Hora inicial requerida', 400);
      }

      // Para apertura o arqueo de caja, validar que haya monto de apertura
      if ((sessionData.session_type === 'APERTURA' || sessionData.session_type === 'ARQUEO') && !sessionData.opening_amount) {
        throw new AppError('El monto de apertura es requerido para apertura de caja', 400);
      }

      // Calcular totales
      const totalSum = (sessionData.total_card || 0) +
                      (sessionData.total_cash || 0) +
                      (sessionData.total_transfer || 0);

      sessionData.total_sum = totalSum;

      // Para apertura o arqueo, el total final es el monto de apertura inicialmente
      if (sessionData.session_type === 'APERTURA' || sessionData.session_type === 'ARQUEO') {
        sessionData.final_total = sessionData.opening_amount || 0;
      } else {
        // Para cierre, el total final es la suma de todas las formas de pago
        sessionData.final_total = totalSum;
      }

      console.log('createSession - antes de llamar a CashRegister.createSession');
      const result = await CashRegister.createSession(sessionData, userId);
      console.log('createSession - resultado:', result?.id);
      return result;
    } catch (error) {
      console.error('createSession - error capturado:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Error al crear sesión de caja', 500, error);
    }
  }

  /**
   * Actualizar sesión de caja
   */
  async updateSession(id, sessionData) {
    try {
      // Calcular totales
      const totalSum = (sessionData.total_card || 0) +
                      (sessionData.total_cash || 0) +
                      (sessionData.total_transfer || 0);

      sessionData.total_sum = totalSum;
      sessionData.final_total = totalSum + (sessionData.opening_amount || 0);

      return await CashRegister.updateSession(id, sessionData);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al actualizar sesión de caja', 500, error);
    }
  }

  /**
   * Cerrar sesión de caja
   */
  async closeSession(id, closingData) {
    try {
      // Validaciones
      if (!closingData.date_to) {
        throw new AppError('Fecha final requerida', 400);
      }

      if (!closingData.time_to) {
        throw new AppError('Hora final requerida', 400);
      }

      return await CashRegister.closeSession(id, closingData);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al cerrar sesión de caja', 500, error);
    }
  }

  /**
   * Eliminar sesión de caja
   */
  async deleteSession(id) {
    try {
      return await CashRegister.deleteSession(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al eliminar sesión de caja', 500, error);
    }
  }

  /**
   * Crear transacción de caja
   */
  async createTransaction(transactionData, userId) {
    try {
      console.log('createTransaction - transactionData:', JSON.stringify(transactionData, null, 2));

      // Validaciones
      if (!transactionData.session_id) {
        throw new AppError('Sesión de caja requerida', 400);
      }

      if (!transactionData.transaction_type || !['EGRESO', 'RETIRO', 'DEVOLUCION'].includes(transactionData.transaction_type)) {
        throw new AppError('Tipo de transacción inválido. Debe ser EGRESO, RETIRO o DEVOLUCION', 400);
      }

      if (!transactionData.amount || transactionData.amount <= 0) {
        throw new AppError('Monto de transacción inválido', 400);
      }

      console.log('createTransaction - antes de llamar a CashRegister.createTransaction');
      const result = await CashRegister.createTransaction(transactionData, userId);
      console.log('createTransaction - resultado:', result?.id);
      return result;
    } catch (error) {
      console.error('createTransaction - error capturado:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Error al crear transacción de caja', 500, error);
    }
  }

  /**
   * Obtener transacciones por sesión
   */
  async getTransactionsBySession(sessionId) {
    try {
      return await CashRegister.getTransactionsBySession(sessionId);
    } catch (error) {
      throw new AppError('Error al obtener transacciones de caja', 500, error);
    }
  }

  /**
   * Obtener resumen de caja
   */
  async getSummary(dateFrom, dateTo, branchId = null) {
    try {
      return await CashRegister.getSummary(dateFrom, dateTo, branchId);
    } catch (error) {
      throw new AppError('Error al obtener resumen de caja', 500, error);
    }
  }

  /**
   * Generar reporte de arqueo de caja
   */
  async generateReport(id, tipoReporte = 'print') {
    try {
      const session = await this.getSessionById(id);

      if (!session) {
        throw new AppError('Sesión de caja no encontrada', 404);
      }

      // Preparar datos para el reporte
      const reportData = {
        session,
        tipo_reporte: tipoReporte,
        generated_at: new Date().toISOString()
      };

      return reportData;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al generar reporte de arqueo de caja', 500, error);
    }
  }
}

module.exports = new CashRegisterService();
