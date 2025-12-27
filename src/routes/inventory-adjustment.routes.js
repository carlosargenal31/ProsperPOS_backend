// ===================================================================
// PROSPERPOS - RUTAS DE AJUSTE DE INVENTARIO
// ===================================================================

const express = require('express');
const router = express.Router();
const InventoryAdjustmentController = require('../controllers/inventory-adjustment.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * @route   GET /api/inventory-adjustments/next-consecutive
 * @desc    Obtener siguiente consecutivo
 * @access  Private
 */
router.get('/next-consecutive', InventoryAdjustmentController.getNextConsecutive);

/**
 * @route   GET /api/inventory-adjustments/inventory
 * @desc    Obtener inventario para ajuste
 * @access  Private
 * @query   warehouse_id, product_code, product_name, category_id, subcategory_id, existence_filter
 */
router.get('/inventory', InventoryAdjustmentController.getInventoryForAdjustment);

/**
 * @route   GET /api/inventory-adjustments
 * @desc    Listar ajustes de inventario
 * @access  Private
 * @query   start_date, end_date, warehouse_id, status, search, page, limit
 */
router.get('/', InventoryAdjustmentController.listAdjustments);

/**
 * @route   GET /api/inventory-adjustments/:id
 * @desc    Obtener detalle de ajuste
 * @access  Private
 */
router.get('/:id', InventoryAdjustmentController.getAdjustmentDetail);

/**
 * @route   POST /api/inventory-adjustments
 * @desc    Crear ajuste de inventario
 * @access  Private
 * @body    consecutive, issue_date, issuer, warehouse_id, concept, items[]
 */
router.post('/', InventoryAdjustmentController.createAdjustment);

/**
 * @route   POST /api/inventory-adjustments/:id/apply
 * @desc    Aplicar ajuste al inventario
 * @access  Private
 */
router.post('/:id/apply', InventoryAdjustmentController.applyAdjustment);

module.exports = router;
