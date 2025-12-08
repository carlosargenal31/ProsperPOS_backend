const CargoDescargo = require('../models/cargo-descargo.model');
const { AppError } = require('../utils/errors');

class CargoDescargoService {
  async getAllDocuments(filters) {
    try {
      return await CargoDescargo.getAll(filters);
    } catch (error) {
      throw new AppError('Error al obtener documentos de cargo/descargo', 500, error);
    }
  }

  async getDocumentById(id) {
    try {
      const document = await CargoDescargo.getById(id);
      if (!document) {
        throw new AppError('Documento no encontrado', 404);
      }
      return document;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al obtener documento', 500, error);
    }
  }

  async createDocument(documentData, details, userId) {
    try {
      // Validaciones
      if (!documentData.document_type || !['CARGO', 'DESCARGO'].includes(documentData.document_type)) {
        throw new AppError('Tipo de documento inválido', 400);
      }

      if (!documentData.movement_type) {
        throw new AppError('Tipo de movimiento requerido', 400);
      }

      if (!documentData.warehouse_id) {
        throw new AppError('Almacén requerido', 400);
      }

      if (!documentData.issuer) {
        throw new AppError('Emisor requerido', 400);
      }

      if (!details || details.length === 0) {
        throw new AppError('El documento debe tener al menos un producto', 400);
      }

      // Calcular totales
      let subtotal = 0;
      details.forEach(detail => {
        detail.total_cost = (detail.quantity || 0) * (detail.unit_cost || 0);
        subtotal += detail.total_cost;
      });

      documentData.subtotal = subtotal;
      documentData.tax_amount = documentData.tax_amount || 0;
      documentData.total_amount = subtotal + (documentData.tax_amount || 0);

      return await CargoDescargo.create(documentData, details, userId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al crear documento', 500, error);
    }
  }

  async updateDocument(id, documentData, details) {
    try {
      // Calcular totales
      let subtotal = 0;
      if (details && details.length > 0) {
        details.forEach(detail => {
          detail.total_cost = (detail.quantity || 0) * (detail.unit_cost || 0);
          subtotal += detail.total_cost;
        });
      }

      documentData.subtotal = subtotal;
      documentData.tax_amount = documentData.tax_amount || 0;
      documentData.total_amount = subtotal + (documentData.tax_amount || 0);

      return await CargoDescargo.update(id, documentData, details);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al actualizar documento', 500, error);
    }
  }

  async processDocument(id) {
    try {
      return await CargoDescargo.process(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al procesar documento', 500, error);
    }
  }

  async cancelDocument(id) {
    try {
      return await CargoDescargo.cancel(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al cancelar documento', 500, error);
    }
  }

  async deleteDocument(id) {
    try {
      return await CargoDescargo.delete(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error al eliminar documento', 500, error);
    }
  }

  async getSummaryByWarehouse(warehouseId, dateFrom, dateTo) {
    try {
      return await CargoDescargo.getSummaryByWarehouse(warehouseId, dateFrom, dateTo);
    } catch (error) {
      throw new AppError('Error al obtener resumen', 500, error);
    }
  }
}

module.exports = new CargoDescargoService();
