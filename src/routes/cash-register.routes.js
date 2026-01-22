const express = require('express');
const router = express.Router();
const cashRegisterController = require('../controllers/cash-register.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * @route GET /api/cash-register/sessions
 * @desc Obtener todas las sesiones de caja
 * @access Private
 */
router.get('/sessions', cashRegisterController.getAllSessions);

/**
 * @route GET /api/cash-register/sessions/:id
 * @desc Obtener sesión de caja por ID
 * @access Private
 */
router.get('/sessions/:id', cashRegisterController.getSessionById);

/**
 * @route POST /api/cash-register/sessions
 * @desc Crear nueva sesión de caja (Apertura o Cierre)
 * @access Private
 */
router.post('/sessions', cashRegisterController.createSession);

/**
 * @route PUT /api/cash-register/sessions/:id
 * @desc Actualizar sesión de caja
 * @access Private
 */
router.put('/sessions/:id', cashRegisterController.updateSession);

/**
 * @route POST /api/cash-register/sessions/:id/close
 * @desc Cerrar sesión de caja
 * @access Private
 */
router.post('/sessions/:id/close', cashRegisterController.closeSession);

/**
 * @route DELETE /api/cash-register/sessions/:id
 * @desc Eliminar sesión de caja
 * @access Private
 */
router.delete('/sessions/:id', cashRegisterController.deleteSession);

/**
 * @route GET /api/cash-register/summary
 * @desc Obtener resumen de caja por rango de fechas
 * @access Private
 */
router.get('/summary', cashRegisterController.getSummary);

/**
 * @route POST /api/cash-register/transactions
 * @desc Crear transacción de caja (egreso o retiro)
 * @access Private
 */
router.post('/transactions', cashRegisterController.createTransaction);

/**
 * @route GET /api/cash-register/transactions/session/:sessionId
 * @desc Obtener transacciones por sesión
 * @access Private
 */
router.get('/transactions/session/:sessionId', cashRegisterController.getTransactionsBySession);

/**
 * @route POST /api/cash-register/print/:id
 * @desc Imprimir reporte de arqueo de caja
 * @access Private
 */
router.post('/print/:id', cashRegisterController.printReport);

module.exports = router;
