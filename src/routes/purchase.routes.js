/**
 * Purchase Routes
 * API endpoints for purchase operations
 */

const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchase.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// Get all purchases
router.get('/', purchaseController.getAll);

// Get Purchase Book Report (Libro de Compras)
router.get('/reports/purchase-book', purchaseController.getPurchaseBookReport);

// Get Supplier Statement
router.get('/reports/supplier-statement/:supplierId', purchaseController.getSupplierStatement);

// Get purchase by ID
router.get('/:id', purchaseController.getById);

// Create new purchase
router.post('/', purchaseController.create);

// Update purchase
router.put('/:id', purchaseController.update);

// Delete purchase
router.delete('/:id', purchaseController.delete);

module.exports = router;
