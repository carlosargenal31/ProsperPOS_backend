// ===================================================================
// PROSPERPOS - RUTAS DE UNIDADES
// ===================================================================

const express = require('express');
const router = express.Router();
const UnitController = require('../controllers/unit.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Rutas de unidades
router.get('/', UnitController.getUnits);
router.get('/active', UnitController.getActiveUnits);
router.get('/:id', UnitController.getUnitById);
router.post('/', UnitController.createUnit);
router.put('/:id', UnitController.updateUnit);
router.delete('/:id', UnitController.deleteUnit);

module.exports = router;
