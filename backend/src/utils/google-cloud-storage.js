// ===================================================================
// PROSPERPOS - GOOGLE CLOUD STORAGE UTILITY
// ===================================================================

const { Storage } = require('@google-cloud/storage');
const path = require('path');
const logger = require('./logger');

class GoogleCloudStorageService {
  constructor() {
    // Inicializar cliente de Google Cloud Storage
    this.storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCS_KEYFILE_PATH
    });

    this.bucketName = process.env.GCS_BUCKET_NAME;
    this.bucket = this.storage.bucket(this.bucketName);
    this.imageBaseUrl = process.env.IMAGE_BASE_URL || `https://storage.googleapis.com/${this.bucketName}`;
  }

  /**
   * Subir archivo a Google Cloud Storage
   * @param {Buffer} fileBuffer - Buffer del archivo
   * @param {string} fileName - Nombre del archivo
   * @param {string} folder - Carpeta destino (products, categories, invoices, etc.)
   * @param {object} metadata - Metadata adicional
   * @returns {Promise<object>} - URL pública y metadata
   */
  async uploadFile(fileBuffer, fileName, folder = 'products', metadata = {}) {
    try {
      // Sanitizar nombre de archivo
      const sanitizedFileName = this.sanitizeFileName(fileName);
      const destination = `${folder}/${sanitizedFileName}`;

      // Crear referencia al archivo
      const file = this.bucket.file(destination);

      // Configurar metadata
      const fileMetadata = {
        contentType: metadata.contentType || 'image/jpeg',
        metadata: {
          uploadedAt: new Date().toISOString(),
          ...metadata
        }
      };

      // Subir archivo
      await file.save(fileBuffer, {
        metadata: fileMetadata,
        resumable: false
      });

      // Hacer el archivo público
      try {
        await file.makePublic();
        logger.info('File made public', { destination });
      } catch (publicError) {
        logger.warn('Could not make file public (bucket may have uniform access):', publicError.message);
        // Continuar aunque falle - el bucket puede tener acceso uniforme configurado
      }

      // Generar URL pública
      const publicUrl = `${this.imageBaseUrl}/${destination}`;

      logger.info('File uploaded to Google Cloud Storage', {
        destination,
        size: fileBuffer.length,
        url: publicUrl
      });

      return {
        success: true,
        url: publicUrl,
        destination,
        bucket: this.bucketName,
        fileName: sanitizedFileName,
        folder
      };

    } catch (error) {
      logger.error('Error uploading file to Google Cloud Storage:', error);
      throw new Error(`Error al subir archivo: ${error.message}`);
    }
  }

  /**
   * Subir imagen de producto
   * @param {Buffer} fileBuffer - Buffer de la imagen
   * @param {number} productId - ID del producto
   * @param {string} type - Tipo de imagen (main, thumb, gallery)
   * @param {object} options - Opciones adicionales
   * @returns {Promise<object>} - URL y metadata
   */
  async uploadProductImage(fileBuffer, productId, type = 'main', options = {}) {
    try {
      const extension = options.extension || 'jpg';
      const fileName = `product_${productId}_${type}.${extension}`;

      return await this.uploadFile(fileBuffer, fileName, 'products', {
        contentType: options.contentType || 'image/jpeg',
        productId,
        imageType: type,
        ...options.metadata
      });

    } catch (error) {
      logger.error('Error uploading product image:', error);
      throw error;
    }
  }

  /**
   * Subir imagen de categoría
   * @param {Buffer} fileBuffer - Buffer de la imagen
   * @param {number} categoryId - ID de la categoría
   * @param {object} options - Opciones adicionales
   * @returns {Promise<object>} - URL y metadata
   */
  async uploadCategoryImage(fileBuffer, categoryId, options = {}) {
    try {
      const extension = options.extension || 'jpg';
      const fileName = `category_${categoryId}.${extension}`;

      return await this.uploadFile(fileBuffer, fileName, 'categories', {
        contentType: options.contentType || 'image/jpeg',
        categoryId,
        ...options.metadata
      });

    } catch (error) {
      logger.error('Error uploading category image:', error);
      throw error;
    }
  }

  /**
   * Eliminar archivo de Google Cloud Storage
   * @param {string} fileUrl - URL del archivo o path relativo
   * @returns {Promise<boolean>}
   */
  async deleteFile(fileUrl) {
    try {
      // Extraer path del archivo desde URL
      const filePath = this.extractPathFromUrl(fileUrl);

      if (!filePath) {
        throw new Error('No se pudo extraer el path del archivo');
      }

      const file = this.bucket.file(filePath);

      // Verificar si existe
      const [exists] = await file.exists();

      if (!exists) {
        logger.warn('File does not exist in Google Cloud Storage', { filePath });
        return false;
      }

      // Eliminar archivo
      await file.delete();

      logger.info('File deleted from Google Cloud Storage', { filePath });

      return true;

    } catch (error) {
      logger.error('Error deleting file from Google Cloud Storage:', error);
      throw new Error(`Error al eliminar archivo: ${error.message}`);
    }
  }

  /**
   * Eliminar imagen de producto
   * @param {number} productId - ID del producto
   * @param {string} type - Tipo de imagen (main, thumb, gallery, all)
   * @returns {Promise<object>}
   */
  async deleteProductImage(productId, type = 'main') {
    try {
      if (type === 'all') {
        // Eliminar todas las imágenes del producto
        const [files] = await this.bucket.getFiles({
          prefix: `products/product_${productId}_`
        });

        const deletePromises = files.map(file => file.delete());
        await Promise.all(deletePromises);

        logger.info('All product images deleted', { productId, count: files.length });

        return {
          success: true,
          deletedCount: files.length
        };
      } else {
        // Eliminar imagen específica
        const fileName = `products/product_${productId}_${type}.jpg`;
        await this.deleteFile(fileName);

        return {
          success: true,
          deletedCount: 1
        };
      }

    } catch (error) {
      logger.error('Error deleting product image:', error);
      throw error;
    }
  }

  /**
   * Obtener URL firmada (signed URL) para acceso temporal
   * @param {string} filePath - Path del archivo en el bucket
   * @param {number} expiresIn - Tiempo de expiración en minutos (default: 60)
   * @returns {Promise<string>} - URL firmada
   */
  async getSignedUrl(filePath, expiresIn = 60) {
    try {
      const file = this.bucket.file(filePath);

      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expiresIn * 60 * 1000
      });

      return url;

    } catch (error) {
      logger.error('Error generating signed URL:', error);
      throw new Error(`Error al generar URL firmada: ${error.message}`);
    }
  }

  /**
   * Listar archivos en una carpeta
   * @param {string} folder - Carpeta (products, categories, etc.)
   * @param {object} options - Opciones de listado
   * @returns {Promise<Array>} - Lista de archivos
   */
  async listFiles(folder, options = {}) {
    try {
      const [files] = await this.bucket.getFiles({
        prefix: folder,
        maxResults: options.limit || 1000
      });

      return files.map(file => ({
        name: file.name,
        url: `${this.imageBaseUrl}/${file.name}`,
        size: file.metadata.size,
        contentType: file.metadata.contentType,
        created: file.metadata.timeCreated,
        updated: file.metadata.updated
      }));

    } catch (error) {
      logger.error('Error listing files:', error);
      throw new Error(`Error al listar archivos: ${error.message}`);
    }
  }

  /**
   * Verificar si un archivo existe
   * @param {string} filePath - Path del archivo
   * @returns {Promise<boolean>}
   */
  async fileExists(filePath) {
    try {
      const file = this.bucket.file(filePath);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      logger.error('Error checking file existence:', error);
      return false;
    }
  }

  /**
   * Copiar archivo dentro del bucket
   * @param {string} sourcePath - Path origen
   * @param {string} destinationPath - Path destino
   * @returns {Promise<object>}
   */
  async copyFile(sourcePath, destinationPath) {
    try {
      const sourceFile = this.bucket.file(sourcePath);
      const [destinationFile] = await sourceFile.copy(this.bucket.file(destinationPath));

      return {
        success: true,
        sourceUrl: `${this.imageBaseUrl}/${sourcePath}`,
        destinationUrl: `${this.imageBaseUrl}/${destinationPath}`
      };

    } catch (error) {
      logger.error('Error copying file:', error);
      throw new Error(`Error al copiar archivo: ${error.message}`);
    }
  }

  /**
   * Mover archivo (copiar y eliminar original)
   * @param {string} sourcePath - Path origen
   * @param {string} destinationPath - Path destino
   * @returns {Promise<object>}
   */
  async moveFile(sourcePath, destinationPath) {
    try {
      await this.copyFile(sourcePath, destinationPath);
      await this.deleteFile(sourcePath);

      return {
        success: true,
        newUrl: `${this.imageBaseUrl}/${destinationPath}`
      };

    } catch (error) {
      logger.error('Error moving file:', error);
      throw new Error(`Error al mover archivo: ${error.message}`);
    }
  }

  // ===================================================================
  // MÉTODOS AUXILIARES
  // ===================================================================

  /**
   * Sanitizar nombre de archivo
   * @param {string} fileName - Nombre original
   * @returns {string} - Nombre sanitizado
   */
  sanitizeFileName(fileName) {
    // Remover caracteres especiales y espacios
    return fileName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-_.]/g, '')
      .replace(/\-+/g, '-')
      .substring(0, 200); // Límite de longitud
  }

  /**
   * Extraer path relativo desde URL completa
   * @param {string} url - URL completa o path relativo
   * @returns {string} - Path relativo
   */
  extractPathFromUrl(url) {
    if (!url) return null;

    // Si ya es un path relativo
    if (!url.includes('http')) {
      return url;
    }

    // Extraer path desde URL
    const urlPattern = new RegExp(`${this.bucketName}/(.+)$`);
    const match = url.match(urlPattern);

    return match ? match[1] : null;
  }

  /**
   * Generar nombre único de archivo
   * @param {string} originalName - Nombre original
   * @returns {string} - Nombre único
   */
  generateUniqueFileName(originalName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);

    return `${this.sanitizeFileName(name)}_${timestamp}_${random}${ext}`;
  }

  /**
   * Obtener información de uso del bucket
   * @returns {Promise<object>}
   */
  async getBucketInfo() {
    try {
      const [metadata] = await this.bucket.getMetadata();

      return {
        name: metadata.name,
        location: metadata.location,
        storageClass: metadata.storageClass,
        created: metadata.timeCreated,
        updated: metadata.updated
      };

    } catch (error) {
      logger.error('Error getting bucket info:', error);
      throw error;
    }
  }

}

// Singleton instance
let instance = null;

module.exports = {
  getInstance: () => {
    if (!instance) {
      instance = new GoogleCloudStorageService();
    }
    return instance;
  },
  GoogleCloudStorageService
};
