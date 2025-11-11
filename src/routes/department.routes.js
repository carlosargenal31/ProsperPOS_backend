// ===================================================================
// PROSPERPOS - RUTAS DE DEPARTAMENTOS (RH)
// ===================================================================

const express = require('express');
const router = express.Router();
const DepartmentController = require('../controllers/department.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Rutas de departamentos
router.get('/', requirePermission('departments.read'), DepartmentController.getDepartments);
router.get('/active', requirePermission('departments.read'), DepartmentController.getActiveDepartments);
router.get('/:id', requirePermission('departments.read'), DepartmentController.getDepartment);
router.post('/', requirePermission('departments.create'), DepartmentController.createDepartment);
router.put('/:id', requirePermission('departments.update'), DepartmentController.updateDepartment);
router.delete('/:id', requirePermission('departments.delete'), DepartmentController.deleteDepartment);

module.exports = router;
