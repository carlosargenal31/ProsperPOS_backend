// ===================================================================
// PROSPERPOS - CONTROLADOR DE OFERTAS
// ===================================================================

const OfferService = require('../services/offer.service');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class OfferController {

  /**
   * Obtener todas las ofertas
   */
  static async getOffers(req, res) {
    try {
      const { search = '', is_active, agencia_id, tipo_aplicacion } = req.query;

      // Parse is_active - acepta 'true'/'false', '1'/'0', 1/0
      let isActiveFilter = null;
      if (is_active === 'true' || is_active === '1' || is_active === 1) {
        isActiveFilter = true;
      } else if (is_active === 'false' || is_active === '0' || is_active === 0) {
        isActiveFilter = false;
      }

      const filters = {
        search,
        is_active: isActiveFilter,
        agencia_id: agencia_id || null,
        tipo_aplicacion: tipo_aplicacion || null
      };

      const offers = await OfferService.getOffers(filters);

      return sendSuccessResponse(res, offers, 'Ofertas obtenidas exitosamente');

    } catch (error) {
      logger.error('Error getting offers:', error);
      return sendErrorResponse(res, 500, 'Error al obtener ofertas');
    }
  }

  /**
   * Obtener ofertas activas
   */
  static async getActiveOffers(req, res) {
    try {
      const offers = await OfferService.getActiveOffers();
      return sendSuccessResponse(res, offers, 'Ofertas activas obtenidas exitosamente');
    } catch (error) {
      logger.error('Error getting active offers:', error);
      return sendErrorResponse(res, 500, 'Error al obtener ofertas activas');
    }
  }

  /**
   * Obtener el siguiente código disponible
   */
  static async getNextCode(req, res) {
    try {
      const nextCode = await OfferService.getNextCode();
      return sendSuccessResponse(res, { codigo: nextCode }, 'Código generado exitosamente');
    } catch (error) {
      logger.error('Error getting next code:', error);
      return sendErrorResponse(res, 500, 'Error al generar código');
    }
  }

  /**
   * Obtener oferta por ID
   */
  static async getOffer(req, res) {
    try {
      const { id } = req.params;

      const offer = await OfferService.getOfferById(id);

      if (!offer) {
        return sendErrorResponse(res, 404, 'Oferta no encontrada');
      }

      return sendSuccessResponse(res, offer, 'Oferta obtenida exitosamente');

    } catch (error) {
      logger.error('Error getting offer:', error);
      return sendErrorResponse(res, 500, 'Error al obtener oferta');
    }
  }

  /**
   * Crear nueva oferta
   */
  static async createOffer(req, res) {
    try {
      const offerData = {
        ...req.body,
        created_by: req.user.id
      };

      // Validación básica
      if (!offerData.codigo || offerData.codigo.trim() === '') {
        return sendErrorResponse(res, 400, 'El código es requerido');
      }

      if (!offerData.nombre || offerData.nombre.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre es requerido');
      }

      const offer = await OfferService.createOffer(offerData);

      logger.info('Offer created', {
        id: offer.id,
        userId: req.user.id,
        codigo: offer.codigo
      });

      return sendSuccessResponse(res, offer, 'Oferta creada exitosamente', 201);

    } catch (error) {
      logger.error('Error creating offer:', error);

      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al crear oferta');
    }
  }

  /**
   * Actualizar oferta
   */
  static async updateOffer(req, res) {
    try {
      const { id } = req.params;
      const offerData = {
        ...req.body,
        updated_by: req.user.id
      };

      // Validación básica
      if (offerData.nombre && offerData.nombre.trim() === '') {
        return sendErrorResponse(res, 400, 'El nombre no puede estar vacío');
      }

      const offer = await OfferService.updateOffer(id, offerData);

      logger.info('Offer updated', {
        id: id,
        userId: req.user.id
      });

      return sendSuccessResponse(res, offer, 'Oferta actualizada exitosamente');

    } catch (error) {
      logger.error('Error updating offer:', error);

      if (error.message.includes('no encontrada')) {
        return sendErrorResponse(res, 404, error.message);
      }

      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al actualizar oferta');
    }
  }

  /**
   * Eliminar oferta (soft delete)
   */
  static async deleteOffer(req, res) {
    try {
      const { id } = req.params;
      const deleted_by = req.user.id;

      await OfferService.deleteOffer(id, deleted_by);

      logger.info('Offer deleted', {
        id: id,
        userId: deleted_by
      });

      return sendSuccessResponse(res, null, 'Oferta eliminada exitosamente');

    } catch (error) {
      logger.error('Error deleting offer:', error);

      if (error.message.includes('no encontrada')) {
        return sendErrorResponse(res, 404, error.message);
      }

      return sendErrorResponse(res, 500, 'Error al eliminar oferta');
    }
  }

  /**
   * Validar si una oferta es aplicable
   */
  static async validateOffer(req, res) {
    try {
      const { id } = req.params;
      const context = req.body; // { total, cantidad, etc. }

      const isApplicable = await OfferService.isOfferApplicable(id, context);

      return sendSuccessResponse(res, { isApplicable }, 'Validación completada');

    } catch (error) {
      logger.error('Error validating offer:', error);
      return sendErrorResponse(res, 500, 'Error al validar oferta');
    }
  }

  /**
   * Calcular descuento de oferta
   */
  static async calculateDiscount(req, res) {
    try {
      const { id } = req.params;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return sendErrorResponse(res, 400, 'Monto inválido');
      }

      const discount = await OfferService.calculateDiscount(id, amount);

      return sendSuccessResponse(res, { discount }, 'Descuento calculado exitosamente');

    } catch (error) {
      logger.error('Error calculating discount:', error);
      return sendErrorResponse(res, 500, 'Error al calcular descuento');
    }
  }
}

module.exports = OfferController;
