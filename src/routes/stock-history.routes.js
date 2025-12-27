// ===================================================================
// PROSPERPOS - RUTAS DE HISTORIAL DE EXISTENCIAS
// ===================================================================

const express = require('express');
const router = express.Router();
const StockHistoryController = require('../controllers/stock-history.controller');

// Ruta principal: Obtener historial de existencias
router.get('/', StockHistoryController.getStockHistory);

// Exportar historial de existencias
router.get('/export', StockHistoryController.exportStockHistory);

// Obtener listas para filtros
router.get('/categories', StockHistoryController.getCategories);
router.get('/subcategories', StockHistoryController.getSubcategories);
router.get('/products', StockHistoryController.getProducts);
router.get('/warehouses', StockHistoryController.getWarehouses);

module.exports = router;
