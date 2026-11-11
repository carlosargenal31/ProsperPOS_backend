const ShipmentModel = require('../models/shipment.model');
const { AppError } = require('../utils/errors');

const ShipmentService = {
  /**
   * Obtener todos los envíos con filtros
   */
  async getAllShipments(filters) {
    try {
      const shipments = await ShipmentModel.getAll(filters);
      return shipments;
    } catch (error) {
      console.error('Error in ShipmentService.getAllShipments:', error);
      throw new AppError('Error al obtener los envíos', 500);
    }
  },

  /**
   * Obtener un envío por ID
   */
  async getShipmentById(id) {
    try {
      const shipment = await ShipmentModel.getById(id);

      if (!shipment) {
        throw new AppError('Envío no encontrado', 404);
      }

      return shipment;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error in ShipmentService.getShipmentById:', error);
      throw new AppError('Error al obtener el envío', 500);
    }
  },

  /**
   * Crear un nuevo envío
   */
  async createShipment(shipmentData, userId) {
    try {
      // Validaciones básicas
      if (!shipmentData.customer_name) {
        throw new AppError('El nombre del cliente es requerido', 400);
      }

      if (!shipmentData.receiver_name || !shipmentData.receiver_phone) {
        throw new AppError('Los datos del receptor son requeridos', 400);
      }

      if (!shipmentData.origin_address) {
        throw new AppError('La dirección de origen es requerida', 400);
      }

      if (!shipmentData.destination_address) {
        throw new AppError('La dirección de destino es requerida', 400);
      }

      if (!shipmentData.emission_date) {
        shipmentData.emission_date = new Date().toISOString().split('T')[0];
      }

      // Asignar usuario creador
      shipmentData.created_by = userId;

      // Verificar si el número de guía ya existe
      if (shipmentData.shipment_number) {
        const existing = await ShipmentModel.getByShipmentNumber(shipmentData.shipment_number);
        if (existing) {
          throw new AppError('El número de guía ya existe', 400);
        }
      }

      const shipmentId = await ShipmentModel.create(shipmentData);

      return {
        id: shipmentId,
        message: 'Envío creado exitosamente'
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error in ShipmentService.createShipment:', error);
      throw new AppError('Error al crear el envío', 500);
    }
  },

  /**
   * Actualizar un envío
   */
  async updateShipment(id, shipmentData) {
    try {
      // Verificar que el envío existe
      const existing = await ShipmentModel.getById(id);
      if (!existing) {
        throw new AppError('Envío no encontrado', 404);
      }

      // No permitir cambiar el número de guía una vez creado
      if (shipmentData.shipment_number && shipmentData.shipment_number !== existing.shipment_number) {
        throw new AppError('No se puede cambiar el número de guía', 400);
      }

      const success = await ShipmentModel.update(id, shipmentData);

      if (!success) {
        throw new AppError('No se pudo actualizar el envío', 500);
      }

      return {
        id: Number(id),
        message: 'Envío actualizado exitosamente'
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error in ShipmentService.updateShipment:', error);
      throw new AppError('Error al actualizar el envío', 500);
    }
  },

  /**
   * Eliminar un envío
   */
  async deleteShipment(id) {
    try {
      const existing = await ShipmentModel.getById(id);
      if (!existing) {
        throw new AppError('Envío no encontrado', 404);
      }

      // Solo permitir eliminar envíos en estado pendiente o cancelado
      if (existing.status === 'entregado') {
        throw new AppError('No se puede eliminar un envío ya entregado', 400);
      }

      const success = await ShipmentModel.delete(id);

      if (!success) {
        throw new AppError('No se pudo eliminar el envío', 500);
      }

      return {
        message: 'Envío eliminado exitosamente'
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error in ShipmentService.deleteShipment:', error);
      throw new AppError('Error al eliminar el envío', 500);
    }
  },

  /**
   * Actualizar estado de un envío
   */
  async updateShipmentStatus(id, status, userId) {
    try {
      const validStatuses = ['pendiente', 'en_camino', 'entregado', 'cancelado'];

      if (!validStatuses.includes(status)) {
        throw new AppError('Estado inválido', 400);
      }

      const existing = await ShipmentModel.getById(id);
      if (!existing) {
        throw new AppError('Envío no encontrado', 404);
      }

      // Validar transiciones de estado
      if (existing.status === 'entregado') {
        throw new AppError('No se puede cambiar el estado de un envío ya entregado', 400);
      }

      if (existing.status === 'cancelado' && status !== 'pendiente') {
        throw new AppError('Un envío cancelado solo puede volver a estado pendiente', 400);
      }

      const success = await ShipmentModel.updateStatus(id, status, userId);

      if (!success) {
        throw new AppError('No se pudo actualizar el estado del envío', 500);
      }

      return {
        message: 'Estado del envío actualizado exitosamente'
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error in ShipmentService.updateShipmentStatus:', error);
      throw new AppError('Error al actualizar el estado del envío', 500);
    }
  },

  /**
   * Generar número de guía
   */
  async generateShipmentNumber() {
    try {
      const number = await ShipmentModel.generateShipmentNumber();
      return { shipment_number: number };
    } catch (error) {
      console.error('Error in ShipmentService.generateShipmentNumber:', error);
      throw new AppError('Error al generar número de guía', 500);
    }
  },

  /**
   * Obtener estadísticas de envíos
   */
  async getStatistics(filters) {
    try {
      const stats = await ShipmentModel.getStatistics(filters);
      return stats;
    } catch (error) {
      console.error('Error in ShipmentService.getStatistics:', error);
      throw new AppError('Error al obtener estadísticas', 500);
    }
  },

  /**
   * Crear envío desde una factura
   */
  async createShipmentFromInvoice(invoiceId, shipmentData, userId) {
    try {
      // Aquí podrías obtener datos de la factura para pre-llenar el envío
      shipmentData.invoice_id = invoiceId;
      shipmentData.document_type = 'guia_remision';

      return await this.createShipment(shipmentData, userId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error in ShipmentService.createShipmentFromInvoice:', error);
      throw new AppError('Error al crear envío desde factura', 500);
    }
  }
};

module.exports = ShipmentService;
