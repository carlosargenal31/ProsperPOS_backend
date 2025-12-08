// ===================================================================
// PROSPERPOS - RUTAS DE CUENTAS BANCARIAS
// ===================================================================

const express = require('express');
const router = express.Router();
const BankAccountController = require('../controllers/bankAccount.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

// Middleware global de autenticación
router.use(authenticateToken);

/**
 * @route   GET /api/v1/bank-accounts
 * @desc    Obtener todas las cuentas bancarias
 * @access  Private (bank_accounts.read)
 */
router.get('/',
  requirePermission('bank_accounts.read'),
  BankAccountController.getBankAccounts
);

/**
 * @route   GET /api/v1/bank-accounts/active
 * @desc    Obtener cuentas bancarias activas
 * @access  Private (bank_accounts.read)
 */
router.get('/active',
  requirePermission('bank_accounts.read'),
  BankAccountController.getActiveBankAccounts
);

/**
 * @route   GET /api/v1/bank-accounts/:id
 * @desc    Obtener cuenta bancaria por ID
 * @access  Private (bank_accounts.read)
 */
router.get('/:id',
  requirePermission('bank_accounts.read'),
  BankAccountController.getBankAccount
);

/**
 * @route   POST /api/v1/bank-accounts
 * @desc    Crear nueva cuenta bancaria
 * @access  Private (bank_accounts.create)
 */
router.post('/',
  requirePermission('bank_accounts.create'),
  BankAccountController.createBankAccount
);

/**
 * @route   PUT /api/v1/bank-accounts/:id
 * @desc    Actualizar cuenta bancaria
 * @access  Private (bank_accounts.update)
 */
router.put('/:id',
  requirePermission('bank_accounts.update'),
  BankAccountController.updateBankAccount
);

/**
 * @route   DELETE /api/v1/bank-accounts/:id
 * @desc    Eliminar cuenta bancaria (soft delete)
 * @access  Private (bank_accounts.delete)
 */
router.delete('/:id',
  requirePermission('bank_accounts.delete'),
  BankAccountController.deleteBankAccount
);

module.exports = router;
