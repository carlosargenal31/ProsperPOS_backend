// ===================================================================
// PROSPERPOS - RUTAS DE RESOLUCIONES DIAN
// ===================================================================

const express = require('express');
const router = express.Router();
const db = require('../utils/database');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Middleware global de autenticación
router.use(authenticateToken);

/**
 * @route   GET /api/v1/resolutions
 * @desc    Obtener todas las resoluciones
 * @access  Private
 */
router.get('/',
  requirePermission('resolutions.read'),
  async (req, res) => {
    try {
      const query = 'SELECT * FROM resolutions WHERE deleted_at IS NULL ORDER BY created_at DESC';
      const resolutions = await db.query(query);

      return sendSuccessResponse(res, resolutions, 'Resoluciones obtenidas exitosamente');

    } catch (error) {
      logger.error('Error getting resolutions:', error);
      return sendErrorResponse(res, 500, 'Error al obtener las resoluciones');
    }
  }
);


/**
 * @route   GET /api/v1/resolutions/active
 * @desc    Obtener la resolución activa actual
 * @access  Private
 * @query   store_id - ID de la tienda (opcional)
 */
router.get('/active',
  requirePermission('resolutions.read'),
  async (req, res) => {
    try {
      // Nota: store_id se ignora por ahora ya que la tabla no tiene esa columna
      // const { store_id } = req.query;

      const query = `
        SELECT * FROM resolutions
        WHERE is_active = 1
        AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const resolutions = await db.query(query);

      if (!resolutions || resolutions.length === 0) {
        return sendErrorResponse(res, 404, 'No hay resolución activa disponible');
      }

      const resolution = resolutions[0];

      // Formatear fecha_fin a string sin timezone y SUMAR +1 día
      if (resolution.fecha_fin) {
        const d = new Date(resolution.fecha_fin);
        d.setUTCDate(d.getUTCDate() + 1); // +1 día para compensar timezone
        resolution.fecha_fin = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
      }

      // Verificar si la resolución está vencida
      const currentDate = new Date();
      const endDate = new Date(resolution.fecha_fin);
      const isExpired = currentDate > endDate;

      // Agregar información de estado de vencimiento
      const responseData = {
        ...resolution,
        is_expired: isExpired,
        days_until_expiration: isExpired ? 0 : Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24))
      };

      return sendSuccessResponse(res, responseData, 'Resolución activa obtenida exitosamente');

    } catch (error) {
      logger.error('Error getting active resolution:', error);
      return sendErrorResponse(res, 500, 'Error al obtener la resolución activa');
    }
  }
);

/**
 * @route   GET /api/v1/resolutions/:id
 * @desc    Obtener una resolución por ID
 * @access  Private
 */
router.get('/:id',
  requirePermission('resolutions.read'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const query = 'SELECT * FROM resolutions WHERE id = ? AND deleted_at IS NULL';
      const resolutions = await db.query(query, [id]);

      if (!resolutions || resolutions.length === 0) {
        return sendErrorResponse(res, 404, 'Resolución no encontrada');
      }

      return sendSuccessResponse(res, resolutions[0], 'Resolución obtenida exitosamente');

    } catch (error) {
      logger.error('Error getting resolution:', error);
      return sendErrorResponse(res, 500, 'Error al obtener la resolución');
    }
  }
);

/**
 * @route   POST /api/v1/resolutions
 * @desc    Crear nueva resolución
 * @access  Private
 */
router.post('/',
  requirePermission('resolutions.create'),
  async (req, res) => {
    try {
      const {
        numero_resolucion,
        prefijo_control,
        fecha_inicio,
        fecha_fin,
        is_active,
        notas,
        nro_inicial_control,
        nro_final_control,
        nro_actual_control,
        sufijo_control,
        nro_critico,
        alertar_dias_antes,
        alertar_porcentaje_uso,
        alertar_en_nro_control
      } = req.body;

      // Validaciones
      if (!numero_resolucion || !fecha_inicio || !fecha_fin) {
        return sendErrorResponse(res, 400, 'Todos los campos obligatorios deben ser completados');
      }

      // Validar fechas
      if (new Date(fecha_fin) < new Date(fecha_inicio)) {
        return sendErrorResponse(res, 400, 'La fecha de fin debe ser mayor o igual a la fecha de inicio');
      }

      // Verificar si ya existe el número de resolución
      const existingQuery = 'SELECT id FROM resolutions WHERE numero_resolucion = ? AND deleted_at IS NULL';
      const existing = await db.query(existingQuery, [numero_resolucion]);

      if (existing && existing.length > 0) {
        return sendErrorResponse(res, 400, 'Ya existe una resolución con este número');
      }

      const insertQuery = `
        INSERT INTO resolutions
        (numero_resolucion, prefijo_control, fecha_inicio, fecha_fin, is_active, notas,
         nro_inicial_control, nro_final_control, nro_actual_control, sufijo_control,
         nro_critico, alertar_dias_antes, alertar_porcentaje_uso, alertar_en_nro_control, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await db.query(insertQuery, [
        numero_resolucion,
        prefijo_control || null,
        fecha_inicio,
        fecha_fin,
        is_active !== undefined ? is_active : 1,
        notas || null,
        nro_inicial_control || 0,
        nro_final_control || 0,
        nro_actual_control || nro_inicial_control || 0,
        sufijo_control || null,
        nro_critico || 0,
        alertar_dias_antes || 6,
        alertar_porcentaje_uso || 99,
        alertar_en_nro_control || 0,
        req.user.id
      ]);

      return sendSuccessResponse(res, { id: result.insertId }, 'Resolución creada exitosamente', 201);

    } catch (error) {
      logger.error('Error creating resolution:', error);
      return sendErrorResponse(res, 500, 'Error al crear la resolución');
    }
  }
);

/**
 * @route   PUT /api/v1/resolutions/:id
 * @desc    Actualizar resolución
 * @access  Private
 */
router.put('/:id',
  requirePermission('resolutions.update'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        numero_resolucion,
        prefijo_control,
        fecha_inicio,
        fecha_fin,
        is_active,
        notas,
        nro_inicial_control,
        nro_final_control,
        nro_actual_control,
        sufijo_control,
        nro_critico,
        alertar_dias_antes,
        alertar_porcentaje_uso,
        alertar_en_nro_control
      } = req.body;

      // Validaciones
      if (!numero_resolucion || !fecha_inicio || !fecha_fin) {
        return sendErrorResponse(res, 400, 'Todos los campos obligatorios deben ser completados');
      }

      // Validar fechas
      if (new Date(fecha_fin) < new Date(fecha_inicio)) {
        return sendErrorResponse(res, 400, 'La fecha de fin debe ser mayor o igual a la fecha de inicio');
      }

      // Verificar si existe otra resolución con el mismo número
      const existingQuery = 'SELECT id FROM resolutions WHERE numero_resolucion = ? AND id != ? AND deleted_at IS NULL';
      const existing = await db.query(existingQuery, [numero_resolucion, id]);

      if (existing && existing.length > 0) {
        return sendErrorResponse(res, 400, 'Ya existe otra resolución con este número');
      }

      const updateQuery = `
        UPDATE resolutions
        SET numero_resolucion = ?, prefijo_control = ?, fecha_inicio = ?, fecha_fin = ?,
            is_active = ?, notas = ?, nro_inicial_control = ?, nro_final_control = ?,
            nro_actual_control = ?, sufijo_control = ?, nro_critico = ?,
            alertar_dias_antes = ?, alertar_porcentaje_uso = ?, alertar_en_nro_control = ?,
            updated_by = ?
        WHERE id = ? AND deleted_at IS NULL
      `;

      const result = await db.query(updateQuery, [
        numero_resolucion,
        prefijo_control || null,
        fecha_inicio,
        fecha_fin,
        is_active !== undefined ? is_active : 1,
        notas || null,
        nro_inicial_control || 0,
        nro_final_control || 0,
        nro_actual_control || 0,
        sufijo_control || null,
        nro_critico || 0,
        alertar_dias_antes || 6,
        alertar_porcentaje_uso || 99,
        alertar_en_nro_control || 0,
        req.user.id,
        id
      ]);

      if (result.affectedRows === 0) {
        return sendErrorResponse(res, 404, 'Resolución no encontrada');
      }

      return sendSuccessResponse(res, null, 'Resolución actualizada exitosamente');

    } catch (error) {
      logger.error('Error updating resolution:', error);
      return sendErrorResponse(res, 500, 'Error al actualizar la resolución');
    }
  }
);

