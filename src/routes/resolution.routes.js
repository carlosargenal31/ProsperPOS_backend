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
