/**
 * Image Proxy Controller
 * Proxy para descargar imágenes externas y evitar problemas de CORS
 */

const axios = require('axios');
const logger = require('../utils/logger');

class ImageProxyController {
  /**
   * GET /api/v1/image-proxy
   * Obtener imagen externa como base64
   */
  static async getImageAsBase64(req, res) {
    try {
      const { url } = req.query;

      if (!url) {
        return res.status(400).json({
          success: false,
          message: 'URL de imagen requerida'
        });
      }

      logger.info(`Descargando imagen: ${url}`);

      // Descargar la imagen
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 10000
      });

      // Convertir a base64
      const base64 = Buffer.from(response.data, 'binary').toString('base64');
      const contentType = response.headers['content-type'] || 'image/jpeg';
      const dataUrl = `data:${contentType};base64,${base64}`;

      res.json({
        success: true,
        data: {
          base64: dataUrl,
          contentType: contentType,
          size: base64.length
        }
      });

    } catch (error) {
      logger.error('Error en ImageProxyController.getImageAsBase64:', error);

      if (error.code === 'ECONNABORTED') {
        return res.status(408).json({
          success: false,
          message: 'Timeout al descargar la imagen'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al descargar la imagen',
        error: error.message
      });
    }
  }
}

module.exports = ImageProxyController;
