// ===================================================================
// PROSPERPOS - RUTAS DEL INVENTARIO FÍSICO
// ===================================================================

const express = require('express');
const router = express.Router();
const PhysicalInventoryController = require('../controllers/physical-inventory.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * @route   GET /api/physical-inventory
 * @desc    Obtener el inventario físico con filtros
 * @access  Private
 * @query   article_code, article_name, group_id, subgroup_id, warehouse_id,
 *          sub_warehouse_id, brand_id, model, reference, existence_filter,
 *          report_type, include_cost, include_average_cost, include_prices,
 *          include_serials, include_codes, include_alternative_codes,
 *          include_unit, include_brand, include_model, include_sizes_colors,
 *          include_images, group_by_warehouses, group_by_groups,
 *          group_by_articles, include_suspended, is_for_inventory_taking
 */
router.get('/', PhysicalInventoryController.getPhysicalInventory);

/**
 * @route   GET /api/physical-inventory/summary
 * @desc    Obtener resumen de inventario por almacén
 * @access  Private
 * @query   group_id, brand_id, existence_filter
 */
router.get('/summary', PhysicalInventoryController.getInventorySummary);

/**
 * @route   GET /api/physical-inventory/export
 * @desc    Exportar inventario físico a Excel/PDF
 * @access  Private
 * @query   article_code, article_name, group_id, subgroup_id, warehouse_id,
 *          sub_warehouse_id, brand_id, model, reference, existence_filter,
 *          report_type, include_cost, include_average_cost, include_prices,
 *          include_serials, include_codes, include_alternative_codes,
 *          include_unit, include_brand, include_model, include_sizes_colors,
 *          include_images, group_by_warehouses, group_by_groups,
 *          group_by_articles, include_suspended, is_for_inventory_taking
 */
router.get('/export', PhysicalInventoryController.exportPhysicalInventory);

module.exports = router;
