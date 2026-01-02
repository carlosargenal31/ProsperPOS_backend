// ===================================================================
// PROSPERPOS - BANNER SERVICE (COPIADO DE BRANDS)
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');
const { getInstance: getGCSInstance } = require('../utils/google-cloud-storage');

class BannerService {
  static async getAllBanners() {
    try {
      const query = `
        SELECT id, title, description as subtitle, image_url,
               link_url as button_link, button_text, position as sort_order, is_active
        FROM banners
        ORDER BY position ASC
      `;
      const banners = await db.execute(query);
      return { success: true, data: banners, message: 'Banners obtenidos exitosamente' };
    } catch (error) {
      logger.error('Error in getAllBanners:', error);
      throw error;
    }
  }

  static async getActiveBanners() {
    try {
      const query = `
        SELECT id, title, description as subtitle, image_url,
               link_url as button_link, button_text, position as sort_order, is_active
        FROM banners
        WHERE is_active = 1 AND image_url != ''
        ORDER BY position ASC
      `;
      const banners = await db.execute(query);
      return { success: true, data: banners, message: 'Banners activos obtenidos exitosamente' };
    } catch (error) {
      logger.error('Error in getActiveBanners:', error);
      throw error;
    }
  }

  static async uploadBannerImage(bannerId, fileBuffer, fileName, contentType) {
    try {
      const gcs = getGCSInstance();
      const extension = fileName.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const uniqueFileName = `banner_${bannerId}_${timestamp}.${extension}`;
      
      const result = await gcs.uploadFile(fileBuffer, uniqueFileName, 'banners', { contentType, bannerId });
      
      await db.execute('UPDATE banners SET image_url = ?, updated_at = NOW() WHERE id = ?', [result.url, bannerId]);
      
      logger.info('Banner image uploaded successfully', { bannerId, url: result.url });
      
      return { success: true, url: result.url, message: 'Imagen de banner subida exitosamente' };
    } catch (error) {
      logger.error('Error uploading banner image:', error);
      throw error;
    }
  }

  static async deleteBannerImage(bannerId) {
    try {
      const banners = await db.execute('SELECT image_url FROM banners WHERE id = ?', [bannerId]);

      if (banners.length === 0) throw new Error('Banner no encontrado');

      const banner = banners[0];
      
      if (banner.image_url) {
        const gcs = getGCSInstance();
        await gcs.deleteFile(banner.image_url);
      }
      
      await db.execute("UPDATE banners SET image_url = '', updated_at = NOW() WHERE id = ?", [bannerId]);
      
      logger.info('Banner image deleted successfully', { bannerId });
      
      return { success: true, message: 'Imagen de banner eliminada exitosamente' };
    } catch (error) {
      logger.error('Error deleting banner image:', error);
      throw error;
    }
  }

  static async updateBannersConfiguration(banners) {
    try {
      if (banners.length > 3) throw new Error('Solo se permiten 3 banners');
      
      for (const banner of banners) {
        const updates = [];
        const values = [];
        
        if (banner.title !== undefined) { updates.push('title = ?'); values.push(banner.title); }
        if (banner.subtitle !== undefined) { updates.push('description = ?'); values.push(banner.subtitle); }
        if (banner.button_text !== undefined) { updates.push('button_text = ?'); values.push(banner.button_text); }
        if (banner.button_link !== undefined) { updates.push('link_url = ?'); values.push(banner.button_link); }
        if (banner.is_active !== undefined) { updates.push('is_active = ?'); values.push(banner.is_active ? 1 : 0); }
        if (banner.sort_order !== undefined) { updates.push('position = ?'); values.push(banner.sort_order); }
        
        updates.push('updated_at = NOW()');
        values.push(banner.id);
        
        if (updates.length > 1) {
          const query = `UPDATE banners SET ${updates.join(', ')} WHERE id = ?`;
          await db.execute(query, values);
        }
      }
      
      logger.info('Banners configuration updated successfully');
      
      return { success: true, message: 'Configuración de banners actualizada exitosamente' };
    } catch (error) {
      logger.error('Error updating banners configuration:', error);
      throw error;
    }
  }
}

module.exports = BannerService;
