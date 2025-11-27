// ===================================================================
// PROSPERPOS - RUTAS DE CUPONES
// ===================================================================

const express = require('express');
const router = express.Router();
const CouponController = require('../controllers/coupon.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

// Middleware global de autenticación
router.use(authenticateToken);

/**
 * @route   GET /api/v1/coupons/next-code
 * @desc    Obtener el siguiente código de cupón
 * @access  Private
 */
router.get('/next-code', CouponController.getNextCode);

/**
 * @route   GET /api/v1/coupons
 * @desc    Obtener todos los cupones
 * @access  Private
 */
router.get('/', requirePermission('coupons.read'), CouponController.getCoupons);

/**
 * @route   GET /api/v1/coupons/:id
 * @desc    Obtener cupón por ID
 * @access  Private
 */
router.get('/:id', requirePermission('coupons.read'), CouponController.getCoupon);

/**
 * @route   POST /api/v1/coupons
 * @desc    Crear nuevo cupón
 * @access  Private
 */
router.post('/', requirePermission('coupons.create'), CouponController.createCoupon);

/**
 * @route   PUT /api/v1/coupons/:id
 * @desc    Actualizar cupón
 * @access  Private
 */
router.put('/:id', requirePermission('coupons.update'), CouponController.updateCoupon);

/**
 * @route   DELETE /api/v1/coupons/:id
 * @desc    Eliminar cupón (soft delete)
 * @access  Private
 */
router.delete('/:id', requirePermission('coupons.delete'), CouponController.deleteCoupon);

module.exports = router;
