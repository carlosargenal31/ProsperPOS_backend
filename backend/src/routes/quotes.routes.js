// ===================================================================
// PROSPERPOS - RUTAS DE COTIZACIONES
// ===================================================================

const express = require('express');
const router = express.Router();
const QuotesController = require('../controllers/quotes.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// POST /api/v1/quotes - Crear cotización
router.post('/', QuotesController.create);

// GET /api/v1/quotes - Obtener todas las cotizaciones
router.get('/', QuotesController.getAll);

// GET /api/v1/quotes/:id - Obtener una cotización por ID
router.get('/:id', QuotesController.getById);

// PUT /api/v1/quotes/:id - Actualizar cotización
router.put('/:id', QuotesController.update);

// PATCH /api/v1/quotes/:id/status - Actualizar estado de cotización
router.patch('/:id/status', QuotesController.updateStatus);

// DELETE /api/v1/quotes/:id - Eliminar cotización
router.delete('/:id', QuotesController.delete);

module.exports = router;
