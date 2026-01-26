// ===================================================================
// PROSPERPOS - RUTAS DE BANNERS
// ===================================================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const BannerService = require('../services/banner.service');
const { authenticateToken } = require('../middleware/auth.middleware');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Configurar multer para manejar archivos en memoria (copiado de brands)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB para banners
  },
  fileFilter: (req, file, cb) => {
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes'));
    }
  }
});

/**
 * @route   GET /api/v1/banners/active
 * @desc    Obtener banners activos (público para e-commerce)
 * @access  Public
 */
router.get('/active', async (req, res) => {
  try {
    const result = await BannerService.getActiveBanners();
    return res.json(result);
  } catch (error) {
    logger.error('Error getting active banners:', error);
    return sendErrorResponse(res, 500, 'Error al obtener banners activos');
  }
});

// Middleware de autenticación para las rutas protegidas
router.use(authenticateToken);

/**
 * @route   GET /api/v1/banners
 * @desc    Obtener todos los banners
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const result = await BannerService.getAllBanners();
    return res.json(result);
  } catch (error) {
    logger.error('Error getting banners:', error);
    return sendErrorResponse(res, 500, 'Error al obtener banners');
  }
});

/**
 * @route   POST /api/v1/banners/:id/image
 * @desc    Subir imagen de banner (COPIADO DE BRANDS)
 * @access  Private
 */
router.post('/:id/image',
  upload.single('image'),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return sendErrorResponse(res, 400, 'No se proporcionó ninguna imagen');
      }

      const result = await BannerService.uploadBannerImage(
        id,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      return sendSuccessResponse(res, result, 'Imagen subida exitosamente');

    } catch (error) {
      logger.error('Error uploading banner image:', error);
      return sendErrorResponse(res, 500, error.message || 'Error al subir imagen');
    }
  }
);

/**
 * @route   DELETE /api/v1/banners/:id/image
 * @desc    Eliminar imagen de banner (COPIADO DE BRANDS)
 * @access  Private
 */
router.delete('/:id/image', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await BannerService.deleteBannerImage(id);

    return sendSuccessResponse(res, result, 'Imagen eliminada exitosamente');

  } catch (error) {
    logger.error('Error deleting banner image:', error);
    return sendErrorResponse(res, 500, 'Error al eliminar imagen');
  }
});

/**
 * @route   PUT /api/v1/banners
 * @desc    Actualizar configuración de banners (títulos, enlaces, etc.)
 * @access  Private
 */
router.put('/', async (req, res) => {
  try {
    const { banners } = req.body;

    if (!banners || !Array.isArray(banners)) {
      return sendErrorResponse(res, 400, 'Se requiere un array de banners');
    }

    const result = await BannerService.updateBannersConfiguration(banners);

    return sendSuccessResponse(res, result, 'Configuración actualizada exitosamente');

  } catch (error) {
    logger.error('Error updating banners configuration:', error);
    return sendErrorResponse(res, 500, 'Error al actualizar configuración');
  }
});

module.exports = router;
