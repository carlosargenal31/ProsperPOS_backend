// ===================================================================
// PROSPERPOS - RUTAS DEL DASHBOARD
// ===================================================================

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * @route   GET /api/dashboard/stats
 * @desc    Obtener estad�sticas generales del dashboard
 * @access  Private
 * @query   date_from, date_to
 */
router.get('/stats', dashboardController.getStats);

/**
 * @route   GET /api/dashboard/sales-purchases-chart
 * @desc    Obtener datos para gr�fico de ventas y compras
 * @access  Private
 * @query   period (1D, 1S, 1M, 3M, 6M, 1A), date_from, date_to
 */
router.get('/sales-purchases-chart', dashboardController.getSalesAndPurchasesChart);

/**
 * @route   GET /api/dashboard/overall-info
 * @desc    Obtener informaci�n general (proveedores, clientes, pedidos)
 * @access  Private
 */
router.get('/overall-info', dashboardController.getOverallInfo);

/**
 * @route   GET /api/dashboard/top-selling-products
 * @desc    Obtener productos m�s vendidos
 * @access  Private
 * @query   limit, period (today, week, month)
 */
router.get('/top-selling-products', dashboardController.getTopSellingProducts);

/**
 * @route   GET /api/dashboard/low-stock-products
 * @desc    Obtener productos con bajo stock
 * @access  Private
 * @query   limit
 */
router.get('/low-stock-products', dashboardController.getLowStockProducts);

/**
 * @route   GET /api/dashboard/recent-sales
 * @desc    Obtener ventas recientes
 * @access  Private
 * @query   limit, period (today, week, month)
 */
router.get('/recent-sales', dashboardController.getRecentSales);

/**
 * @route   GET /api/dashboard/top-customers
 * @desc    Obtener mejores clientes
 * @access  Private
 * @query   limit
 */
router.get('/top-customers', dashboardController.getTopCustomers);

/**
 * @route   GET /api/dashboard/customers-overview
 * @desc    Obtener resumen de clientes (primera vez vs recurrentes)
 * @access  Private
 * @query   period (today, week, month)
 */
router.get('/customers-overview', dashboardController.getCustomersOverview);

/**
 * @route   GET /api/dashboard/category-stats
 * @desc    Obtener estad�sticas por categor�a
 * @access  Private
 * @query   period (today, week, month)
 */
router.get('/category-stats', dashboardController.getCategoryStats);

/**
 * @route   GET /api/dashboard/recent-transactions
 * @desc    Obtener transacciones recientes
 * @access  Private
 * @query   type (sales, purchases, quotations, expenses, invoices), limit
 */
router.get('/recent-transactions', dashboardController.getRecentTransactions);

/**
 * @route   GET /api/dashboard/top-categories
 * @desc    Obtener categorías más vendidas
 * @access  Private
 * @query   limit, period (today, week, month)
 */
router.get('/top-categories', dashboardController.getTopCategories);

module.exports = router;
