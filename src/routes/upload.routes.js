// ===================================================================
// PROSPERPOS - RUTAS DE UPLOAD A GOOGLE CLOUD STORAGE
// ===================================================================

const express = require('express');
const router = express.Router();
const UploadController = require('../controllers/upload.controller');
const upload = require('../middleware/upload.middleware');
const { authenticateToken } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// ===================================================================
// RUTAS DE PRODUCTOS
// ===================================================================

/**
 * @route   POST /api/upload/product
 * @desc    Subir imagen de producto
 * @access  Private
 * @body    productId, imageType (main, thumb)
 */
router.post('/product', upload.single('file'), UploadController.uploadProductImage);

/**
 * @route   POST /api/upload/product/gallery
 * @desc    Subir múltiples imágenes de producto (galería)
 * @access  Private
 * @body    productId
 */
router.post('/product/gallery', upload.array('files', 10), UploadController.uploadProductGallery);

/**
 * @route   GET /api/upload/product/:productId/images
 * @desc    Listar todas las imágenes de un producto
 * @access  Private
 */
router.get('/product/:productId/images', UploadController.listProductImages);

/**
 * @route   DELETE /api/upload/product/:productId/:imageType?
 * @desc    Eliminar imagen de producto
 * @access  Private
 * @params  imageType (main, thumb, gallery_1, all) - opcional, default: main
 */
router.delete('/product/:productId/:imageType?', UploadController.deleteProductImage);

// ===================================================================
// RUTAS DE CATEGORÍAS
// ===================================================================

/**
 * @route   POST /api/upload/category
 * @desc    Subir imagen de categoría
 * @access  Private
 * @body    categoryId
 */
router.post('/category', upload.single('file'), UploadController.uploadCategoryImage);

/**
 * @route   DELETE /api/upload/category/:categoryId
 * @desc    Eliminar imagen de categoría
 * @access  Private
 */
router.delete('/category/:categoryId', UploadController.deleteCategoryImage);

// ===================================================================
// RUTAS DE USUARIOS (AVATARES)
// ===================================================================

/**
 * @route   POST /api/upload/user/avatar
 * @desc    Subir avatar de usuario
 * @access  Private
 * @body    userId
 */
router.post('/user/avatar', upload.single('file'), UploadController.uploadUserAvatar);

// ===================================================================
// RUTAS GENERALES
// ===================================================================

/**
 * @route   POST /api/upload
 * @desc    Subir archivo genérico a Google Cloud Storage
 * @access  Private
 * @body    folder (opcional)
 */
router.post('/', upload.single('file'), UploadController.uploadGenericFile);

/**
 * @route   POST /api/upload/signed-url
 * @desc    Obtener URL firmada temporal para acceso a archivo privado
 * @access  Private
 * @body    filePath
 * @query   expiresIn (minutos, default: 60)
 */
router.post('/signed-url', UploadController.getSignedUrl);

module.exports = router;
