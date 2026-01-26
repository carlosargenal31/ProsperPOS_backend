// ===================================================================
// PROSPERPOS - SERVICIO DE OPINIONES DE CLIENTES
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class OpinionService {

  // =================================================================
  // CREAR NUEVA OPINIÓN
  // =================================================================
  static async createOpinion(opinionData) {
    try {
      const { name, lastname, email, inquiry_type, message } = opinionData;

      // Validar datos requeridos
      if (!name || !lastname || !email || !inquiry_type || !message) {
        throw new Error('Todos los campos son requeridos');
      }

      // Insertar opinión
      const result = await db.query(
        `INSERT INTO customer_opinions
         (name, lastname, email, inquiry_type, message)
         VALUES (?, ?, ?, ?, ?)`,
        [name, lastname, email, inquiry_type, message]
      );

      logger.info(`Nueva opinión creada con ID: ${result.insertId}`);

      return {
        id: result.insertId,
        name,
        lastname,
        email,
        inquiry_type,
        message,
        status: 'pendiente',
        created_at: new Date()
      };

    } catch (error) {
      logger.error('Error creando opinión:', error);
      throw error;
    }
  }

  // =================================================================
  // OBTENER TODAS LAS OPINIONES
  // =================================================================
  static async getAllOpinions(filters = {}) {
    try {
      const { status, page = 1, limit = 50 } = filters;

      // Convertir limit y page a números
      const limitNum = parseInt(limit) || 50;
      const pageNum = parseInt(page) || 1;

      let sql = `
        SELECT
          co.*,
          CONCAT(u.first_name, ' ', u.last_name) as admin_name,
          u.email as admin_email
        FROM customer_opinions co
        LEFT JOIN users u ON co.admin_user_id = u.id
      `;

      const params = [];

      // Aplicar filtro de estado si existe
      if (status) {
        sql += ' WHERE co.status = ?';
        params.push(status);
      }

      // Ordenar por fecha de creación (más recientes primero)
      sql += ' ORDER BY co.created_at DESC';

      // Paginación
      const offset = (pageNum - 1) * limitNum;
      sql += ' LIMIT ? OFFSET ?';
      params.push(limitNum, offset);

      const opinions = await db.query(sql, params);

      // Obtener total de registros
      let countSql = 'SELECT COUNT(*) as total FROM customer_opinions';
      const countParams = [];

      if (status) {
        countSql += ' WHERE status = ?';
        countParams.push(status);
      }

      const countResult = await db.query(countSql, countParams);
      const total = countResult[0].total;

      return {
        opinions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      };

    } catch (error) {
      logger.error('Error obteniendo opiniones:', error);
      throw error;
    }
  }

  // =================================================================
  // OBTENER OPINIÓN POR ID
  // =================================================================
  static async getOpinionById(id) {
    try {
      const opinions = await db.query(
        `SELECT
          co.*,
          CONCAT(u.first_name, ' ', u.last_name) as admin_name,
          u.email as admin_email
         FROM customer_opinions co
         LEFT JOIN users u ON co.admin_user_id = u.id
         WHERE co.id = ?`,
        [id]
      );

      if (opinions.length === 0) {
        throw new Error('Opinión no encontrada');
      }

      return opinions[0];

    } catch (error) {
      logger.error('Error obteniendo opinión:', error);
      throw error;
    }
  }

  // =================================================================
  // RESPONDER OPINIÓN
  // =================================================================
  static async respondOpinion(id, responseData) {
    try {
      const { admin_response, admin_user_id } = responseData;

      if (!admin_response || !admin_user_id) {
        throw new Error('Respuesta y usuario administrador son requeridos');
      }

      // Verificar que la opinión existe
      const opinion = await this.getOpinionById(id);

      // Actualizar opinión
      await db.query(
        `UPDATE customer_opinions
         SET admin_response = ?,
             admin_user_id = ?,
             status = 'respondido',
             responded_at = NOW()
         WHERE id = ?`,
        [admin_response, admin_user_id, id]
      );

      logger.info(`Opinión ${id} respondida por usuario ${admin_user_id}`);

      // Obtener opinión actualizada
      const updatedOpinion = await this.getOpinionById(id);

      return updatedOpinion;

    } catch (error) {
      logger.error('Error respondiendo opinión:', error);
      throw error;
    }
  }

  // =================================================================
  // ACTUALIZAR ESTADO DE OPINIÓN
  // =================================================================
  static async updateOpinionStatus(id, status) {
    try {
      const validStatuses = ['pendiente', 'respondido'];

      if (!validStatuses.includes(status)) {
        throw new Error(`Estado inválido. Debe ser: ${validStatuses.join(', ')}`);
      }

      await db.query(
        'UPDATE customer_opinions SET status = ? WHERE id = ?',
        [status, id]
      );

      logger.info(`Estado de opinión ${id} actualizado a: ${status}`);

      return await this.getOpinionById(id);

    } catch (error) {
      logger.error('Error actualizando estado de opinión:', error);
      throw error;
    }
  }

  // =================================================================
  // ELIMINAR OPINIÓN
  // =================================================================
  static async deleteOpinion(id) {
    try {
      // Verificar que la opinión existe
      await this.getOpinionById(id);

      await db.query('DELETE FROM customer_opinions WHERE id = ?', [id]);

      logger.info(`Opinión ${id} eliminada`);

      return { message: 'Opinión eliminada exitosamente' };

    } catch (error) {
      logger.error('Error eliminando opinión:', error);
      throw error;
    }
  }

  // =================================================================
  // OBTENER ESTADÍSTICAS DE OPINIONES
  // =================================================================
  static async getOpinionStats() {
    try {
      const stats = await db.query(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
          SUM(CASE WHEN status = 'respondido' THEN 1 ELSE 0 END) as respondidas,
          COUNT(DISTINCT inquiry_type) as tipos_consulta
        FROM customer_opinions
      `);

      // Obtener distribución por tipo de consulta
      const byType = await db.query(`
        SELECT
          inquiry_type,
          COUNT(*) as count
        FROM customer_opinions
        GROUP BY inquiry_type
        ORDER BY count DESC
      `);

      // Obtener opiniones recientes (últimas 5)
      const recent = await db.query(`
        SELECT id, name, lastname, inquiry_type, created_at, status
        FROM customer_opinions
        ORDER BY created_at DESC
        LIMIT 5
      `);

      return {
        summary: stats[0],
        by_type: byType,
        recent: recent
      };

    } catch (error) {
      logger.error('Error obteniendo estadísticas de opiniones:', error);
      throw error;
    }
  }
}

module.exports = OpinionService;
