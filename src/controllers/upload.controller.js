// ===================================================================
// PROSPERPOS - CONTROLADOR DE UPLOADS A GOOGLE CLOUD STORAGE
// ===================================================================

const { getInstance } = require('../utils/google-cloud-storage');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const db = require('../utils/database');
const sharp = require('sharp');

class UploadController {

  /**
   * Subir imagen de producto
   */
  static async uploadProductImage(req, res) {
    try {
      if (!req.file) {
        return sendErrorResponse(res, 400, 'No se proporcionó ningún archivo');
      }

      const { productId, imageType = 'main' } = req.body;

      if (!productId) {
        return sendErrorResponse(res, 400, 'productId es requerido');
      }

      // Verificar que el producto existe
      const [products] = await db.execute(
        'SELECT id FROM products WHERE id = ? AND deleted_at IS NULL',
        [productId]
      );

      if (products.length === 0) {
        return sendErrorResponse(res, 404, 'Producto no encontrado');
      }

      const gcs = getInstance();

      // Procesar imagen (optimizar y redimensionar)
      const processedBuffer = await UploadController.processImage(req.file.buffer, imageType);

      // Obtener extensión del archivo
      const extension = req.file.mimetype.split('/')[1];

      // Subir a Google Cloud Storage
      const result = await gcs.uploadProductImage(
        processedBuffer,
        productId,
        imageType,
        {
          extension,
          contentType: req.file.mimetype,
          metadata: {
            originalName: req.file.originalname,
            uploadedBy: req.user?.id,
            size: processedBuffer.length
          }
        }
      );

      // Actualizar URL en la base de datos
      await db.execute(
        'UPDATE products SET image = ?, updated_at = NOW() WHERE id = ?',
        [result.url, productId]
      );

      logger.info('Product image uploaded successfully', {
        productId,
        imageType,
        url: result.url,
        userId: req.user?.id
      });

      return sendSuccessResponse(res, result, 'Imagen subida exitosamente');

    } catch (error) {
      logger.error('Error uploading product image:', error);
      return sendErrorResponse(res, 500, 'Error al subir imagen: ' + error.message);
    }
  }

  /**
   * Subir imagen de categoría
   */
  static async uploadCategoryImage(req, res) {
    try {
      if (!req.file) {
        return sendErrorResponse(res, 400, 'No se proporcionó ningún archivo');
      }

      const { categoryId } = req.body;

      if (!categoryId) {
        return sendErrorResponse(res, 400, 'categoryId es requerido');
      }

      // Verificar que la categoría existe
      const [categories] = await db.execute(
        'SELECT id FROM categories WHERE id = ? AND deleted_at IS NULL',
        [categoryId]
      );

      if (categories.length === 0) {
        return sendErrorResponse(res, 404, 'Categoría no encontrada');
      }

      const gcs = getInstance();

      // Procesar imagen
      const processedBuffer = await UploadController.processImage(req.file.buffer, 'category');

      const extension = req.file.mimetype.split('/')[1];

      // Subir a Google Cloud Storage
      const result = await gcs.uploadCategoryImage(
        processedBuffer,
        categoryId,
        {
          extension,
          contentType: req.file.mimetype,
          metadata: {
            originalName: req.file.originalname,
            uploadedBy: req.user?.id,
            size: processedBuffer.length
          }
        }
      );

      // Actualizar URL en la base de datos
      await db.execute(
        'UPDATE categories SET image_url = ?, updated_at = NOW() WHERE id = ?',
        [result.url, categoryId]
      );

      logger.info('Category image uploaded successfully', {
        categoryId,
        url: result.url,
        userId: req.user?.id
      });

      return sendSuccessResponse(res, result, 'Imagen de categoría subida exitosamente');

    } catch (error) {
      logger.error('Error uploading category image:', error);
      return sendErrorResponse(res, 500, 'Error al subir imagen: ' + error.message);
    }
  }

  /**
   * Subir múltiples imágenes (galería de producto)
   */
  static async uploadProductGallery(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return sendErrorResponse(res, 400, 'No se proporcionaron archivos');
      }

      const { productId } = req.body;

      if (!productId) {
        return sendErrorResponse(res, 400, 'productId es requerido');
      }

      const gcs = getInstance();
      const uploadedImages = [];

      // Subir cada imagen
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imageType = `gallery_${i + 1}`;

        // Procesar imagen
        const processedBuffer = await UploadController.processImage(file.buffer, 'gallery');

        const extension = file.mimetype.split('/')[1];

        // Subir a GCS
        const result = await gcs.uploadProductImage(
          processedBuffer,
          productId,
          imageType,
          {
            extension,
            contentType: file.mimetype,
            metadata: {
              originalName: file.originalname,
              uploadedBy: req.user?.id,
              galleryIndex: i + 1
            }
          }
        );

