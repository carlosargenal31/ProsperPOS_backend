// ===================================================================
// PROSPERPOS - SERVICIO DE SUCURSALES
// ===================================================================

const BranchModel = require('../models/branch.model');

class BranchService {
  // Obtener todas las sucursales
  static async getBranches() {
    try {
      return await BranchModel.getAll();
    } catch (error) {
      throw new Error(`Error al obtener sucursales: ${error.message}`);
    }
  }

  // Obtener sucursales activas
  static async getActiveBranches() {
    try {
      return await BranchModel.getActive();
    } catch (error) {
      throw new Error(`Error al obtener sucursales activas: ${error.message}`);
    }
  }

  // Obtener una sucursal por ID
  static async getBranch(id) {
    try {
      const branch = await BranchModel.getById(id);
      if (!branch) {
        throw new Error('Sucursal no encontrada');
      }
      return branch;
    } catch (error) {
      throw error;
    }
  }

  // Crear una nueva sucursal
  static async createBranch(data) {
    try {
      // Validaciones
      if (!data.nombre || data.nombre.trim() === '') {
        throw new Error('El nombre de la sucursal es requerido');
      }

      const branchId = await BranchModel.create(data);
      return await BranchModel.getById(branchId);
    } catch (error) {
      throw error;
    }
  }

  // Actualizar una sucursal
  static async updateBranch(id, data) {
    try {
      // Validaciones
      if (!data.nombre || data.nombre.trim() === '') {
        throw new Error('El nombre de la sucursal es requerido');
      }

      const updated = await BranchModel.update(id, data);
      if (!updated) {
        throw new Error('Sucursal no encontrada o no se pudo actualizar');
      }
      return await BranchModel.getById(id);
    } catch (error) {
      throw error;
    }
  }

  // Eliminar una sucursal
  static async deleteBranch(id, deleted_by) {
    try {
      const deleted = await BranchModel.delete(id, deleted_by);
      if (!deleted) {
        throw new Error('Sucursal no encontrada o ya fue eliminada');
      }
      return { message: 'Sucursal eliminada exitosamente' };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = BranchService;
