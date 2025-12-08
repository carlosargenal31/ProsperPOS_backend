// ===================================================================
// PROSPERPOS - CONTROLADOR DE CATEGORÍAS
// ===================================================================

const CategoryService = require('../services/category.service');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class CategoryController {
  
  /**
   * Obtener todas las categorías
   */
  static async getCategories(req, res) {
    try {
      const { search = '', is_active, parent_id } = req.query;
      
      const filters = {
        search,
        is_active: is_active === 'true' ? true : is_active === 'false' ? false : null,
        parent_id
      };

      const categories = await CategoryService.getCategories(filters);

      // Debug: Verificar qué devuelve el servicio
      logger.info(`Controller getCategories: Recibido ${Array.isArray(categories) ? categories.length : 'NO ES ARRAY'} categorías`);
      logger.info(`Controller getCategories: Tipo: ${Array.isArray(categories) ? 'Array' : typeof categories}`);
      if (!Array.isArray(categories)) {
        logger.error(`Controller getCategories: ¡PROBLEMA! El servicio no devolvió un array:`, categories);
      }

      return sendSuccessResponse(res, categories, 'Categorías obtenidas exitosamente');

    } catch (error) {
      logger.error('Error getting categories:', error);
      return sendErrorResponse(res, 500, 'Error al obtener categorías');
    }
  }

  /**
   * Obtener categoría por ID
   */
  static async getCategory(req, res) {
    try {
      const { id } = req.params;

      const category = await CategoryService.getCategoryById(id);

      if (!category) {
        return sendErrorResponse(res, 404, 'Categoría no encontrada');
      }

      return sendSuccessResponse(res, category, 'Categoría obtenida exitosamente');

    } catch (error) {
      logger.error('Error getting category:', error);
      return sendErrorResponse(res, 500, 'Error al obtener categoría');
    }
  }

  /**
   * Crear nueva categoría
   */
  static async createCategory(req, res) {
    try {
      const categoryData = {
        ...req.body,
        created_by: req.user.id
      };

      // Validación básica
      if (!categoryData.name || categoryData.name.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre de la categoría es requerido');
      }

      const category = await CategoryService.createCategory(categoryData);

      logger.info('Category created', {
        categoryId: category.id,
        userId: req.user.id,
        name: category.name
      });

      return sendSuccessResponse(res, category, 'Categoría creada exitosamente', 201);

    } catch (error) {
      logger.error('Error creating category:', error);
      
      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }
      
      return sendErrorResponse(res, 500, 'Error al crear categoría');
    }
  }

  /**
   * Actualizar categoría
   */
  static async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const categoryData = {
        ...req.body,
        updated_by: req.user.id
      };

      // Validación básica
      if (categoryData.name && categoryData.name.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre de la categoría no puede estar vacío');
      }

      const category = await CategoryService.updateCategory(id, categoryData);

      logger.info('Category updated', {
        categoryId: id,
        userId: req.user.id
      });

      return sendSuccessResponse(res, category, 'Categoría actualizada exitosamente');

    } catch (error) {
      logger.error('Error updating category:', error);
      
      if (error.message.includes('no encontrada')) {
        return sendErrorResponse(res, 404, error.message);
      }
      
      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }
      
      if (error.message.includes('propio padre')) {
        return sendErrorResponse(res, 400, error.message);
      }
      
      return sendErrorResponse(res, 500, 'Error al actualizar categoría');
    }
  }

  /**
   * Eliminar categoría (soft delete)
   */
  static async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      const deleted_by = req.user.id;

      await CategoryService.deleteCategory(id, deleted_by);

      logger.info('Category deleted', {
        categoryId: id,
        userId: deleted_by
      });

      return sendSuccessResponse(res, null, 'Categoría eliminada exitosamente');

    } catch (error) {
      logger.error('Error deleting category:', error);
      
      if (error.message.includes('no encontrada')) {
        return sendErrorResponse(res, 404, error.message);
      }
      
      if (error.message.includes('No se puede eliminar')) {
        return sendErrorResponse(res, 409, error.message);
      }
      
      return sendErrorResponse(res, 500, 'Error al eliminar categoría');
    }
  }

  /**
   * Obtener subcategorías
   */
  static async getSubcategories(req, res) {
    try {
      const { id } = req.params;

      const subcategories = await CategoryService.getSubcategories(id);

      return sendSuccessResponse(res, subcategories, 'Subcategorías obtenidas exitosamente');

    } catch (error) {
      logger.error('Error getting subcategories:', error);
      return sendErrorResponse(res, 500, 'Error al obtener subcategorías');
    }
  }
}

module.exports = CategoryController;