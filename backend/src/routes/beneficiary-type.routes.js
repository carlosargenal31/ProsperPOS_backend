// ===================================================================
// PROSPERPOS - RUTAS DE TIPOS DE BENEFICIARIOS
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
 * @route   GET /api/v1/beneficiary-types
 * @desc    Obtener todos los tipos de beneficiarios
 * @access  Private (beneficiary_types.read)
 */
router.get('/',
  requirePermission('beneficiary_types.read'),
  async (req, res) => {
    try {
      const query = 'SELECT * FROM beneficiary_types WHERE deleted_at IS NULL ORDER BY id ASC';
      const beneficiaryTypes = await db.query(query);

      return sendSuccessResponse(res, beneficiaryTypes, 'Tipos de beneficiarios obtenidos exitosamente');

    } catch (error) {
      logger.error('Error getting beneficiary types:', error);
      return sendErrorResponse(res, 500, 'Error al obtener tipos de beneficiarios');
    }
  }
);

/**
 * @route   GET /api/v1/beneficiary-types/active
 * @desc    Obtener tipos de beneficiarios activos
 * @access  Private (beneficiary_types.read)
 */
router.get('/active',
  requirePermission('beneficiary_types.read'),
  async (req, res) => {
    try {
      const query = 'SELECT * FROM beneficiary_types WHERE is_active = 1 AND deleted_at IS NULL ORDER BY id ASC';
      const beneficiaryTypes = await db.query(query);

      return sendSuccessResponse(res, beneficiaryTypes, 'Tipos de beneficiarios activos obtenidos exitosamente');

    } catch (error) {
      logger.error('Error getting active beneficiary types:', error);
      return sendErrorResponse(res, 500, 'Error al obtener tipos de beneficiarios activos');
    }
  }
);

/**
 * @route   GET /api/v1/beneficiary-types/:id
 * @desc    Obtener tipo de beneficiario por ID
 * @access  Private (beneficiary_types.read)
 */
router.get('/:id',
  requirePermission('beneficiary_types.read'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const beneficiaryTypes = await db.query(
        'SELECT * FROM beneficiary_types WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (beneficiaryTypes.length === 0) {
        return sendErrorResponse(res, 404, 'Tipo de beneficiario no encontrado');
      }

      return sendSuccessResponse(res, beneficiaryTypes[0], 'Tipo de beneficiario obtenido exitosamente');

    } catch (error) {
      logger.error('Error getting beneficiary type:', error);
      return sendErrorResponse(res, 500, 'Error al obtener tipo de beneficiario');
    }
  }
);

/**
 * @route   POST /api/v1/beneficiary-types
 * @desc    Crear nuevo tipo de beneficiario
 * @access  Private (beneficiary_types.create)
 */
router.post('/',
  requirePermission('beneficiary_types.create'),
  async (req, res) => {
    try {
      const { nombre, is_active } = req.body;
      const created_by = req.user.id;

      // Validaciones
      if (!nombre) {
        return sendErrorResponse(res, 400, 'Nombre es requerido');
      }

      // Verificar que el nombre no exista
      const existing = await db.query(
        'SELECT id FROM beneficiary_types WHERE nombre = ? AND deleted_at IS NULL',
        [nombre.trim().toUpperCase()]
      );

      if (existing.length > 0) {
        return sendErrorResponse(res, 409, 'Ya existe un tipo de beneficiario con ese nombre');
      }

      // Insertar tipo de beneficiario
      const query = `
        INSERT INTO beneficiary_types (
          nombre, is_active, created_by, created_at
        ) VALUES (?, ?, ?, NOW())
      `;

      const result = await db.query(query, [
        nombre.trim().toUpperCase(),
        is_active !== undefined ? is_active : true,
        created_by
      ]);

      const newBeneficiaryType = await db.query(
        'SELECT * FROM beneficiary_types WHERE id = ?',
        [result.insertId]
      );

      return sendSuccessResponse(res, newBeneficiaryType[0], 'Tipo de beneficiario creado exitosamente', 201);

    } catch (error) {
      logger.error('Error creating beneficiary type:', error);
      return sendErrorResponse(res, 500, 'Error al crear tipo de beneficiario');
    }
  }
);

