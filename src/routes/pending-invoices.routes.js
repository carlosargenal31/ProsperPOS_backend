// ===================================================================
// PROSPERPOS - RUTAS DE FACTURAS EN ESPERA
// ===================================================================

const express = require('express');
const router = express.Router();
const PendingInvoicesController = require('../controllers/pending-invoices.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// POST /api/v1/pending-invoices - Crear factura en espera
router.post('/', PendingInvoicesController.create);

// GET /api/v1/pending-invoices - Obtener todas las facturas en espera
router.get('/', PendingInvoicesController.getAll);

// GET /api/v1/pending-invoices/:id - Obtener una factura en espera por ID
router.get('/:id', PendingInvoicesController.getById);

// PUT /api/v1/pending-invoices/:id - Actualizar factura en espera
router.put('/:id', PendingInvoicesController.update);

// DELETE /api/v1/pending-invoices/:id - Eliminar factura en espera
router.delete('/:id', PendingInvoicesController.delete);

module.exports = router;
