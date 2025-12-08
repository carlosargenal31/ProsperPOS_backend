// ===================================================================
// PROSPERPOS - SERVICIO DE VEHÍCULOS
// ===================================================================

const VehicleModel = require('../models/vehicle.model');

class VehicleService {
  // Obtener todos los vehículos
  static async getAllVehicles() {
    return await VehicleModel.getAll();
  }

  // Obtener vehículos activos
  static async getActiveVehicles() {
    return await VehicleModel.getActive();
  }

  // Obtener un vehículo por ID
  static async getVehicleById(id) {
    const vehicle = await VehicleModel.getById(id);
    if (!vehicle) {
      throw new Error('Vehículo no encontrado');
    }
    return vehicle;
  }

  // Crear un nuevo vehículo
  static async createVehicle(data) {
    // Validaciones
    if (!data.placa || data.placa.trim() === '') {
      throw new Error('La placa es requerida');
    }
    if (!data.marca || data.marca.trim() === '') {
      throw new Error('La marca es requerida');
    }
    if (!data.modelo || data.modelo.trim() === '') {
      throw new Error('El modelo es requerido');
    }
    if (!data.color || data.color.trim() === '') {
      throw new Error('El color es requerido');
    }

    const vehicleId = await VehicleModel.create(data);
    return await VehicleModel.getById(vehicleId);
  }

  // Actualizar un vehículo
  static async updateVehicle(id, data) {
    // Validaciones
    if (!data.placa || data.placa.trim() === '') {
      throw new Error('La placa es requerida');
    }
    if (!data.marca || data.marca.trim() === '') {
      throw new Error('La marca es requerida');
    }
    if (!data.modelo || data.modelo.trim() === '') {
      throw new Error('El modelo es requerido');
    }
    if (!data.color || data.color.trim() === '') {
      throw new Error('El color es requerido');
    }

    const updated = await VehicleModel.update(id, data);
    if (!updated) {
      throw new Error('Vehículo no encontrado o no se pudo actualizar');
    }
    return await VehicleModel.getById(id);
  }

  // Eliminar un vehículo (soft delete)
  static async deleteVehicle(id, deleted_by) {
    const deleted = await VehicleModel.delete(id, deleted_by);
    if (!deleted) {
      throw new Error('Vehículo no encontrado o ya fue eliminado');
    }
    return { message: 'Vehículo eliminado exitosamente' };
  }
}

module.exports = VehicleService;
