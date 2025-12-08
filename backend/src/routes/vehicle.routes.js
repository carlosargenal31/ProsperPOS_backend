// ===================================================================
// PROSPERPOS - RUTAS DE VEHÍCULOS
// ===================================================================

const express = require('express');
const router = express.Router();
const VehicleController = require('../controllers/vehicle.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Rutas de vehículos
router.get('/', requirePermission('vehicles.read'), VehicleController.getVehicles);
router.get('/active', requirePermission('vehicles.read'), VehicleController.getActiveVehicles);
router.get('/:id', requirePermission('vehicles.read'), VehicleController.getVehicleById);
router.post('/', requirePermission('vehicles.create'), VehicleController.createVehicle);
router.put('/:id', requirePermission('vehicles.update'), VehicleController.updateVehicle);
router.delete('/:id', requirePermission('vehicles.delete'), VehicleController.deleteVehicle);

module.exports = router;
