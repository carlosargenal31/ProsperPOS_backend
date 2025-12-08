const cargoDescargoService = require('../services/cargo-descargo.service');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');

class CargoDescargoController {
  /**
   * Obtener todos los documentos
   */
  async getAllDocuments(req, res) {
    try {
      const filters = {
        document_type: req.query.document_type,
        warehouse_id: req.query.warehouse_id,
        status: req.query.status,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        search: req.query.search,
        limit: req.query.limit || 50,
        offset: req.query.offset || 0
      };

      const documents = await cargoDescargoService.getAllDocuments(filters);

      return sendSuccessResponse(res, documents, 'Documentos obtenidos exitosamente');
    } catch (error) {
      return sendErrorResponse(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * Obtener documento por ID
   */
  async getDocumentById(req, res) {
    try {
      const { id } = req.params;
      const document = await cargoDescargoService.getDocumentById(id);

      return sendSuccessResponse(res, document, 'Documento obtenido exitosamente');
    } catch (error) {
      return sendErrorResponse(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * Crear nuevo documento
   */
  async createDocument(req, res) {
    try {
      const { document_data, details } = req.body;
      const userId = req.user.id;

      const newDocument = await cargoDescargoService.createDocument(
        document_data,
        details,
        userId
      );

      return sendSuccessResponse(res, newDocument, 'Documento creado exitosamente', 201);
    } catch (error) {
      return sendErrorResponse(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * Actualizar documento
   */
  async updateDocument(req, res) {
    try {
      const { id } = req.params;
      const { document_data, details } = req.body;

      const updatedDocument = await cargoDescargoService.updateDocument(
        id,
        document_data,
        details
      );

      return sendSuccessResponse(res, updatedDocument, 'Documento actualizado exitosamente');
    } catch (error) {
      return sendErrorResponse(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * Procesar documento (cambiar de BORRADOR a PROCESADO)
   */
  async processDocument(req, res) {
    try {
      const { id } = req.params;
      const processedDocument = await cargoDescargoService.processDocument(id);

      return sendSuccessResponse(res, processedDocument, 'Documento procesado exitosamente');
    } catch (error) {
      return sendErrorResponse(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * Cancelar documento
   */
  async cancelDocument(req, res) {
    try {
      const { id } = req.params;
      const canceledDocument = await cargoDescargoService.cancelDocument(id);

      return sendSuccessResponse(res, canceledDocument, 'Documento cancelado exitosamente');
    } catch (error) {
      return sendErrorResponse(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * Eliminar documento
   */
  async deleteDocument(req, res) {
    try {
      const { id } = req.params;
      await cargoDescargoService.deleteDocument(id);

      return sendSuccessResponse(res, null, 'Documento eliminado exitosamente');
    } catch (error) {
      return sendErrorResponse(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * Obtener resumen por almacén
   */
  async getSummaryByWarehouse(req, res) {
    try {
      const { warehouse_id, date_from, date_to } = req.query;

      if (!warehouse_id || !date_from || !date_to) {
        return sendErrorResponse(res, 400, 'Parámetros requeridos: warehouse_id, date_from, date_to');
      }

      const summary = await cargoDescargoService.getSummaryByWarehouse(
        warehouse_id,
        date_from,
        date_to
      );

      return sendSuccessResponse(res, summary, 'Resumen obtenido exitosamente');
    } catch (error) {
      return sendErrorResponse(res, error.statusCode || 500, error.message);
    }
  }
}

module.exports = new CargoDescargoController();
