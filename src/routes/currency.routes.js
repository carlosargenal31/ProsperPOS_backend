// ===================================================================
// PROSPERPOS - RUTAS DE MONEDAS
// ===================================================================

const express = require('express');
const router = express.Router();
const CurrencyController = require('../controllers/currency.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

// Middleware global de autenticación
router.use(authenticateToken);

/**
 * @route   GET /api/v1/currencies
 * @desc    Obtener todas las monedas
 * @access  Private (currencies.read)
 */
router.get('/',
  requirePermission('currencies.read'),
  CurrencyController.getCurrencies
);

/**
 * @route   GET /api/v1/currencies/active
 * @desc    Obtener monedas activas
 * @access  Private (currencies.read)
 */
router.get('/active',
  requirePermission('currencies.read'),
  CurrencyController.getActiveCurrencies
);

/**
 * @route   GET /api/v1/currencies/default
 * @desc    Obtener moneda por defecto
 * @access  Private (currencies.read)
 */
router.get('/default',
  requirePermission('currencies.read'),
  CurrencyController.getDefaultCurrency
);

/**
 * @route   GET /api/v1/currencies/:id
 * @desc    Obtener moneda por ID
 * @access  Private (currencies.read)
 */
router.get('/:id',
  requirePermission('currencies.read'),
  CurrencyController.getCurrency
);

/**
 * @route   POST /api/v1/currencies
 * @desc    Crear nueva moneda
 * @access  Private (currencies.create)
 */
router.post('/',
  requirePermission('currencies.create'),
  CurrencyController.createCurrency
);

/**
 * @route   PUT /api/v1/currencies/:id
 * @desc    Actualizar moneda
 * @access  Private (currencies.update)
 */
router.put('/:id',
  requirePermission('currencies.update'),
  CurrencyController.updateCurrency
);

/**
 * @route   DELETE /api/v1/currencies/:id
 * @desc    Eliminar moneda (soft delete)
 * @access  Private (currencies.delete)
 */
router.delete('/:id',
  requirePermission('currencies.delete'),
  CurrencyController.deleteCurrency
);

module.exports = router;
