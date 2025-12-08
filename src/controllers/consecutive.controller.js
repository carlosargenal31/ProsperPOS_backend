// ===================================================================
// PROSPERPOS - CONTROLADOR DE CONSECUTIVOS
// ===================================================================

const logger = require('../utils/logger');
const db = require('../utils/database');

class ConsecutiveController {
  /**
   * Obtener todos los consecutivos
   */
  static async getAll(req, res) {
    try {
      const sql = 'SELECT * FROM consecutives ORDER BY document_type';
      const consecutives = await db.query(sql);

      res.json({
        success: true,
        data: consecutives
      });
    } catch (error) {
      logger.error('Error in ConsecutiveController.getAll:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener consecutivos',
        error: error.message
      });
    }
  }

  /**
   * Obtener consecutivo por tipo de documento
   */
  static async getByType(req, res) {
    try {
      const { type } = req.params;

      const sql = 'SELECT * FROM consecutives WHERE document_type = ?';
      const results = await db.query(sql, [type]);

      if (!results || results.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Consecutivo para tipo '${type}' no encontrado`
        });
      }

      res.json({
        success: true,
        data: results[0]
      });
    } catch (error) {
      logger.error('Error in ConsecutiveController.getByType:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener consecutivo',
        error: error.message
      });
    }
  }

  /**
   * Incrementar consecutivo
   */
  static async increment(req, res) {
    try {
      const { type } = req.params;

      // Incrementar el consecutivo
      const updateSql = `
        UPDATE consecutives
        SET current_number = current_number + 1,
            updated_at = NOW()
        WHERE document_type = ?
      `;

      await db.query(updateSql, [type]);

      // Obtener el nuevo valor
      const selectSql = 'SELECT * FROM consecutives WHERE document_type = ?';
      const results = await db.query(selectSql, [type]);

      if (!results || results.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Consecutivo para tipo '${type}' no encontrado`
        });
      }

      logger.info(`Consecutivo incrementado: ${type} -> ${results[0].current_number}`);

      res.json({
        success: true,
        message: 'Consecutivo incrementado exitosamente',
        data: results[0]
      });
    } catch (error) {
      logger.error('Error in ConsecutiveController.increment:', error);
      res.status(500).json({
        success: false,
        message: 'Error al incrementar consecutivo',
        error: error.message
      });
    }
  }

  /**
   * Actualizar consecutivo manualmente
   */
  static async update(req, res) {
    try {
      const { type } = req.params;
      const { current_number } = req.body;

      if (!current_number || current_number < 1) {
        return res.status(400).json({
          success: false,
          message: 'El número consecutivo debe ser mayor a 0'
        });
      }

      const updateSql = `
        UPDATE consecutives
        SET current_number = ?,
            updated_at = NOW()
        WHERE document_type = ?
      `;

      await db.query(updateSql, [current_number, type]);

      // Obtener el valor actualizado
      const selectSql = 'SELECT * FROM consecutives WHERE document_type = ?';
      const results = await db.query(selectSql, [type]);

      logger.info(`Consecutivo actualizado manualmente: ${type} -> ${current_number}`);

      res.json({
        success: true,
        message: 'Consecutivo actualizado exitosamente',
        data: results[0]
      });
    } catch (error) {
      logger.error('Error in ConsecutiveController.update:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar consecutivo',
        error: error.message
      });
    }
  }
}

module.exports = ConsecutiveController;
