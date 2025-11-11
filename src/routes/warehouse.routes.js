// ===================================================================
// PROSPERPOS - RUTAS DE BODEGAS
// ===================================================================

const express = require('express');
const router = express.Router();
const WarehouseController = require('../controllers/warehouse.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

// Middleware global de autenticación
router.use(authenticateToken);

/**
 * @route   GET /api/v1/warehouses
 * @desc    Obtener todas las bodegas
 * @access  Private (warehouses.read)
 */
router.get('/',
  requirePermission('warehouses.read'),
  WarehouseController.getWarehouses
);

/**
 * @route   GET /api/v1/warehouses/active
 * @desc    Obtener bodegas activas
 * @access  Private (warehouses.read)
 */
router.get('/active',
  requirePermission('warehouses.read'),
  WarehouseController.getActiveWarehouses
);

/**
 * @route   GET /api/v1/warehouses/:id
 * @desc    Obtener bodega por ID
 * @access  Private (warehouses.read)
 */
router.get('/:id',
  requirePermission('warehouses.read'),
  WarehouseController.getWarehouse
);

/**
 * @route   POST /api/v1/warehouses
 * @desc    Crear nueva bodega
 * @access  Private (warehouses.create)
 */
router.post('/',
  requirePermission('warehouses.create'),
  WarehouseController.createWarehouse
);

/**
 * @route   PUT /api/v1/warehouses/:id
 * @desc    Actualizar bodega
 * @access  Private (warehouses.update)
 */
router.put('/:id',
  requirePermission('warehouses.update'),
  WarehouseController.updateWarehouse
);

/**
 * @route   DELETE /api/v1/warehouses/:id
 * @desc    Eliminar bodega (soft delete)
 * @access  Private (warehouses.delete)
 */
router.delete('/:id',
  requirePermission('warehouses.delete'),
  WarehouseController.deleteWarehouse
);

module.exports = router;