/**
 * @route   PUT /api/v1/beneficiary-types/:id
 * @desc    Actualizar tipo de beneficiario
 * @access  Private (beneficiary_types.update)
 */
router.put('/:id',
  requirePermission('beneficiary_types.update'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updated_by = req.user.id;

      // Verificar que existe
      const existing = await db.query(
        'SELECT id FROM beneficiary_types WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        return sendErrorResponse(res, 404, 'Tipo de beneficiario no encontrado');
      }

      // Construir query de actualización
      const allowedFields = ['nombre', 'is_active'];
      const updates = [];
      const values = [];

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          if (field === 'nombre') {
            updates.push(`${field} = ?`);
            values.push(req.body[field].trim().toUpperCase());
          } else {
            updates.push(`${field} = ?`);
            values.push(req.body[field]);
          }
        }
      });

      if (updates.length === 0) {
        return sendErrorResponse(res, 400, 'No hay campos para actualizar');
      }

      // Verificar nombre único si se está actualizando
      if (req.body.nombre) {
        const nameExists = await db.query(
          'SELECT id FROM beneficiary_types WHERE nombre = ? AND id != ? AND deleted_at IS NULL',
          [req.body.nombre.trim().toUpperCase(), id]
        );

        if (nameExists.length > 0) {
          return sendErrorResponse(res, 409, 'Ya existe un tipo de beneficiario con ese nombre');
        }
      }

      updates.push('updated_by = ?');
      updates.push('updated_at = NOW()');
      values.push(updated_by);
      values.push(id);

      const query = `UPDATE beneficiary_types SET ${updates.join(', ')} WHERE id = ?`;
      await db.query(query, values);

      const updatedBeneficiaryType = await db.query(
        'SELECT * FROM beneficiary_types WHERE id = ?',
        [id]
      );

      return sendSuccessResponse(res, updatedBeneficiaryType[0], 'Tipo de beneficiario actualizado exitosamente');

    } catch (error) {
      logger.error('Error updating beneficiary type:', error);
      return sendErrorResponse(res, 500, 'Error al actualizar tipo de beneficiario');
    }
  }
);

/**
 * @route   DELETE /api/v1/beneficiary-types/:id
 * @desc    Eliminar tipo de beneficiario (soft delete)
 * @access  Private (beneficiary_types.delete)
 */
router.delete('/:id',
  requirePermission('beneficiary_types.delete'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const deleted_by = req.user.id;

      // Verificar que existe
      const existing = await db.query(
        'SELECT id FROM beneficiary_types WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        return sendErrorResponse(res, 404, 'Tipo de beneficiario no encontrado');
      }

      // Verificar si está en uso en customers
      const usedInCustomers = await db.query(
        'SELECT COUNT(*) as count FROM customers WHERE tipo_beneficiario = ?',
        [id]
      );

      if (usedInCustomers[0].count > 0) {
        return sendErrorResponse(res, 409,
          `No se puede eliminar el tipo de beneficiario porque está asignado a ${usedInCustomers[0].count} cliente(s)`
        );
      }

      // Verificar si está en uso en suppliers
      const usedInSuppliers = await db.query(
        'SELECT COUNT(*) as count FROM suppliers WHERE tipo_beneficiario = ?',
        [id]
      );

      if (usedInSuppliers[0].count > 0) {
        return sendErrorResponse(res, 409,
          `No se puede eliminar el tipo de beneficiario porque está asignado a ${usedInSuppliers[0].count} proveedor(es)`
        );
      }

      // Soft delete
      await db.query(
        'UPDATE beneficiary_types SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
        [deleted_by, id]
      );

      return sendSuccessResponse(res, null, 'Tipo de beneficiario eliminado exitosamente');

    } catch (error) {
      logger.error('Error deleting beneficiary type:', error);
      return sendErrorResponse(res, 500, 'Error al eliminar tipo de beneficiario');
    }
  }
);

module.exports = router;
