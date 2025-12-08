// ===================================================================
// PROSPERPOS - SERVICIO DE OFERTAS
// ===================================================================

const OfferModel = require('../models/offer.model');
const logger = require('../utils/logger');

class OfferService {

  /**
   * Obtener todas las ofertas con filtros
   */
  static async getOffers(filters = {}) {
    try {
      const offers = await OfferModel.findAll(filters);
      return offers;

    } catch (error) {
      logger.error('Error in getOffers:', error);
      throw error;
    }
  }

  /**
   * Obtener oferta por ID
   */
  static async getOfferById(id) {
    try {
      const offer = await OfferModel.findById(id);

      if (offer) {
        // Obtener items si es una oferta múltiple
        if (offer.tipo_aplicacion === 'multiple') {
          offer.items = await OfferModel.getOfferItems(id);
        }
      }

      return offer;

    } catch (error) {
      logger.error('Error in getOfferById:', error);
      throw error;
    }
  }

  /**
   * Crear nueva oferta
   */
  static async createOffer(offerData) {
    try {
      // Validar que no exista el código
      const existingOffer = await OfferModel.existsByCodigo(offerData.codigo);
      if (existingOffer) {
        throw new Error('Ya existe una oferta con este código');
      }

      // Crear oferta
      const offer = await OfferModel.create(offerData);

      // Si es oferta múltiple, agregar items
      if (offerData.tipo_aplicacion === 'multiple' && offerData.items && offerData.items.length > 0) {
        await OfferModel.addOfferItems(offer.id, offerData.items);
      }

      logger.info('Offer created', {
        id: offer.id,
        codigo: offer.codigo
      });

      return offer;

    } catch (error) {
      logger.error('Error in createOffer:', error);
      throw error;
    }
  }

  /**
   * Actualizar oferta
   */
  static async updateOffer(id, offerData) {
    try {
      // Verificar que existe
      const existing = await OfferModel.findById(id);
      if (!existing) {
        throw new Error('Oferta no encontrada');
      }

      // Actualizar oferta
      const offer = await OfferModel.update(id, offerData);

      // Si es oferta múltiple, actualizar items
      if (offerData.tipo_aplicacion === 'multiple') {
        // Eliminar items existentes
        await OfferModel.deleteOfferItems(id);

        // Agregar nuevos items
        if (offerData.items && offerData.items.length > 0) {
          await OfferModel.addOfferItems(id, offerData.items);
        }
      }

      logger.info('Offer updated', {
        id: id,
        codigo: existing.codigo
      });

      return offer;

    } catch (error) {
      logger.error('Error in updateOffer:', error);
      throw error;
    }
  }

  /**
   * Eliminar oferta (soft delete)
   */
  static async deleteOffer(id, deleted_by) {
    try {
      // Verificar que existe
      const existing = await OfferModel.findById(id);
      if (!existing) {
        throw new Error('Oferta no encontrada');
      }

      // Soft delete
      await OfferModel.delete(id, deleted_by);

      logger.info('Offer deleted', {
        id: id,
        codigo: existing.codigo
      });

      return { success: true };

    } catch (error) {
      logger.error('Error in deleteOffer:', error);
      throw error;
    }
  }

  /**
   * Obtener ofertas activas
   */
  static async getActiveOffers() {
    try {
      const offers = await OfferModel.getActiveOffers();
      return offers;

    } catch (error) {
      logger.error('Error in getActiveOffers:', error);
      throw error;
    }
  }

  /**
   * Validar si una oferta es aplicable
   */
  static async isOfferApplicable(offerId, context = {}) {
    try {
      const offer = await OfferModel.findById(offerId);

      if (!offer || !offer.is_active || offer.suspendida) {
        return false;
      }

      // Validar fecha
      if (offer.limitar_fecha) {
        const now = new Date();
        const desde = new Date(offer.fecha_desde);
        const hasta = new Date(offer.fecha_hasta);

        if (now < desde || now > hasta) {
          return false;
        }
      }

      // Validar día de la semana
      const dayOfWeek = new Date().getDay(); // 0 = Domingo, 1 = Lunes, ...
      const dayMap = {
        0: 'aplica_domingo',
        1: 'aplica_lunes',
        2: 'aplica_martes',
        3: 'aplica_miercoles',
        4: 'aplica_jueves',
        5: 'aplica_viernes',
        6: 'aplica_sabado'
      };

      if (!offer[dayMap[dayOfWeek]]) {
        return false;
      }

      // Validar monto mínimo
      if (offer.aplica_para === 'compras_mayores' && context.total) {
        if (context.total < offer.monto_minimo) {
          return false;
        }
      }

      // Validar cantidad mínima
      if (offer.aplica_para === 'cantidades_mayores' && context.cantidad) {
        if (context.cantidad < offer.cantidad_minima) {
          return false;
        }
      }

      return true;

    } catch (error) {
      logger.error('Error in isOfferApplicable:', error);
      return false;
    }
  }

  /**
   * Calcular descuento de oferta
   */
  static async calculateDiscount(offerId, amount) {
    try {
      const offer = await OfferModel.findById(offerId);

      if (!offer) {
        return 0;
      }

      let discount = 0;

      if (offer.tipo_descuento === 'porcentaje') {
        discount = (amount * offer.valor_descuento) / 100;
      } else {
        discount = offer.valor_descuento;
      }

      return discount;

    } catch (error) {
      logger.error('Error in calculateDiscount:', error);
      return 0;
    }
  }
}

module.exports = OfferService;

// Método agregado: Obtener siguiente código
OfferService.getNextCode = async function() {
  try {
    const nextCode = await OfferModel.getNextCode();
    return nextCode;
  } catch (error) {
    logger.error('Error in getNextCode:', error);
    throw error;
  }
};
