// ===================================================================
// PROSPERPOS - RUTAS DE DEVOLUCIONES DE COMPRAS
// ===================================================================

const express = require('express');
const router = express.Router();
const PurchaseReturnController = require('../controllers/purchase-return.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// POST /api/v1/purchase-returns - Procesar devolución de compra
router.post('/', PurchaseReturnController.processReturn);

// GET /api/v1/purchase-returns - Obtener todas las devoluciones
router.get('/', PurchaseReturnController.getAll);

// GET /api/v1/purchase-returns/pending-credit-notes - Obtener devoluciones pendientes de NC
router.get('/pending-credit-notes', PurchaseReturnController.getPendingCreditNotes);

// GET /api/v1/purchase-returns/:id - Obtener una devolución por ID
router.get('/:id', PurchaseReturnController.getById);

// PUT /api/v1/purchase-returns/:id - Actualizar una devolución
router.put('/:id', PurchaseReturnController.update);

// DELETE /api/v1/purchase-returns/:id - Eliminar una devolución
router.delete('/:id', PurchaseReturnController.delete);

// POST /api/v1/purchase-returns/:id/credit-note - Registrar NC del proveedor
router.post('/:id/credit-note', PurchaseReturnController.registerCreditNote);

module.exports = router;
