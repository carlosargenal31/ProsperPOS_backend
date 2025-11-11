// ===================================================================
// PROSPERPOS - RUTAS DE MARCAS (FINAL)
// ===================================================================

const express = require('express');
const router = express.Router();
const BrandController = require('../controllers/brand.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

// Middleware global de autenticación
router.use(authenticateToken);

/**
 * @route   GET /api/v1/brands
 * @desc    Obtener todas las marcas
 * @access  Private (brands.read)
 */
router.get('/', 
  requirePermission('brands.read'),
  BrandController.getBrands
);

/**
 * @route   GET /api/v1/brands/active
 * @desc    Obtener marcas activas
 * @access  Private (brands.read)
 */
router.get('/active',
  requirePermission('brands.read'),
  BrandController.getActiveBrands
);

/**
 * @route   GET /api/v1/brands/:id
 * @desc    Obtener marca por ID
 * @access  Private (brands.read)
 */
router.get('/:id',
  requirePermission('brands.read'),
  BrandController.getBrand
);

/**
 * @route   POST /api/v1/brands
 * @desc    Crear nueva marca
 * @access  Private (brands.create)
 */
router.post('/',
  requirePermission('brands.create'),
  BrandController.createBrand
);

/**
 * @route   PUT /api/v1/brands/:id
 * @desc    Actualizar marca
 * @access  Private (brands.update)
 */
router.put('/:id',
  requirePermission('brands.update'),
  BrandController.updateBrand
);

/**
 * @route   DELETE /api/v1/brands/:id
 * @desc    Eliminar marca (soft delete)
 * @access  Private (brands.delete)
 */
router.delete('/:id',
  requirePermission('brands.delete'),
  BrandController.deleteBrand
);

module.exports = router;