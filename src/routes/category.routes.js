// ===================================================================
// PROSPERPOS - RUTAS DE CATEGORÍAS (CORREGIDO)
// ===================================================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const CategoryService = require('../services/category.service');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');
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

// Middleware global de autenticación
router.use(authenticateToken);

/**
 * @route   GET /api/v1/categories
 * @desc    Obtener todas las categorías
 * @access  Private (categories.read)
 */
router.get('/', 
  requirePermission('categories.read'),
  async (req, res) => {
    try {
      const { search = '', is_active, parent_id } = req.query;
      
      const filters = {
        search,
        is_active: is_active === 'true' ? true : is_active === 'false' ? false : null,
        parent_id
      };

      const categories = await CategoryService.getCategories(filters);

      return sendSuccessResponse(res, categories, 'Categorías obtenidas exitosamente');
    } catch (error) {
      logger.error('Error getting categories:', error);
      return sendErrorResponse(res, 500, 'Error al obtener categorías');
    }
  }
);

/**
 * @route   GET /api/v1/categories/active
 * @desc    Obtener categorías activas
 * @access  Private (categories.read)
 */
router.get('/active',
  requirePermission('categories.read'),
  async (req, res) => {
    try {
      const categories = await CategoryService.getActiveCategories();
      return sendSuccessResponse(res, categories, 'Categorías activas obtenidas exitosamente');
    } catch (error) {
      logger.error('Error getting active categories:', error);
      return sendErrorResponse(res, 500, 'Error al obtener categorías activas');
    }
  }
);

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Obtener categoría por ID
 * @access  Private (categories.read)
 */
router.get('/:id',
  requirePermission('categories.read'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const category = await CategoryService.getCategoryById(id);

      if (!category) {
        return sendErrorResponse(res, 404, 'Categoría no encontrada');
      }

      return sendSuccessResponse(res, category, 'Categoría obtenida exitosamente');
    } catch (error) {
      logger.error('Error getting category:', error);
      return sendErrorResponse(res, 500, 'Error al obtener categoría');
    }
  }
);

/**
 * @route   POST /api/v1/categories
 * @desc    Crear nueva categoría
 * @access  Private (categories.create)
 */
router.post('/',
  requirePermission('categories.create'),
  async (req, res) => {
    try {
      const categoryData = {
        ...req.body,
        created_by: req.user.id
      };

      // Validación básica
      if (!categoryData.name || categoryData.name.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre de la categoría es requerido');
      }

      const category = await CategoryService.createCategory(categoryData);

      return sendSuccessResponse(res, category, 'Categoría creada exitosamente', 201);

    } catch (error) {
      logger.error('Error creating category:', error);
      
      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }
      
      return sendErrorResponse(res, 500, 'Error al crear categoría');
    }
  }
);

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Actualizar categoría
 * @access  Private (categories.update)
 */
router.put('/:id',
  requirePermission('categories.update'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const categoryData = {
        ...req.body,
        updated_by: req.user.id
      };

      // Validación básica
      if (!categoryData.name || categoryData.name.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre de la categoría es requerido');
      }

      const category = await CategoryService.updateCategory(id, categoryData);

      return sendSuccessResponse(res, category, 'Categoría actualizada exitosamente');

    } catch (error) {
      logger.error('Error updating category:', error);
      
      if (error.message.includes('no encontrada')) {
        return sendErrorResponse(res, 404, error.message);
      }
      
      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }
      
      if (error.message.includes('propio padre')) {
        return sendErrorResponse(res, 400, error.message);
      }
      
      return sendErrorResponse(res, 500, 'Error al actualizar categoría');
    }
  }
);

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Eliminar categoría (soft delete)
 * @access  Private (categories.delete)
 */
router.delete('/:id',
  requirePermission('categories.delete'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const deleted_by = req.user.id;

      await CategoryService.deleteCategory(id, deleted_by);

      return sendSuccessResponse(res, null, 'Categoría eliminada exitosamente');

    } catch (error) {
      logger.error('Error deleting category:', error);
      
      if (error.message.includes('no encontrada')) {
        return sendErrorResponse(res, 404, error.message);
      }
      
      if (error.message.includes('No se puede eliminar')) {
        return sendErrorResponse(res, 409, error.message);
      }
      
      return sendErrorResponse(res, 500, 'Error al eliminar categoría');
    }
  }
);

/**
 * @route   GET /api/v1/categories/:id/subcategories
 * @desc    Obtener subcategorías de una categoría
 * @access  Private (categories.read)
 */
router.get('/:id/subcategories',
  requirePermission('categories.read'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const subcategories = await CategoryService.getSubcategories(id);

      return sendSuccessResponse(res, subcategories, 'Subcategorías obtenidas exitosamente');
    } catch (error) {
      logger.error('Error getting subcategories:', error);
      return sendErrorResponse(res, 500, 'Error al obtener subcategorías');
    }
  }
);

/**
 * @route   POST /api/v1/categories/:id/image
 * @desc    Subir imagen de categoría
 * @access  Private (categories.update)
 */
router.post('/:id/image',
  requirePermission('categories.update'),
  upload.single('image'),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return sendErrorResponse(res, 400, 'No se proporcionó ninguna imagen');
      }

      const result = await CategoryService.uploadCategoryImage(
        id,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      return sendSuccessResponse(res, result, 'Imagen subida exitosamente');

    } catch (error) {
      logger.error('Error uploading category image:', error);
      return sendErrorResponse(res, 500, error.message || 'Error al subir imagen');
    }
  }
);

/**
 * @route   DELETE /api/v1/categories/:id/image
 * @desc    Eliminar imagen de categoría
 * @access  Private (categories.update)
 */
router.delete('/:id/image',
  requirePermission('categories.update'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await CategoryService.deleteCategoryImage(id);

      return sendSuccessResponse(res, result, 'Imagen eliminada exitosamente');

    } catch (error) {
      logger.error('Error deleting category image:', error);
      return sendErrorResponse(res, 500, 'Error al eliminar imagen');
    }
  }
);

module.exports = router;