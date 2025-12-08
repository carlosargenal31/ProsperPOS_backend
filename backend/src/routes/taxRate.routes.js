// ===================================================================
// PROSPERPOS - RUTAS DE TASAS DE IMPUESTO
// ===================================================================

const express = require('express');
const router = express.Router();
const TaxRateController = require('../controllers/taxRate.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

// Middleware global de autenticación
router.use(authenticateToken);

/**
 * @route   GET /api/v1/tax-rates
 * @desc    Obtener todas las tasas de impuesto
 * @access  Private (tax_rates.read)
 */
router.get('/',
  requirePermission('tax_rates.read'),
  TaxRateController.getTaxRates
);

/**
 * @route   GET /api/v1/tax-rates/active
 * @desc    Obtener tasas activas
 * @access  Private (tax_rates.read)
 */
router.get('/active',
  requirePermission('tax_rates.read'),
  TaxRateController.getActiveTaxRates
);

/**
 * @route   GET /api/v1/tax-rates/default
 * @desc    Obtener tasa por defecto
 * @access  Private (tax_rates.read)
 */
router.get('/default',
  requirePermission('tax_rates.read'),
  TaxRateController.getDefaultTaxRate
);

/**
 * @route   GET /api/v1/tax-rates/:id
 * @desc    Obtener tasa de impuesto por ID
 * @access  Private (tax_rates.read)
 */
router.get('/:id',
  requirePermission('tax_rates.read'),
  TaxRateController.getTaxRate
);

/**
 * @route   POST /api/v1/tax-rates
 * @desc    Crear nueva tasa de impuesto
 * @access  Private (tax_rates.create)
 */
router.post('/',
  requirePermission('tax_rates.create'),
  TaxRateController.createTaxRate
);

/**
 * @route   PUT /api/v1/tax-rates/:id
 * @desc    Actualizar tasa de impuesto
 * @access  Private (tax_rates.update)
 */
router.put('/:id',
  requirePermission('tax_rates.update'),
  TaxRateController.updateTaxRate
);

/**
 * @route   DELETE /api/v1/tax-rates/:id
 * @desc    Eliminar tasa de impuesto (soft delete)
 * @access  Private (tax_rates.delete)
 */
router.delete('/:id',
  requirePermission('tax_rates.delete'),
  TaxRateController.deleteTaxRate
);

module.exports = router;
