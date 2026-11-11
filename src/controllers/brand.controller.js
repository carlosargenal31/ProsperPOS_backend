// ===================================================================
// PROSPERPOS - CONTROLADOR DE MARCAS
// ===================================================================

const BrandService = require('../services/brand.service');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class BrandController {
  
  /**
   * Obtener todas las marcas
   */
  static async getBrands(req, res) {
    try {
      const { search = '', is_active } = req.query;
      
      const filters = {
        search,
        is_active: is_active === 'true' ? true : is_active === 'false' ? false : null
      };

      const brands = await BrandService.getBrands(filters);

      return sendSuccessResponse(res, brands, 'Marcas obtenidas exitosamente');

    } catch (error) {
      logger.error('Error getting brands:', error);
      return sendErrorResponse(res, 500, 'Error al obtener marcas');
    }
  }

  /**
   * Obtener marcas activas
   */
  static async getActiveBrands(req, res) {
    try {
      const brands = await BrandService.getActiveBrands();
      return sendSuccessResponse(res, brands, 'Marcas activas obtenidas exitosamente');
    } catch (error) {
      logger.error('Error getting active brands:', error);
      return sendErrorResponse(res, 500, 'Error al obtener marcas activas');
    }
  }

  /**
   * Obtener marca por ID
   */
  static async getBrand(req, res) {
    try {
      const { id } = req.params;

      const brand = await BrandService.getBrandById(id);

      if (!brand) {
        return sendErrorResponse(res, 404, 'Marca no encontrada');
      }

      return sendSuccessResponse(res, brand, 'Marca obtenida exitosamente');

    } catch (error) {
      logger.error('Error getting brand:', error);
      return sendErrorResponse(res, 500, 'Error al obtener marca');
    }
  }

  /**
   * Crear nueva marca
   */
  static async createBrand(req, res) {
    try {
      const brandData = {
        ...req.body,
        created_by: req.user.id
      };

      // Validación básica
      if (!brandData.name || brandData.name.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre de la marca es requerido');
      }

      const brand = await BrandService.createBrand(brandData);

      logger.info('Brand created', {
        brandId: brand.id,
        userId: req.user.id,
        name: brand.name
      });

      return sendSuccessResponse(res, brand, 'Marca creada exitosamente', 201);

    } catch (error) {
      logger.error('Error creating brand:', error);
      
      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }
      
      return sendErrorResponse(res, 500, 'Error al crear marca');
    }
  }

  /**
   * Actualizar marca
   */
  static async updateBrand(req, res) {
    try {
      const { id } = req.params;
      const brandData = {
        ...req.body,
        updated_by: req.user.id
      };

      // Validación básica
      if (brandData.name && brandData.name.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre de la marca no puede estar vacío');
      }

      const brand = await BrandService.updateBrand(id, brandData);

      logger.info('Brand updated', {
        brandId: id,
        userId: req.user.id
      });

      return sendSuccessResponse(res, brand, 'Marca actualizada exitosamente');

    } catch (error) {
      logger.error('Error updating brand:', error);
      
      if (error.message.includes('no encontrada')) {
        return sendErrorResponse(res, 404, error.message);
      }
      
      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }
      
      return sendErrorResponse(res, 500, 'Error al actualizar marca');
    }
  }

  /**
   * Eliminar marca (soft delete)
   */
  static async deleteBrand(req, res) {
    try {
      const { id } = req.params;
      const deleted_by = req.user.id;

      await BrandService.deleteBrand(id, deleted_by);

      logger.info('Brand deleted', {
        brandId: id,
        userId: deleted_by
      });

      return sendSuccessResponse(res, null, 'Marca eliminada exitosamente');

    } catch (error) {
      logger.error('Error deleting brand:', error);
      
      if (error.message.includes('no encontrada')) {
        return sendErrorResponse(res, 404, error.message);
      }
      
      if (error.message.includes('No se puede eliminar')) {
        return sendErrorResponse(res, 409, error.message);
      }
      
      return sendErrorResponse(res, 500, 'Error al eliminar marca');
    }
  }
}

module.exports = BrandController;