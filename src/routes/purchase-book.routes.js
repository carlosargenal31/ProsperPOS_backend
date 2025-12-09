// ===================================================================
// PROSPERPOS - RUTAS DEL LIBRO DE COMPRAS
// ===================================================================

const express = require('express');
const router = express.Router();
const PurchaseBookController = require('../controllers/purchase-book.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * @route   GET /api/v1/purchase-book
 * @desc    Obtener el libro de compras con filtros
 * @access  Private
 * @query   date_from, date_to, warehouse_id, supplier_id,
 *          payment_status, show_only_returns
 */
router.get('/', PurchaseBookController.getPurchaseBook);

/**
 * @route   GET /api/v1/purchase-book/summary
 * @desc    Obtener resumen agrupado del libro de compras
 * @access  Private
 * @query   date_from, date_to, warehouse_id, supplier_id, payment_status, group_by
 */
router.get('/summary', PurchaseBookController.getPurchaseBookSummary);

/**
 * @route   GET /api/v1/purchase-book/export
 * @desc    Exportar libro de compras a Excel/CSV
 * @access  Private
 * @query   date_from, date_to, warehouse_id, supplier_id,
 *          payment_status, show_only_returns
 */
router.get('/export', PurchaseBookController.exportPurchaseBook);

module.exports = router;
