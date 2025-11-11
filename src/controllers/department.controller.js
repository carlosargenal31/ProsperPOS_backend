// ===================================================================
// PROSPERPOS - CONTROLADOR DE DEPARTAMENTOS (RH)
// ===================================================================

const DepartmentService = require('../services/department.service');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class DepartmentController {

  /**
   * Obtener todos los departamentos
   */
  static async getDepartments(req, res) {
    try {
      const { search = '', is_active } = req.query;

      const filters = {
        search,
        is_active: is_active === 'true' ? true : is_active === 'false' ? false : null
      };

      const departments = await DepartmentService.getDepartments(filters);

      return sendSuccessResponse(res, departments, 'Departamentos obtenidos exitosamente');

    } catch (error) {
      logger.error('Error getting departments:', error);
      return sendErrorResponse(res, 500, 'Error al obtener departamentos');
    }
  }

  /**
   * Obtener departamentos activos
   */
  static async getActiveDepartments(req, res) {
    try {
      const departments = await DepartmentService.getActiveDepartments();
      return sendSuccessResponse(res, departments, 'Departamentos activos obtenidos exitosamente');
    } catch (error) {
      logger.error('Error getting active departments:', error);
      return sendErrorResponse(res, 500, 'Error al obtener departamentos activos');
    }
  }

  /**
   * Obtener departamento por ID
   */
  static async getDepartment(req, res) {
    try {
      const { id } = req.params;

      const department = await DepartmentService.getDepartmentById(id);

      if (!department) {
        return sendErrorResponse(res, 404, 'Departamento no encontrado');
      }

      return sendSuccessResponse(res, department, 'Departamento obtenido exitosamente');

    } catch (error) {
      logger.error('Error getting department:', error);
      return sendErrorResponse(res, 500, 'Error al obtener departamento');
    }
  }

  /**
   * Crear nuevo departamento
   */
  static async createDepartment(req, res) {
    try {
      const departmentData = {
        ...req.body,
        created_by: req.user.id
      };

      // Validación básica
      if (!departmentData.nombre || departmentData.nombre.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre es requerido');
      }

      const department = await DepartmentService.createDepartment(departmentData);

      logger.info('Department created', {
        id: department.id,
        userId: req.user.id,
        nombre: department.nombre
      });

      return sendSuccessResponse(res, department, 'Departamento creado exitosamente', 201);

    } catch (error) {
      logger.error('Error creating department:', error);

      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al crear departamento');
    }
  }

  /**
   * Actualizar departamento
   */
  static async updateDepartment(req, res) {
    try {
      const { id } = req.params;
      const departmentData = {
        ...req.body,
        updated_by: req.user.id
      };

      // Validación básica
      if (departmentData.nombre && departmentData.nombre.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre no puede estar vacío');
      }

      const department = await DepartmentService.updateDepartment(id, departmentData);

      logger.info('Department updated', {
        id: id,
        userId: req.user.id
      });

      return sendSuccessResponse(res, department, 'Departamento actualizado exitosamente');

    } catch (error) {
      logger.error('Error updating department:', error);

      if (error.message.includes('no encontrado')) {
        return sendErrorResponse(res, 404, error.message);
      }

      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al actualizar departamento');
    }
  }

  /**
   * Eliminar departamento (soft delete)
   */
  static async deleteDepartment(req, res) {
    try {
      const { id } = req.params;
      const deleted_by = req.user.id;

      await DepartmentService.deleteDepartment(id, deleted_by);

      logger.info('Department deleted', {
        id: id,
        userId: deleted_by
      });

      return sendSuccessResponse(res, null, 'Departamento eliminado exitosamente');

    } catch (error) {
      logger.error('Error deleting department:', error);

      if (error.message.includes('no encontrado')) {
        return sendErrorResponse(res, 404, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al eliminar departamento');
    }
  }
}

module.exports = DepartmentController;
