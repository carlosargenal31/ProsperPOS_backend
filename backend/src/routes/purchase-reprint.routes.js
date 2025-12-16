// ===================================================================
// PROSPERPOS - RUTAS DE REIMPRESIONES DE COMPRAS
// ===================================================================

const express = require('express');
const router = express.Router();
const PurchaseReprintController = require('../controllers/purchase-reprint.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/v1/purchase-reprint/search - Buscar documentos de compras para reimpresión
router.get('/search', PurchaseReprintController.searchDocuments);

// GET /api/v1/purchase-reprint/:documentType/:documentId - Obtener detalles de documento
router.get('/:documentType/:documentId', PurchaseReprintController.getDocumentDetails);

module.exports = router;
