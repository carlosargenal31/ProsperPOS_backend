// ===================================================================
// PROSPERPOS - RUTAS DE EMPLEADOS (RH)
// ===================================================================

const express = require('express');
const router = express.Router();
const EmployeeController = require('../controllers/employee.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Rutas de empleados
router.get('/', requirePermission('employees.read'), EmployeeController.getEmployees);
router.get('/active', requirePermission('employees.read'), EmployeeController.getActiveEmployees);
router.get('/:id', requirePermission('employees.read'), EmployeeController.getEmployee);
router.post('/', requirePermission('employees.create'), EmployeeController.createEmployee);
router.put('/:id', requirePermission('employees.update'), EmployeeController.updateEmployee);
router.delete('/:id', requirePermission('employees.delete'), EmployeeController.deleteEmployee);

module.exports = router;
