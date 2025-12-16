/**
 * ===================================================================
 * PROSPERPOS - RUTAS DE REPORTE DE PÉRDIDAS Y GANANCIAS
 * ===================================================================
 */

const express = require('express');
const router = express.Router();
const profitLossController = require('../controllers/profit-loss.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

/**
 * @route   GET /api/profit-loss
 * @desc    Obtener reporte de pérdidas y ganancias
 * @access  Private
 * @query   date_from, date_to, branch_id (opcional), period (monthly|weekly|daily|yearly)
 */
router.get('/', profitLossController.getReport);

/**
 * @route   GET /api/profit-loss/export/excel
 * @desc    Exportar reporte a Excel
 * @access  Private
 * @query   date_from, date_to, branch_id (opcional), period (monthly|weekly|daily|yearly)
 */
router.get('/export/excel', profitLossController.exportExcel);

/**
 * @route   GET /api/profit-loss/export/pdf
 * @desc    Exportar reporte a PDF
 * @access  Private
 * @query   date_from, date_to, branch_id (opcional), period (monthly|weekly|daily|yearly)
 */
router.get('/export/pdf', profitLossController.exportPDF);

module.exports = router;
