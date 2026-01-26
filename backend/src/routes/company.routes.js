/**
 * Company Routes
 * Rutas para gestión de empresas
 */

const express = require('express');
const router = express.Router();
const CompanyController = require('../controllers/company.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/v1/companies/public/default
 * @desc    Obtener empresa por defecto (público para ecommerce)
 * @access  Public
 */
router.get('/public/default', CompanyController.getDefaultCompany);

// Todas las rutas requieren autenticación a partir de aquí
router.use(authenticateToken);

/**
 * @route   GET /api/v1/companies
 * @desc    Obtener todas las empresas
 * @access  Private (requiere permiso settings.access)
 */
router.get(
  '/',
  requirePermission('settings.access'),
  CompanyController.getAllCompanies
);

/**
 * @route   GET /api/v1/companies/default
 * @desc    Obtener empresa por defecto
 * @access  Private
 */
router.get(
  '/default',
  CompanyController.getDefaultCompany
);

/**
 * @route   GET /api/v1/companies/:id
 * @desc    Obtener empresa por ID
 * @access  Private (requiere permiso settings.access)
 */
router.get(
  '/:id',
  requirePermission('settings.access'),
  CompanyController.getCompanyById
);

/**
 * @route   POST /api/v1/companies
 * @desc    Crear nueva empresa
 * @access  Private (requiere permiso settings.access)
 */
router.post(
  '/',
  requirePermission('settings.access'),
  CompanyController.createCompany
);

/**
 * @route   PUT /api/v1/companies/:id
 * @desc    Actualizar empresa
 * @access  Private (requiere permiso settings.access)
 */
router.put(
  '/:id',
  requirePermission('settings.access'),
  CompanyController.updateCompany
);

/**
 * @route   DELETE /api/v1/companies/:id
 * @desc    Eliminar empresa
 * @access  Private (requiere permiso settings.access)
 */
router.delete(
  '/:id',
  requirePermission('settings.access'),
  CompanyController.deleteCompany
);

/**
 * @route   PUT /api/v1/companies/:id/set-default
 * @desc    Establecer empresa como defecto
 * @access  Private (requiere permiso settings.access)
 */
router.put(
  '/:id/set-default',
  requirePermission('settings.access'),
  CompanyController.setAsDefault
);

/**
 * @route   GET /api/v1/companies/ecommerce/config
 * @desc    Obtener configuración de e-commerce
 * @access  Private (requiere permiso settings.access)
 */
router.get(
  '/ecommerce/config',
  requirePermission('settings.access'),
  CompanyController.getEcommerceConfig
);

/**
 * @route   PUT /api/v1/companies/ecommerce/config
 * @desc    Actualizar configuración de e-commerce
 * @access  Private (requiere permiso settings.access)
 */
router.put(
  '/ecommerce/config',
  requirePermission('settings.access'),
  CompanyController.updateEcommerceConfig
);

module.exports = router;
