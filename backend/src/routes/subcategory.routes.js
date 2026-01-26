// ===================================================================
// PROSPERPOS - RUTAS DE SUBCATEGORÍAS
// ===================================================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const SubcategoryController = require('../controllers/subcategory.controller');
const SubcategoryService = require('../services/subcategory.service');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');
const { validateSubcategory, validateSubcategoryUpdate } = require('../middleware/validation.middleware');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Configurar multer para manejar archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes JPEG, PNG y WEBP'));
    }
  }
});

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

/**
 * POST /api/v1/subcategories/:id/image
 * Subir imagen de subcategoría
 */
router.post(
  '/:id/image',
  requirePermission('subcategory.update'),
  upload.single('image'),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return sendErrorResponse(res, 400, 'No se proporcionó ninguna imagen');
      }

      const result = await SubcategoryService.uploadSubcategoryImage(
        id,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      return sendSuccessResponse(res, result, 'Imagen subida exitosamente');

    } catch (error) {
      logger.error('Error uploading subcategory image:', error);
      return sendErrorResponse(res, 500, error.message || 'Error al subir imagen');
    }
  }
);

/**
 * DELETE /api/v1/subcategories/:id/image
 * Eliminar imagen de subcategoría
 */
router.delete(
  '/:id/image',
  requirePermission('subcategory.update'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await SubcategoryService.deleteSubcategoryImage(id);

      return sendSuccessResponse(res, result, 'Imagen eliminada exitosamente');

    } catch (error) {
      logger.error('Error deleting subcategory image:', error);
      return sendErrorResponse(res, 500, 'Error al eliminar imagen');
    }
  }
);

module.exports = router;
