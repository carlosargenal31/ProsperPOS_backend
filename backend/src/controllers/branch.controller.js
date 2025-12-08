// ===================================================================
// PROSPERPOS - CONTROLADOR DE SUCURSALES
// ===================================================================

const BranchService = require('../services/branch.service');

class BranchController {
  // Obtener todas las sucursales
  static async getBranches(req, res) {
    try {
      const branches = await BranchService.getBranches();
      res.json({
        success: true,
        data: branches
      });
    } catch (error) {
      console.error('Error en getBranches:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Obtener sucursales activas
  static async getActiveBranches(req, res) {
    try {
      const branches = await BranchService.getActiveBranches();
      res.json({
        success: true,
        data: branches
      });
    } catch (error) {
      console.error('Error en getActiveBranches:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Obtener una sucursal por ID
  static async getBranch(req, res) {
    try {
      const { id } = req.params;
      const branch = await BranchService.getBranch(id);
      res.json({
        success: true,
        data: branch
      });
    } catch (error) {
      console.error('Error en getBranch:', error);
      res.status(error.message.includes('no encontrada') ? 404 : 500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Crear una nueva sucursal
  static async createBranch(req, res) {
    try {
      const data = {
        ...req.body,
        created_by: req.user?.id
      };
      const branch = await BranchService.createBranch(data);
      res.status(201).json({
        success: true,
        message: 'Sucursal creada exitosamente',
        data: branch
      });
    } catch (error) {
      console.error('Error en createBranch:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Actualizar una sucursal
  static async updateBranch(req, res) {
    try {
      const { id } = req.params;
      const data = {
        ...req.body,
        updated_by: req.user?.id
      };
      const branch = await BranchService.updateBranch(id, data);
      res.json({
        success: true,
        message: 'Sucursal actualizada exitosamente',
        data: branch
      });
    } catch (error) {
      console.error('Error en updateBranch:', error);
      res.status(error.message.includes('no encontrada') ? 404 : 400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Eliminar una sucursal
  static async deleteBranch(req, res) {
    try {
      const { id } = req.params;
      const deleted_by = req.user?.id;
      const result = await BranchService.deleteBranch(id, deleted_by);
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error en deleteBranch:', error);
      res.status(error.message.includes('no encontrada') ? 404 : 500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = BranchController;
