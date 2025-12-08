// ===================================================================
// PROSPERPOS - RUTAS DE DEPARTAMENTOS
// ===================================================================

const express = require('express');
const router = express.Router();
const StateController = require('../controllers/state.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Rutas de departamentos
router.get('/', requirePermission('states.read'), StateController.getStates);
router.get('/active', requirePermission('states.read'), StateController.getActiveStates);
router.get('/:id', requirePermission('states.read'), StateController.getState);
router.post('/', requirePermission('states.create'), StateController.createState);
router.put('/:id', requirePermission('states.update'), StateController.updateState);
router.delete('/:id', requirePermission('states.delete'), StateController.deleteState);

module.exports = router;
