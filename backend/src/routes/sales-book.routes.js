// ===================================================================
// PROSPERPOS - RUTAS DEL LIBRO DE VENTAS
// ===================================================================

const express = require('express');
const router = express.Router();
const SalesBookController = require('../controllers/sales-book.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * @route   GET /api/sales-book
 * @desc    Obtener el libro de ventas con filtros
 * @access  Private
 * @query   date_from, date_to, agency_id, customer_id, customer_type,
 *          document_type, seller_id, payment_status, show_only_returns
 */
router.get('/', SalesBookController.getSalesBook);

/**
 * @route   GET /api/sales-book/summary
 * @desc    Obtener resumen agrupado del libro de ventas
 * @access  Private
 * @query   date_from, date_to, agency_id, seller_id, payment_status, group_by
 */
router.get('/summary', SalesBookController.getSalesBookSummary);

/**
 * @route   GET /api/sales-book/export
 * @desc    Exportar libro de ventas a Excel/CSV
 * @access  Private
 * @query   date_from, date_to, agency_id, customer_id, customer_type,
 *          document_type, seller_id, payment_status, show_only_returns
 */
router.get('/export', SalesBookController.exportSalesBook);

module.exports = router;
