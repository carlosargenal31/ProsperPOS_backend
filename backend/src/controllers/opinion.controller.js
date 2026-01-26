// ===================================================================
// PROSPERPOS - CONTROLADOR DE OPINIONES DE CLIENTES
// ===================================================================

const OpinionService = require('../services/opinion.service');
const EmailService = require('../services/email.service');
const logger = require('../utils/logger');

class OpinionController {

  // =================================================================
  // CREAR NUEVA OPINIÓN (ENDPOINT PÚBLICO)
  // =================================================================
  static async create(req, res) {
    try {
      const { name, lastname, email, inquiry_type, message } = req.body;

      // Validar datos
      if (!name || !lastname || !email || !inquiry_type || !message) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos'
        });
      }

      // Crear opinión
      const opinion = await OpinionService.createOpinion({
        name,
        lastname,
        email,
        inquiry_type,
        message
      });

      logger.info(`Nueva opinión creada: ${opinion.id}`);

      res.status(201).json({
        success: true,
        message: 'Tu opinión ha sido enviada exitosamente. Te responderemos pronto.',
        data: opinion
      });

    } catch (error) {
      logger.error('Error creando opinión:', error);
      res.status(500).json({
        success: false,
        message: 'Error al enviar la opinión',
        error: error.message
      });
    }
  }

  // =================================================================
  // OBTENER TODAS LAS OPINIONES (ADMIN)
  // =================================================================
  static async getAll(req, res) {
    try {
      const { status, page, limit } = req.query;

      const result = await OpinionService.getAllOpinions({
        status,
        page,
        limit
      });

      res.status(200).json({
        success: true,
        data: result.opinions,
        pagination: result.pagination
      });

    } catch (error) {
      logger.error('Error obteniendo opiniones:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener opiniones',
        error: error.message
      });
    }
  }

  // =================================================================
  // OBTENER OPINIÓN POR ID (ADMIN)
  // =================================================================
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const opinion = await OpinionService.getOpinionById(id);

      res.status(200).json({
        success: true,
        data: opinion
      });

    } catch (error) {
      logger.error('Error obteniendo opinión:', error);

      if (error.message === 'Opinión no encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al obtener opinión',
        error: error.message
      });
    }
  }

  // =================================================================
  // RESPONDER OPINIÓN (ADMIN)
  // =================================================================
  static async respond(req, res) {
    try {
      const { id } = req.params;
      const { admin_response } = req.body;
      const admin_user_id = req.user.id; // Del middleware de autenticación

      if (!admin_response) {
        return res.status(400).json({
          success: false,
          message: 'La respuesta es requerida'
        });
      }

      // Obtener opinión antes de responder
      const opinion = await OpinionService.getOpinionById(id);

      // Responder opinión
      const updatedOpinion = await OpinionService.respondOpinion(id, {
        admin_response,
        admin_user_id
      });

      // Enviar email al cliente con la respuesta
      const emailResult = await EmailService.sendOpinionResponse({
        customer_name: opinion.name,
        customer_email: opinion.email,
        inquiry_type: opinion.inquiry_type,
        original_message: opinion.message,
        admin_response
      });

      if (emailResult.success) {
        logger.info(`Email de respuesta enviado a: ${opinion.email}`);
      } else {
        logger.warn(`No se pudo enviar email de respuesta: ${emailResult.message || emailResult.error}`);
      }

      res.status(200).json({
        success: true,
        message: 'Opinión respondida exitosamente',
        data: updatedOpinion,
        email_sent: emailResult.success
      });

    } catch (error) {
      logger.error('Error respondiendo opinión:', error);

      if (error.message === 'Opinión no encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al responder opinión',
        error: error.message
      });
    }
  }

  // =================================================================
  // ACTUALIZAR ESTADO DE OPINIÓN (ADMIN)
  // =================================================================
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'El estado es requerido'
        });
      }

      const updatedOpinion = await OpinionService.updateOpinionStatus(id, status);

      res.status(200).json({
        success: true,
        message: 'Estado actualizado exitosamente',
        data: updatedOpinion
      });

    } catch (error) {
      logger.error('Error actualizando estado:', error);

      if (error.message === 'Opinión no encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al actualizar estado',
        error: error.message
      });
    }
  }

  // =================================================================
  // ELIMINAR OPINIÓN (ADMIN)
  // =================================================================
  static async delete(req, res) {
    try {
      const { id } = req.params;

      await OpinionService.deleteOpinion(id);

      res.status(200).json({
        success: true,
        message: 'Opinión eliminada exitosamente'
      });

    } catch (error) {
      logger.error('Error eliminando opinión:', error);

      if (error.message === 'Opinión no encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al eliminar opinión',
        error: error.message
      });
    }
  }

  // =================================================================
  // OBTENER ESTADÍSTICAS DE OPINIONES (ADMIN)
  // =================================================================
  static async getStats(req, res) {
    try {
      const stats = await OpinionService.getOpinionStats();

      res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.message
      });
    }
  }
}

module.exports = OpinionController;
