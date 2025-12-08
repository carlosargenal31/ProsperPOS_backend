// ===================================================================
// PROSPERPOS - RUTAS DE SUBCATEGORÍAS
// ===================================================================

const express = require('express');
const router = express.Router();
const SubcategoryController = require('../controllers/subcategory.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');
const { validateSubcategory, validateSubcategoryUpdate } = require('../middleware/validation.middleware');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

/**
 * GET /api/v1/subcategories
 * Obtener todas las subcategorías con filtros opcionales
 * Query params: search, is_active, category_id
 */
router.get(
  '/',
  requirePermission('subcategory.view'),
  SubcategoryController.getSubcategories
);

/**
 * GET /api/v1/subcategories/active
 * Obtener subcategorías activas
 */
router.get(
  '/active',
  requirePermission('subcategory.view'),
  SubcategoryController.getSubcategories
);

/**
 * GET /api/v1/subcategories/:id
 * Obtener subcategoría por ID
 */
router.get(
  '/:id',
  requirePermission('subcategory.view'),
  SubcategoryController.getSubcategory
);

/**
 * GET /api/v1/subcategories/category/:categoryId
 * Obtener subcategorías por categoría padre
 */
router.get(
  '/category/:categoryId',
  requirePermission('subcategory.view'),
  SubcategoryController.getSubcategoriesByCategory
);

/**
 * POST /api/v1/subcategories
 * Crear nueva subcategoría
 */
router.post(
  '/',
  requirePermission('subcategory.create'),
  validateSubcategory,
  SubcategoryController.createSubcategory
);

/**
 * PUT /api/v1/subcategories/:id
 * Actualizar subcategoría
 */
router.put(
  '/:id',
  requirePermission('subcategory.update'),
  validateSubcategoryUpdate,
  SubcategoryController.updateSubcategory
);

/**
 * PATCH /api/v1/subcategories/:id/status
 * Cambiar estado de subcategoría
 */
router.patch(
  '/:id/status',
  requirePermission('subcategory.update'),
  SubcategoryController.toggleStatus
);

/**
 * DELETE /api/v1/subcategories/:id
 * Eliminar subcategoría (soft delete)
 */
router.delete(
  '/:id',
  requirePermission('subcategory.delete'),
  SubcategoryController.deleteSubcategory
);

module.exports = router;
