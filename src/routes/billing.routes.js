/**
 * Billing Routes
 * API endpoints for billing and invoice management
 */

const express = require('express');
const router = express.Router();
const BillingController = require('../controllers/billing.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

// Apply authentication to all routes
router.use(authenticateToken);

// Dashboard and statistics
router.get(
  '/dashboard',
  requirePermission('billing.access'),
  BillingController.getDashboard
);

router.get(
  '/statistics',
  requirePermission('billing.access'),
  BillingController.getStatistics
);

router.get(
  '/aging-report',
  requirePermission('billing.access'),
  BillingController.getAgingReport
);

// Invoice CRUD operations
router.get(
  '/invoices',
  requirePermission('billing.invoices.view'),
  BillingController.getAllInvoices
);

router.get(
  '/invoices/:id',
  requirePermission('billing.invoices.view'),
  BillingController.getInvoiceById
);

router.post(
  '/invoices',
  requirePermission('billing.invoices.create'),
  BillingController.createInvoice
);

router.post(
  '/invoices/from-sale',
  requirePermission('billing.invoices.create'),
  BillingController.createInvoiceFromSale
);

router.put(
  '/invoices/:id',
  requirePermission('billing.invoices.update'),
  BillingController.updateInvoice
);

router.delete(
  '/invoices/:id',
  requirePermission('billing.invoices.delete'),
  BillingController.deleteInvoice
);

// Invoice printing
router.get(
  '/invoices/:id/print',
  requirePermission('billing.invoices.print'),
  BillingController.getInvoiceForPrint
);

// Payment operations
router.post(
  '/invoices/:id/payment',
  requirePermission('billing.payments.record'),
  BillingController.recordPayment
);

router.get(
  '/outstanding',
  requirePermission('billing.invoices.view'),
  BillingController.getOutstandingInvoices
);

// Credit notes
router.post(
  '/credit-notes',
  requirePermission('billing.credit_notes.create'),
  BillingController.createCreditNote
);

// System operations
router.post(
  '/update-overdue',
  requirePermission('billing.access'),
  BillingController.updateOverdue
);

// Settings
router.get(
  '/settings',
  requirePermission('billing.settings.manage'),
  BillingController.getSettings
);

router.put(
  '/settings',
  requirePermission('billing.settings.manage'),
  BillingController.updateSettings
);

module.exports = router;
