// ===================================================================
// PROSPERPOS - RUTAS DE ESTADO DE CUENTA COMPRAS
// ===================================================================

const express = require('express');
const router = express.Router();
const PurchaseStatementController = require('../controllers/purchase-statement.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/v1/purchase-statement - Obtener todos los documentos consolidados
router.get('/', PurchaseStatementController.getAllDocuments);

// GET /api/v1/purchase-statement/:type/:id - Obtener un documento específico con items
router.get('/:type/:id', PurchaseStatementController.getDocumentById);

module.exports = router;
