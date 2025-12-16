// ===================================================================
// PROSPERPOS - RUTAS DE REIMPRESIONES
// ===================================================================

const express = require('express');
const router = express.Router();
const ReprintController = require('../controllers/reprint.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/v1/reprint/search - Buscar documentos para reimpresión
router.get('/search', ReprintController.searchDocuments);

// GET /api/v1/reprint/:documentType/:documentId - Obtener detalles de documento
router.get('/:documentType/:documentId', ReprintController.getDocumentDetails);

module.exports = router;
