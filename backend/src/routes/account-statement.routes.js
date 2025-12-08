// ===================================================================
// PROSPERPOS - RUTAS DE ESTADO DE CUENTA VENTAS
// ===================================================================

const express = require('express');
const router = express.Router();
const AccountStatementController = require('../controllers/account-statement.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/v1/account-statement - Obtener todos los documentos consolidados
router.get('/', AccountStatementController.getAllDocuments);

// GET /api/v1/account-statement/:type/:id - Obtener un documento específico con items
router.get('/:type/:id', AccountStatementController.getDocumentById);

module.exports = router;
