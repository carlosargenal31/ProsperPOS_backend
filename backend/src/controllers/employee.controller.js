// ===================================================================
// PROSPERPOS - CONTROLADOR DE EMPLEADOS (RH)
// ===================================================================

const EmployeeService = require('../services/employee.service');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class EmployeeController {

  /**
   * Obtener todos los empleados
   */
  static async getEmployees(req, res) {
    try {
      const { search = '', is_active, department_id, position_id } = req.query;

      const filters = {
        search,
        is_active: is_active === 'true' ? true : is_active === 'false' ? false : null,
        department_id: department_id || null,
        position_id: position_id || null
      };

      const employees = await EmployeeService.getEmployees(filters);

      return sendSuccessResponse(res, employees, 'Empleados obtenidos exitosamente');

    } catch (error) {
      logger.error('Error getting employees:', error);
      return sendErrorResponse(res, 500, 'Error al obtener empleados');
    }
  }

  /**
   * Obtener empleados activos
   */
  static async getActiveEmployees(req, res) {
    try {
      const employees = await EmployeeService.getActiveEmployees();
      return sendSuccessResponse(res, employees, 'Empleados activos obtenidos exitosamente');
    } catch (error) {
      logger.error('Error getting active employees:', error);
      return sendErrorResponse(res, 500, 'Error al obtener empleados activos');
    }
  }

  /**
   * Obtener empleado por ID
   */
  static async getEmployee(req, res) {
    try {
      const { id } = req.params;

      const employee = await EmployeeService.getEmployeeById(id);

      if (!employee) {
        return sendErrorResponse(res, 404, 'Empleado no encontrado');
      }

      return sendSuccessResponse(res, employee, 'Empleado obtenido exitosamente');

    } catch (error) {
      logger.error('Error getting employee:', error);
      return sendErrorResponse(res, 500, 'Error al obtener empleado');
    }
  }

  /**
   * Crear nuevo empleado
   */
  static async createEmployee(req, res) {
    try {
      const employeeData = {
        ...req.body,
        created_by: req.user.id
      };

      // Validación básica
      if (!employeeData.nombre || employeeData.nombre.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre es requerido');
      }

      const employee = await EmployeeService.createEmployee(employeeData);

      logger.info('Employee created', {
        id: employee.id,
        userId: req.user.id,
        nombre: employee.nombre
      });

      return sendSuccessResponse(res, employee, 'Empleado creado exitosamente', 201);

    } catch (error) {
      logger.error('Error creating employee:', error);

      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al crear empleado');
    }
  }

  /**
   * Actualizar empleado
   */
  static async updateEmployee(req, res) {
    try {
      const { id } = req.params;
      const employeeData = {
        ...req.body,
        updated_by: req.user.id
      };

      // Validación básica
      if (employeeData.nombre && employeeData.nombre.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre no puede estar vacío');
      }

      const employee = await EmployeeService.updateEmployee(id, employeeData);

      logger.info('Employee updated', {
        id: id,
        userId: req.user.id
      });

      return sendSuccessResponse(res, employee, 'Empleado actualizado exitosamente');

    } catch (error) {
      logger.error('Error updating employee:', error);

      if (error.message.includes('no encontrado')) {
        return sendErrorResponse(res, 404, error.message);
      }

      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al actualizar empleado');
    }
  }

  /**
   * Eliminar empleado (soft delete)
   */
  static async deleteEmployee(req, res) {
    try {
      const { id } = req.params;
      const deleted_by = req.user.id;

      await EmployeeService.deleteEmployee(id, deleted_by);

      logger.info('Employee deleted', {
        id: id,
        userId: deleted_by
      });

      return sendSuccessResponse(res, null, 'Empleado eliminado exitosamente');

    } catch (error) {
      logger.error('Error deleting employee:', error);

      if (error.message.includes('no encontrado')) {
        return sendErrorResponse(res, 404, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al eliminar empleado');
    }
  }
}

module.exports = EmployeeController;
