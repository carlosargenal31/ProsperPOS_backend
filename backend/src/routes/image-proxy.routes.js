/**
 * Image Proxy Routes
 * Rutas para proxy de imágenes
 */

const express = require('express');
const router = express.Router();
const ImageProxyController = require('../controllers/image-proxy.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/v1/image-proxy
 * @desc    Obtener imagen externa como base64
 * @access  Private
 */
router.get('/', authenticateToken, ImageProxyController.getImageAsBase64);

module.exports = router;
