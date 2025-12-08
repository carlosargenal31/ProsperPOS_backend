const express = require('express');
const router = express.Router();
const ShipmentController = require('../controllers/shipment.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// GET /api/shipments - Obtener todos los envíos
router.get('/', ShipmentController.getAll);

// GET /api/shipments/generate-number - Generar número de guía
router.get('/generate-number', ShipmentController.generateNumber);

// GET /api/shipments/statistics - Obtener estadísticas
router.get('/statistics', ShipmentController.getStatistics);

// GET /api/shipments/:id - Obtener envío por ID
router.get('/:id', ShipmentController.getById);

// POST /api/shipments - Crear nuevo envío
router.post('/', ShipmentController.create);

// POST /api/shipments/from-invoice/:invoiceId - Crear envío desde factura
router.post('/from-invoice/:invoiceId', ShipmentController.createFromInvoice);

// PUT /api/shipments/:id - Actualizar envío
router.put('/:id', ShipmentController.update);

// PATCH /api/shipments/:id/status - Actualizar solo el estado
router.patch('/:id/status', ShipmentController.updateStatus);

// DELETE /api/shipments/:id - Eliminar envío
router.delete('/:id', ShipmentController.delete);

module.exports = router;
