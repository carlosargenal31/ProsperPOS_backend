// ===================================================================
// PROSPERPOS - RUTAS DE PRODUCTOS VENDIDOS
// ===================================================================

const express = require('express');
const router = express.Router();
const SoldItemsController = require('../controllers/sold-items.controller');

// Ruta principal: Obtener productos vendidos
router.get('/', SoldItemsController.getSoldItems);

// Exportar productos vendidos
router.get('/export', SoldItemsController.exportSoldItems);

// Obtener listas para filtros
router.get('/products', SoldItemsController.getProducts);
router.get('/groups', SoldItemsController.getGroups);
router.get('/subgroups', SoldItemsController.getSubgroups);

module.exports = router;
