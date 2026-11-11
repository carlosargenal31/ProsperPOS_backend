// ===================================================================
// PROSPERPOS - RUTAS DE MARCAS (FINAL)
// ===================================================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const BrandController = require('../controllers/brand.controller');
const BrandService = require('../services/brand.service');
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

/**
 * @route   POST /api/v1/brands/:id/logo
 * @desc    Subir logo de marca
 * @access  Private (brands.update)
 */
router.post('/:id/logo',
  requirePermission('brands.update'),
  upload.single('image'),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return sendErrorResponse(res, 400, 'No se proporcionó ninguna imagen');
      }

      const result = await BrandService.uploadBrandLogo(
        id,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      return sendSuccessResponse(res, result, 'Logo subido exitosamente');

    } catch (error) {
      logger.error('Error uploading brand logo:', error);
      return sendErrorResponse(res, 500, error.message || 'Error al subir logo');
    }
  }
);

/**
 * @route   DELETE /api/v1/brands/:id/logo
 * @desc    Eliminar logo de marca
 * @access  Private (brands.update)
 */
router.delete('/:id/logo',
  requirePermission('brands.update'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await BrandService.deleteBrandLogo(id);

      return sendSuccessResponse(res, result, 'Logo eliminado exitosamente');

    } catch (error) {
      logger.error('Error deleting brand logo:', error);
      return sendErrorResponse(res, 500, 'Error al eliminar logo');
    }
  }
);

module.exports = router;