/**
 * @route   PATCH /api/v1/resolutions/:id/increment
 * @desc    Incrementar el consecutivo actual de una resolución
 * @access  Private
 */
router.patch('/:id/increment',
  requirePermission('resolutions.update'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar que existe
      const checkQuery = 'SELECT id, nro_actual_control FROM resolutions WHERE id = ? AND deleted_at IS NULL';
      const existing = await db.query(checkQuery, [id]);

      if (!existing || existing.length === 0) {
        return sendErrorResponse(res, 404, 'Resolución no encontrada');
      }

      // Incrementar consecutivo
      const updateQuery = `
        UPDATE resolutions
        SET nro_actual_control = nro_actual_control + 1,
            updated_by = ?
        WHERE id = ? AND deleted_at IS NULL
      `;

      await db.query(updateQuery, [req.user.id, id]);

      // Obtener el nuevo valor
      const newValueQuery = 'SELECT nro_actual_control FROM resolutions WHERE id = ?';
      const result = await db.query(newValueQuery, [id]);

      return sendSuccessResponse(res, { nro_actual_control: result[0].nro_actual_control }, 'Consecutivo incrementado exitosamente');

    } catch (error) {
      logger.error('Error incrementing resolution consecutive:', error);
      return sendErrorResponse(res, 500, 'Error al incrementar el consecutivo');
    }
  }
);

/**
 * @route   DELETE /api/v1/resolutions/:id
 * @desc    Eliminar resolución (soft delete)
 * @access  Private
 */
router.delete('/:id',
  requirePermission('resolutions.delete'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const deleteQuery = 'UPDATE resolutions SET deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE id = ? AND deleted_at IS NULL';
      const result = await db.query(deleteQuery, [req.user.id, id]);

      if (result.affectedRows === 0) {
        return sendErrorResponse(res, 404, 'Resolución no encontrada');
      }

      return sendSuccessResponse(res, null, 'Resolución eliminada exitosamente');

    } catch (error) {
      logger.error('Error deleting resolution:', error);
      return sendErrorResponse(res, 500, 'Error al eliminar la resolución');
    }
  }
);

module.exports = router;
