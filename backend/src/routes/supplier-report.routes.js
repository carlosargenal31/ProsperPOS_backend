// ===================================================================
// PROSPERPOS - RUTAS DE REPORTE DE PROVEEDORES
// ===================================================================

const express = require('express');
const router = express.Router();
const SupplierReportController = require('../controllers/supplier-report.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

/**
 * @route GET /api/supplier-reports/purchases-by-supplier
 * @desc Obtener reporte de compras agrupadas por proveedor
 * @access Private
 * @query {string} date_from - Fecha desde (YYYY-MM-DD)
 * @query {string} date_to - Fecha hasta (YYYY-MM-DD)
 * @query {string} supplier_id - ID o nombre del proveedor (opcional)
 * @query {string} agency - Agencia (opcional)
 * @query {string} document_type - Tipo de documento (opcional)
 * @query {string} status - Estado de la compra (opcional)
 */
router.get(
  '/purchases-by-supplier',
  SupplierReportController.getPurchasesBySupplier
);

/**
 * @route GET /api/supplier-reports/supplier-detail/:supplier_name
 * @desc Obtener detalle de compras de un proveedor específico
 * @access Private
 * @param {string} supplier_name - Nombre del proveedor
 * @query {string} date_from - Fecha desde (YYYY-MM-DD)
 * @query {string} date_to - Fecha hasta (YYYY-MM-DD)
 * @query {string} document_type - Tipo de documento (opcional)
 * @query {string} status - Estado de la compra (opcional)
 */
router.get(
  '/supplier-detail/:supplier_name',
  SupplierReportController.getSupplierPurchasesDetail
);

/**
 * @route GET /api/supplier-reports/suppliers-list
 * @desc Obtener lista de proveedores para filtros
 * @access Private
 */
router.get(
  '/suppliers-list',
  SupplierReportController.getSuppliersList
);

/**
 * @route GET /api/supplier-reports/top-suppliers
 * @desc Obtener top proveedores por monto de compras
 * @access Private
 * @query {string} date_from - Fecha desde (YYYY-MM-DD)
 * @query {string} date_to - Fecha hasta (YYYY-MM-DD)
 * @query {number} limit - Límite de resultados (default: 10)
 */
router.get(
  '/top-suppliers',
  SupplierReportController.getTopSuppliers
);

/**
 * @route GET /api/supplier-reports/purchases-by-period
 * @desc Obtener estadísticas de compras por periodo
 * @access Private
 * @query {string} date_from - Fecha desde (YYYY-MM-DD)
 * @query {string} date_to - Fecha hasta (YYYY-MM-DD)
 * @query {string} period - Periodo de agrupación: day, week, month, year (default: month)
 * @query {string} supplier_id - ID o nombre del proveedor (opcional)
 */
router.get(
  '/purchases-by-period',
  SupplierReportController.getPurchasesByPeriod
);

/**
 * @route GET /api/supplier-reports/company-info
 * @desc Obtener información de la empresa para encabezado de reportes
 * @access Private
 */
router.get(
  '/company-info',
  SupplierReportController.getCompanyInfo
);

module.exports = router;
