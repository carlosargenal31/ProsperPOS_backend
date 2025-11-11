// ===================================================================
// PROSPERPOS - RUTAS DE SUCURSALES
// ===================================================================

const express = require('express');
const router = express.Router();
const BranchController = require('../controllers/branch.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Rutas de sucursales
router.get('/', requirePermission('branches.read'), BranchController.getBranches);
router.get('/active', requirePermission('branches.read'), BranchController.getActiveBranches);
router.get('/:id', requirePermission('branches.read'), BranchController.getBranch);
router.post('/', requirePermission('branches.create'), BranchController.createBranch);
router.put('/:id', requirePermission('branches.update'), BranchController.updateBranch);
router.delete('/:id', requirePermission('branches.delete'), BranchController.deleteBranch);

module.exports = router;
