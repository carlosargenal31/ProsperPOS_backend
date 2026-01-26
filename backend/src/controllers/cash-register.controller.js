const cashRegisterService = require('../services/cash-register.service');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');

class CashRegisterController {
  /**
   * Obtener todas las sesiones de caja
   */
  async getAllSessions(req, res) {
    try {
      const filters = {
        session_type: req.query.session_type,
        user_id: req.query.user_id,
        branch_id: req.query.branch_id,
        status: req.query.status,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        search: req.query.search,
        limit: req.query.limit || 50,
        offset: req.query.offset || 0
      };

      const sessions = await cashRegisterService.getAllSessions(filters);

      return sendSuccessResponse(res, sessions, 'Sesiones obtenidas exitosamente');
    } catch (error) {
      console.error('Error en getAllSessions:', error);
      return sendErrorResponse(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * Obtener sesión de caja por ID
   */
  async getSessionById(req, res) {
    try {
      const { id } = req.params;
      const session = await cashRegisterService.getSessionById(id);

      return sendSuccessResponse(res, session, 'Sesión obtenida exitosamente');
    } catch (error) {
      console.error('Error en getSessionById:', error);
      return sendErrorResponse(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * Crear nueva sesión de caja
   */
  async createSession(req, res) {
    try {
      const sessionData = req.body;
      const userId = req.user.id;

      const newSession = await cashRegisterService.createSession(sessionData, userId);

      return sendSuccessResponse(res, newSession, 'Sesión creada exitosamente', 201);
    } catch (error) {
      console.error('Error en createSession:', error);
      return sendErrorResponse(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * Actualizar sesión de caja
   */
  async updateSession(req, res) {
    try {
      const { id } = req.params;
      const sessionData = req.body;

      const updatedSession = await cashRegisterService.updateSession(id, sessionData);

      return sendSuccessResponse(res, updatedSession, 'Sesión actualizada exitosamente');
    } catch (error) {
      console.error('Error en updateSession:', error);
      return sendErrorResponse(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * Cerrar sesión de caja
   */
  async closeSession(req, res) {
    try {
      const { id } = req.params;
      const closingData = req.body;

      const closedSession = await cashRegisterService.closeSession(id, closingData);

      return sendSuccessResponse(res, closedSession, 'Sesión cerrada exitosamente');
    } catch (error) {
      console.error('Error en closeSession:', error);
      return sendErrorResponse(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * Eliminar sesión de caja
   */
  async deleteSession(req, res) {
    try {
      const { id } = req.params;
      await cashRegisterService.deleteSession(id);

      return sendSuccessResponse(res, null, 'Sesión eliminada exitosamente');
    } catch (error) {
      console.error('Error en deleteSession:', error);
      return sendErrorResponse(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * Obtener resumen de caja
   */
  async getSummary(req, res) {
    try {
      const { date_from, date_to, branch_id } = req.query;

      const summary = await cashRegisterService.getSummary(date_from, date_to, branch_id);

      return sendSuccessResponse(res, summary, 'Resumen obtenido exitosamente');
    } catch (error) {
      console.error('Error en getSummary:', error);
      return sendErrorResponse(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * Crear transacción de caja
   */
  async createTransaction(req, res) {
    try {
      const transactionData = req.body;
      const userId = req.user.id;

      const newTransaction = await cashRegisterService.createTransaction(transactionData, userId);

      return sendSuccessResponse(res, newTransaction, 'Transacción creada exitosamente', 201);
    } catch (error) {
      console.error('Error en createTransaction:', error);
      return sendErrorResponse(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * Obtener transacciones por sesión
   */
  async getTransactionsBySession(req, res) {
    try {
      const { sessionId } = req.params;
      const transactions = await cashRegisterService.getTransactionsBySession(sessionId);

      return sendSuccessResponse(res, transactions, 'Transacciones obtenidas exitosamente');
    } catch (error) {
      console.error('Error en getTransactionsBySession:', error);
      return sendErrorResponse(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * Imprimir reporte de arqueo de caja
   */
  async printReport(req, res) {
    try {
      const { id } = req.params;
      const { tipo_reporte } = req.body;

      const report = await cashRegisterService.generateReport(id, tipo_reporte);

      return sendSuccessResponse(res, report, 'Reporte generado exitosamente');
    } catch (error) {
      console.error('Error en printReport:', error);
      return sendErrorResponse(res, error.statusCode || 500, error.message);
    }
  }
}

module.exports = new CashRegisterController();
