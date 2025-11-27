// ===================================================================
// PROSPERPOS - RUTAS DE DEVOLUCIONES DE VENTAS
// ===================================================================

const express = require('express');
const router = express.Router();
const SalesReturnsController = require('../controllers/sales-returns.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// POST /api/v1/sales-returns - Procesar devolución
router.post('/', SalesReturnsController.processReturn);

// GET /api/v1/sales-returns - Obtener todas las devoluciones
router.get('/', SalesReturnsController.getAll);

// GET /api/v1/sales-returns/:id - Obtener una devolución por ID
router.get('/:id', SalesReturnsController.getById);

module.exports = router;
