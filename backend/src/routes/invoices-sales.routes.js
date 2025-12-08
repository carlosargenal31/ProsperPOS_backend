// ===================================================================
// PROSPERPOS - RUTAS DE FACTURAS DE VENTAS
// ===================================================================

const express = require('express');
const router = express.Router();
const InvoicesSalesController = require('../controllers/invoices-sales.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener todas las facturas con paginación y filtros
router.get('/', InvoicesSalesController.getAll);

// Obtener estadísticas
router.get('/stats', InvoicesSalesController.getStats);

// Obtener factura por ID
router.get('/:id', InvoicesSalesController.getById);

// Obtener factura por número
router.get('/number/:invoice_number', InvoicesSalesController.getByInvoiceNumber);

module.exports = router;
