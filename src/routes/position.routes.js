// ===================================================================
// PROSPERPOS - RUTAS DE CARGOS/PUESTOS (RH)
// ===================================================================

const express = require('express');
const router = express.Router();
const PositionController = require('../controllers/position.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Rutas de cargos
router.get('/', requirePermission('positions.read'), PositionController.getPositions);
router.get('/active', requirePermission('positions.read'), PositionController.getActivePositions);
router.get('/department/:departmentId', requirePermission('positions.read'), PositionController.getPositionsByDepartment);
router.get('/:id', requirePermission('positions.read'), PositionController.getPosition);
router.post('/', requirePermission('positions.create'), PositionController.createPosition);
router.put('/:id', requirePermission('positions.update'), PositionController.updatePosition);
router.delete('/:id', requirePermission('positions.delete'), PositionController.deletePosition);

module.exports = router;
