const ShipmentService = require('../services/shipment.service');
const { sendSuccessResponse, sendErrorResponse, sendCreatedResponse } = require('../utils/response');

const ShipmentController = {
  /**
   * GET /api/shipments
   * Obtener todos los envíos
   */
  async getAll(req, res) {
    try {
      const filters = {
        status: req.query.status,
        customer_id: req.query.customer_id,
        warehouse_id: req.query.warehouse_id,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        search: req.query.search,
        limit: req.query.limit || 50,
        offset: req.query.offset || 0
      };

      const shipments = await ShipmentService.getAllShipments(filters);

      return sendSuccessResponse(res, shipments, 'Envíos obtenidos exitosamente');
    } catch (error) {
      console.error('Error in getAll shipments:', error);
      return sendErrorResponse(res, 500, error.message || 'Error al obtener envíos');
    }
  },

  /**
   * GET /api/shipments/:id
   * Obtener un envío por ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const shipment = await ShipmentService.getShipmentById(id);

      return sendSuccessResponse(res, shipment, 'Envío obtenido exitosamente');
    } catch (error) {
      console.error('Error in getById shipment:', error);
      const statusCode = error.message.includes('no encontrado') ? 404 : 500;
      return sendErrorResponse(res, statusCode, error.message || 'Error al obtener envío');
    }
  },

  /**
   * POST /api/shipments
   * Crear un nuevo envío
   */
  async create(req, res) {
    try {
      const userId = req.user?.id || null;
      const result = await ShipmentService.createShipment(req.body, userId);

      return sendCreatedResponse(res, result, 'Envío creado exitosamente');
    } catch (error) {
      console.error('Error in create shipment:', error);
      const statusCode = error.message.includes('requerido') || error.message.includes('ya existe') ? 400 : 500;
      return sendErrorResponse(res, statusCode, error.message || 'Error al crear envío');
    }
  },

  /**
   * PUT /api/shipments/:id
   * Actualizar un envío
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const result = await ShipmentService.updateShipment(id, req.body);

      return sendSuccessResponse(res, result, 'Envío actualizado exitosamente');
    } catch (error) {
      console.error('Error in update shipment:', error);
      const statusCode = error.message.includes('no encontrado') ? 404 :
                        error.message.includes('no se puede') ? 400 : 500;
      return sendErrorResponse(res, statusCode, error.message || 'Error al actualizar envío');
    }
  },

  /**
   * DELETE /api/shipments/:id
   * Eliminar un envío
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await ShipmentService.deleteShipment(id);

      return sendSuccessResponse(res, result, 'Envío eliminado exitosamente');
    } catch (error) {
      console.error('Error in delete shipment:', error);
      const statusCode = error.message.includes('no encontrado') ? 404 :
                        error.message.includes('no se puede') ? 400 : 500;
      return sendErrorResponse(res, statusCode, error.message || 'Error al eliminar envío');
    }
  },

  /**
   * PATCH /api/shipments/:id/status
   * Actualizar estado de un envío
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user?.id || null;

      const result = await ShipmentService.updateShipmentStatus(id, status, userId);

      return sendSuccessResponse(res, result, 'Estado actualizado exitosamente');
    } catch (error) {
      console.error('Error in updateStatus shipment:', error);
      const statusCode = error.message.includes('no encontrado') ? 404 :
                        error.message.includes('inválido') || error.message.includes('no se puede') ? 400 : 500;
      return sendErrorResponse(res, statusCode, error.message || 'Error al actualizar estado');
    }
  },

  /**
   * GET /api/shipments/generate-number
   * Generar número de guía
   */
  async generateNumber(req, res) {
    try {
      const result = await ShipmentService.generateShipmentNumber();

      return sendSuccessResponse(res, result, 'Número de guía generado');
    } catch (error) {
      console.error('Error in generateNumber:', error);
      return sendErrorResponse(res, 500, error.message || 'Error al generar número');
    }
  },

  /**
   * GET /api/shipments/statistics
   * Obtener estadísticas de envíos
   */
  async getStatistics(req, res) {
    try {
      const filters = {
        start_date: req.query.start_date,
        end_date: req.query.end_date
      };

      const stats = await ShipmentService.getStatistics(filters);

      return sendSuccessResponse(res, stats, 'Estadísticas obtenidas exitosamente');
    } catch (error) {
      console.error('Error in getStatistics:', error);
      return sendErrorResponse(res, 500, error.message || 'Error al obtener estadísticas');
    }
  },

  /**
   * POST /api/shipments/from-invoice/:invoiceId
   * Crear envío desde una factura
   */
  async createFromInvoice(req, res) {
    try {
      const { invoiceId } = req.params;
      const userId = req.user?.id || null;

      const result = await ShipmentService.createShipmentFromInvoice(
        invoiceId,
        req.body,
        userId
      );

      return sendCreatedResponse(res, result, 'Envío creado desde factura exitosamente');
    } catch (error) {
      console.error('Error in createFromInvoice:', error);
      const statusCode = error.message.includes('requerido') ? 400 : 500;
      return sendErrorResponse(res, statusCode, error.message || 'Error al crear envío');
    }
  }
};

module.exports = ShipmentController;
