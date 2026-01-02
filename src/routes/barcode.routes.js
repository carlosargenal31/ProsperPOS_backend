// ===================================================================
// PROSPERPOS - RUTAS DE CÓDIGOS DE BARRA
// ===================================================================

const express = require('express');
const router = express.Router();
const BarcodeController = require('../controllers/barcode.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Obtener productos para códigos de barra
router.get('/products', BarcodeController.getProductsForBarcodes);

// Generar PDF con códigos de barra
router.post('/generate-pdf', BarcodeController.generateBarcodePDF);

// Obtener categorías
router.get('/categories', BarcodeController.getCategories);

// Obtener subcategorías
router.get('/subcategories', BarcodeController.getSubcategories);

module.exports = router;
