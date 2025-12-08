// ===================================================================
// PROSPERPOS - RUTAS DE CONSECUTIVOS
// ===================================================================

const express = require('express');
const router = express.Router();
const ConsecutiveController = require('../controllers/consecutive.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * @route   GET /api/v1/consecutives
 * @desc    Obtener todos los consecutivos
 * @access  Private
 */
router.get('/', ConsecutiveController.getAll);

/**
 * @route   GET /api/v1/consecutives/:type
 * @desc    Obtener consecutivo por tipo
 * @access  Private
 */
router.get('/:type', ConsecutiveController.getByType);

/**
 * @route   POST /api/v1/consecutives/:type/increment
 * @desc    Incrementar consecutivo
 * @access  Private
 */
router.post('/:type/increment', ConsecutiveController.increment);

/**
 * @route   PUT /api/v1/consecutives/:type
 * @desc    Actualizar consecutivo manualmente
 * @access  Private
 */
router.put('/:type', ConsecutiveController.update);

module.exports = router;
