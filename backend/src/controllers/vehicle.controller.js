// ===================================================================
// PROSPERPOS - CONTROLADOR DE VEHÍCULOS
// ===================================================================

const VehicleService = require('../services/vehicle.service');

class VehicleController {
  // Obtener todos los vehículos
  static async getVehicles(req, res) {
    try {
      const vehicles = await VehicleService.getAllVehicles();
      res.json({
        success: true,
        data: vehicles
      });
    } catch (error) {
      console.error('Error en getVehicles:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los vehículos',
        error: error.message
      });
    }
  }

  // Obtener vehículos activos
  static async getActiveVehicles(req, res) {
    try {
      const vehicles = await VehicleService.getActiveVehicles();
      res.json({
        success: true,
        data: vehicles
      });
    } catch (error) {
      console.error('Error en getActiveVehicles:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los vehículos activos',
        error: error.message
      });
    }
  }

  // Obtener un vehículo por ID
  static async getVehicleById(req, res) {
    try {
      const { id } = req.params;
      const vehicle = await VehicleService.getVehicleById(id);
      res.json({
        success: true,
        data: vehicle
      });
    } catch (error) {
      console.error('Error en getVehicleById:', error);
      const statusCode = error.message === 'Vehículo no encontrado' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Crear un nuevo vehículo
  static async createVehicle(req, res) {
    try {
      const vehicleData = {
        ...req.body,
        created_by: req.user?.id
      };
      const vehicle = await VehicleService.createVehicle(vehicleData);
      res.status(201).json({
        success: true,
        message: 'Vehículo creado exitosamente',
        data: vehicle
      });
    } catch (error) {
      console.error('Error en createVehicle:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Actualizar un vehículo
  static async updateVehicle(req, res) {
    try {
      const { id } = req.params;
      const vehicleData = {
        ...req.body,
        updated_by: req.user?.id
      };
      const vehicle = await VehicleService.updateVehicle(id, vehicleData);
      res.json({
        success: true,
        message: 'Vehículo actualizado exitosamente',
        data: vehicle
      });
    } catch (error) {
      console.error('Error en updateVehicle:', error);
      const statusCode = error.message.includes('no encontrado') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Eliminar un vehículo (soft delete)
  static async deleteVehicle(req, res) {
    try {
      const { id } = req.params;
      const result = await VehicleService.deleteVehicle(id, req.user?.id);
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error en deleteVehicle:', error);
      const statusCode = error.message.includes('no encontrado') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = VehicleController;
