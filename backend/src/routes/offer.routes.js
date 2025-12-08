// ===================================================================
// PROSPERPOS - RUTAS DE OFERTAS
// ===================================================================

const express = require('express');
const router = express.Router();
const OfferController = require('../controllers/offer.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

// Middleware global de autenticación
router.use(authenticateToken);

/**
 * @route   GET /api/v1/offers
 * @desc    Obtener todas las ofertas
 * @access  Private
 */
router.get('/', OfferController.getOffers);

/**
 * @route   GET /api/v1/offers/active
 * @desc    Obtener ofertas activas
 * @access  Private
 */
router.get('/active', OfferController.getActiveOffers);

/**
 * @route   GET /api/v1/offers/next-code
 * @desc    Obtener el siguiente código disponible
 * @access  Private
 */
router.get('/next-code', OfferController.getNextCode);

/**
 * @route   GET /api/v1/offers/:id
 * @desc    Obtener oferta por ID
 * @access  Private
 */
router.get('/:id', OfferController.getOffer);

/**
 * @route   POST /api/v1/offers
 * @desc    Crear nueva oferta
 * @access  Private
 */
router.post('/', OfferController.createOffer);

/**
 * @route   PUT /api/v1/offers/:id
 * @desc    Actualizar oferta
 * @access  Private
 */
router.put('/:id', OfferController.updateOffer);

/**
 * @route   DELETE /api/v1/offers/:id
 * @desc    Eliminar oferta (soft delete)
 * @access  Private
 */
router.delete('/:id', OfferController.deleteOffer);

/**
 * @route   POST /api/v1/offers/:id/validate
 * @desc    Validar si una oferta es aplicable
 * @access  Private
 */
router.post('/:id/validate', OfferController.validateOffer);

/**
 * @route   POST /api/v1/offers/:id/calculate
 * @desc    Calcular descuento de oferta
 * @access  Private
 */
router.post('/:id/calculate', OfferController.calculateDiscount);

module.exports = router;
