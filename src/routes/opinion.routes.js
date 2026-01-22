// ===================================================================
// PROSPERPOS - RUTAS DE OPINIONES DE CLIENTES
// ===================================================================

const express = require('express');
const router = express.Router();
const OpinionController = require('../controllers/opinion.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

// ===================================================================
// RUTAS PÚBLICAS (sin autenticación)
// ===================================================================

/**
 * @route   POST /api/v1/opinions
 * @desc    Crear nueva opinión (público - desde el formulario de contacto)
 * @access  Public
 */
router.post('/', OpinionController.create);

// ===================================================================
// RUTAS PRIVADAS (requieren autenticación de administrador)
// ===================================================================

// Middleware global de autenticación para las siguientes rutas
router.use(authenticateToken);

/**
 * @route   GET /api/v1/opinions/stats
 * @desc    Obtener estadísticas de opiniones
 * @access  Private (admin)
 */
router.get('/stats',
  requirePermission('opinions.read'),
  OpinionController.getStats
);

/**
 * @route   GET /api/v1/opinions
 * @desc    Obtener todas las opiniones (con filtros y paginación)
 * @access  Private (admin)
 */
router.get('/',
  requirePermission('opinions.read'),
  OpinionController.getAll
);

/**
 * @route   GET /api/v1/opinions/:id
 * @desc    Obtener opinión por ID
 * @access  Private (admin)
 */
router.get('/:id',
  requirePermission('opinions.read'),
  OpinionController.getById
);

/**
 * @route   POST /api/v1/opinions/:id/respond
 * @desc    Responder a una opinión
 * @access  Private (admin)
 */
router.post('/:id/respond',
  requirePermission('opinions.update'),
  OpinionController.respond
);

/**
 * @route   PATCH /api/v1/opinions/:id/status
 * @desc    Actualizar estado de una opinión
 * @access  Private (admin)
 */
router.patch('/:id/status',
  requirePermission('opinions.update'),
  OpinionController.updateStatus
);

/**
 * @route   DELETE /api/v1/opinions/:id
 * @desc    Eliminar una opinión
 * @access  Private (admin)
 */
router.delete('/:id',
  requirePermission('opinions.delete'),
  OpinionController.delete
);

module.exports = router;