        uploadedImages.push(result);
      }

      logger.info('Product gallery uploaded successfully', {
        productId,
        count: uploadedImages.length,
        userId: req.user?.id
      });

      return sendSuccessResponse(
        res,
        { images: uploadedImages, count: uploadedImages.length },
        `${uploadedImages.length} imágenes subidas exitosamente`
      );

    } catch (error) {
      logger.error('Error uploading product gallery:', error);
      return sendErrorResponse(res, 500, 'Error al subir imágenes: ' + error.message);
    }
  }

  /**
   * Eliminar imagen de producto
   */
  static async deleteProductImage(req, res) {
    try {
      const { productId, imageType = 'main' } = req.params;

      if (!productId) {
        return sendErrorResponse(res, 400, 'productId es requerido');
      }

      const gcs = getInstance();

      // Eliminar de Google Cloud Storage
      const result = await gcs.deleteProductImage(parseInt(productId), imageType);

      // Actualizar base de datos
      if (imageType === 'main' || imageType === 'all') {
        await db.execute(
          'UPDATE products SET image = NULL, updated_at = NOW() WHERE id = ?',
          [productId]
        );
      }

      logger.info('Product image deleted successfully', {
        productId,
        imageType,
        userId: req.user?.id
      });

      return sendSuccessResponse(res, result, 'Imagen eliminada exitosamente');

    } catch (error) {
      logger.error('Error deleting product image:', error);
      return sendErrorResponse(res, 500, 'Error al eliminar imagen: ' + error.message);
    }
  }

  /**
   * Eliminar imagen de categoría
   */
  static async deleteCategoryImage(req, res) {
    try {
      const { categoryId } = req.params;

      if (!categoryId) {
        return sendErrorResponse(res, 400, 'categoryId es requerido');
      }

      // Obtener URL actual de la imagen
      const [categories] = await db.execute(
        'SELECT image_url FROM categories WHERE id = ?',
        [categoryId]
      );

      if (categories.length === 0 || !categories[0].image_url) {
        return sendErrorResponse(res, 404, 'Imagen no encontrada');
      }

      const gcs = getInstance();

      // Eliminar de Google Cloud Storage
      await gcs.deleteFile(categories[0].image_url);

      // Actualizar base de datos
      await db.execute(
        'UPDATE categories SET image_url = NULL, updated_at = NOW() WHERE id = ?',
        [categoryId]
      );

      logger.info('Category image deleted successfully', {
        categoryId,
        userId: req.user?.id
      });

      return sendSuccessResponse(res, null, 'Imagen de categoría eliminada exitosamente');

    } catch (error) {
      logger.error('Error deleting category image:', error);
      return sendErrorResponse(res, 500, 'Error al eliminar imagen: ' + error.message);
    }
  }

  /**
   * Listar imágenes de un producto
   */
  static async listProductImages(req, res) {
    try {
      const { productId } = req.params;

      const gcs = getInstance();

      const images = await gcs.listFiles(`products/product_${productId}_`);

      return sendSuccessResponse(res, images, 'Imágenes obtenidas exitosamente');

    } catch (error) {
      logger.error('Error listing product images:', error);
      return sendErrorResponse(res, 500, 'Error al listar imágenes: ' + error.message);
    }
  }

  /**
   * Subir archivo genérico a Google Cloud Storage
   */
  static async uploadGenericFile(req, res) {
    try {
      if (!req.file) {
        return sendErrorResponse(res, 400, 'No se proporcionó ningún archivo');
      }

      const { folder = 'uploads' } = req.body;

      const gcs = getInstance();

      // Generar nombre de archivo único
      const timestamp = Date.now();
      const extension = req.file.mimetype.split('/')[1] || 'bin';
      const fileName = `${req.file.originalname.replace(/\.[^/.]+$/, '')}-${timestamp}.${extension}`;

      // Subir archivo
      const result = await gcs.uploadFile(
        req.file.buffer,
        fileName,
        folder,
        {
          contentType: req.file.mimetype,
          originalName: req.file.originalname,
          uploadedBy: req.user?.id,
          size: req.file.size
        }
      );

      logger.info('Generic file uploaded successfully', {
        fileName,
        folder,
        url: result.url,
        userId: req.user?.id
      });

      return sendSuccessResponse(res, result, 'Archivo subido exitosamente');

    } catch (error) {
      logger.error('Error uploading generic file:', error);
      return sendErrorResponse(res, 500, 'Error al subir archivo: ' + error.message);
    }
  }

  /**
   * Obtener URL firmada temporal para imagen privada
   */
  static async getSignedUrl(req, res) {
    try {
      const { filePath } = req.body;
      const { expiresIn = 60 } = req.query;

      if (!filePath) {
        return sendErrorResponse(res, 400, 'filePath es requerido');
      }

      const gcs = getInstance();

      const signedUrl = await gcs.getSignedUrl(filePath, parseInt(expiresIn));

      return sendSuccessResponse(
        res,
        { url: signedUrl, expiresIn: parseInt(expiresIn) },
        'URL firmada generada exitosamente'
      );

    } catch (error) {
      logger.error('Error generating signed URL:', error);
      return sendErrorResponse(res, 500, 'Error al generar URL: ' + error.message);
    }
  }

  // ===================================================================
  // MÉTODOS AUXILIARES
  // ===================================================================

  /**
   * Procesar imagen: optimizar, redimensionar, comprimir
   * @param {Buffer} buffer - Buffer de la imagen original
   * @param {string} type - Tipo de imagen (main, thumb, gallery, category)
   * @returns {Promise<Buffer>} - Buffer procesado
   */
  static async processImage(buffer, type = 'main') {
    try {
      let width, height, quality;

      // Configuración según tipo de imagen
      switch (type) {
        case 'main':
          width = 1200;
          height = 1200;
          quality = 85;
          break;
        case 'thumb':
          width = 300;
          height = 300;
          quality = 80;
          break;
        case 'gallery':
          width = 1000;
          height = 1000;
          quality = 85;
          break;
        case 'category':
          width = 800;
          height = 800;
          quality = 85;
          break;
        default:
          width = 1200;
          height = 1200;
          quality = 85;
      }

      // Procesar con Sharp
      const processedBuffer = await sharp(buffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality, progressive: true })
        .toBuffer();

      return processedBuffer;

    } catch (error) {
      logger.error('Error processing image:', error);
      throw new Error('Error al procesar imagen: ' + error.message);
    }
  }

  /**
   * Validar tipo de archivo
   */
  static isValidImageType(mimetype) {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    return allowedTypes.includes(mimetype);
  }
}

module.exports = UploadController;
