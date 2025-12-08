// ===================================================================
// PROSPERPOS - CONTROLADOR DE SUBCATEGORÍAS
// ===================================================================

const SubcategoryService = require('../services/subcategory.service');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class SubcategoryController {

  /**
   * Obtener todas las subcategorías
   */
  static async getSubcategories(req, res) {
    try {
      const { search = '', is_active, category_id } = req.query;

      const filters = {
        search,
        is_active: is_active === 'true' ? true : is_active === 'false' ? false : null,
        category_id
      };

      const subcategories = await SubcategoryService.getSubcategories(filters);

      return sendSuccessResponse(res, subcategories, 'Subcategorías obtenidas exitosamente');

    } catch (error) {
      logger.error('Error getting subcategories:', error);
      return sendErrorResponse(res, 500, 'Error al obtener subcategorías');
    }
  }

  /**
   * Obtener subcategoría por ID
   */
  static async getSubcategory(req, res) {
    try {
      const { id } = req.params;

      const subcategory = await SubcategoryService.getSubcategoryById(id);

      if (!subcategory) {
        return sendErrorResponse(res, 404, 'Subcategoría no encontrada');
      }

      return sendSuccessResponse(res, subcategory, 'Subcategoría obtenida exitosamente');

    } catch (error) {
      logger.error('Error getting subcategory:', error);
      return sendErrorResponse(res, 500, 'Error al obtener subcategoría');
    }
  }

  /**
   * Obtener subcategorías por categoría padre
   */
  static async getSubcategoriesByCategory(req, res) {
    try {
      const { categoryId } = req.params;

      const subcategories = await SubcategoryService.getSubcategoriesByParent(categoryId);

      return sendSuccessResponse(res, subcategories, 'Subcategorías obtenidas exitosamente');

    } catch (error) {
      logger.error('Error getting subcategories by category:', error);
      return sendErrorResponse(res, 500, 'Error al obtener subcategorías');
    }
  }

  /**
   * Crear nueva subcategoría
   */
  static async createSubcategory(req, res) {
    try {
      const subcategoryData = {
        ...req.body,
        created_by: req.user.id
      };

      // Validación básica
      if (!subcategoryData.name || subcategoryData.name.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre de la subcategoría es requerido');
      }

      if (!subcategoryData.category_id) {
        return sendErrorResponse(res, 400, 'La categoría padre es requerida');
      }

      const subcategory = await SubcategoryService.createSubcategory(subcategoryData);

      logger.info('Subcategory created', {
        subcategoryId: subcategory.id,
        userId: req.user.id,
        name: subcategory.name
      });

      return sendSuccessResponse(res, subcategory, 'Subcategoría creada exitosamente', 201);

    } catch (error) {
      logger.error('Error creating subcategory:', error);

      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }

      if (error.message.includes('no existe')) {
        return sendErrorResponse(res, 404, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al crear subcategoría');
    }
  }

  /**
   * Actualizar subcategoría
   */
  static async updateSubcategory(req, res) {
    try {
      const { id } = req.params;
      const subcategoryData = {
        ...req.body,
        updated_by: req.user.id
      };

      // Validación básica
      if (subcategoryData.name && subcategoryData.name.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre de la subcategoría no puede estar vacío');
      }

      const subcategory = await SubcategoryService.updateSubcategory(id, subcategoryData);

      logger.info('Subcategory updated', {
        subcategoryId: id,
        userId: req.user.id
      });

      return sendSuccessResponse(res, subcategory, 'Subcategoría actualizada exitosamente');

    } catch (error) {
      logger.error('Error updating subcategory:', error);

      if (error.message.includes('no encontrada')) {
        return sendErrorResponse(res, 404, error.message);
      }

      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }

      if (error.message.includes('no existe')) {
        return sendErrorResponse(res, 404, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al actualizar subcategoría');
    }
  }

  /**
   * Eliminar subcategoría (soft delete)
   */
  static async deleteSubcategory(req, res) {
    try {
      const { id } = req.params;
      const deleted_by = req.user.id;

      await SubcategoryService.deleteSubcategory(id, deleted_by);

      logger.info('Subcategory deleted', {
        subcategoryId: id,
        userId: deleted_by
      });

      return sendSuccessResponse(res, null, 'Subcategoría eliminada exitosamente');

    } catch (error) {
      logger.error('Error deleting subcategory:', error);

      if (error.message.includes('no encontrada')) {
        return sendErrorResponse(res, 404, error.message);
      }

      if (error.message.includes('No se puede eliminar')) {
        return sendErrorResponse(res, 409, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al eliminar subcategoría');
    }
  }

  /**
   * Cambiar estado de subcategoría
   */
  static async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      const updated_by = req.user.id;

      const subcategory = await SubcategoryService.toggleStatus(id, is_active, updated_by);

      logger.info('Subcategory status toggled', {
        subcategoryId: id,
        userId: updated_by,
        is_active
      });

      return sendSuccessResponse(res, subcategory, 'Estado de subcategoría actualizado exitosamente');

    } catch (error) {
      logger.error('Error toggling subcategory status:', error);
      return sendErrorResponse(res, 500, 'Error al cambiar estado de subcategoría');
    }
  }
}

module.exports = SubcategoryController;
