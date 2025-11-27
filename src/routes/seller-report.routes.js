/**
 * Seller Report Routes
 * API endpoints for sales by seller reports
 */

const express = require('express');
const router = express.Router();
const SellerReportController = require('../controllers/seller-report.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Apply authentication to all routes
router.use(authenticateToken);

// Get sales by seller report
router.get('/sales-by-seller', SellerReportController.getSalesBySeller);

// Get list of sellers for filter
router.get('/sellers', SellerReportController.getSellers);

// Get company info for report header
router.get('/company-info', SellerReportController.getCompanyInfo);

module.exports = router;
