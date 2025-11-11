// ===================================================================
// PROSPERPOS - RUTAS DE PROVEEDORES (SIMPLIFICADO)
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
 * @route   GET /api/v1/suppliers
 * @desc    Obtener lista de proveedores
 * @access  Private (suppliers.read)
 */
router.get('/',
  requirePermission('suppliers.read'),
  async (req, res) => {
    try {
      const query = `
        SELECT s.*,
               bt.nombre as beneficiary_type_name
        FROM suppliers s
        LEFT JOIN beneficiary_types bt ON s.tipo_beneficiario = bt.id
        WHERE s.deleted_at IS NULL
        ORDER BY s.id ASC
      `;
      const suppliers = await db.query(query);

      return sendSuccessResponse(res, suppliers, 'Proveedores obtenidos exitosamente');

    } catch (error) {
      logger.error('Error getting suppliers:', error);
      return sendErrorResponse(res, 500, 'Error al obtener proveedores');
    }
  }
);


/**
 * @route   GET /api/v1/suppliers/:id
 * @desc    Obtener proveedor por ID
 * @access  Private (suppliers.read)
 */
router.get('/:id',
  requirePermission('suppliers.read'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const suppliers = await db.query(
        'SELECT * FROM suppliers WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (suppliers.length === 0) {
        return sendErrorResponse(res, 404, 'Proveedor no encontrado');
      }

      return sendSuccessResponse(res, suppliers[0], 'Proveedor obtenido exitosamente');

    } catch (error) {
      logger.error('Error getting supplier:', error);
      return sendErrorResponse(res, 500, 'Error al obtener proveedor');
    }
  }
);

/**
 * @route   POST /api/v1/suppliers
 * @desc    Crear nuevo proveedor
 * @access  Private (suppliers.create)
 */
router.post('/',
  requirePermission('suppliers.create'),
  async (req, res) => {
    try {
      const {
        nombre,
        tipo_proveedor,
        doc_identificacion,
        usa_credito,
        tipo_beneficiario,
        is_active
      } = req.body;

      const created_by = req.user.id;

      // Validaciones
      if (!nombre) {
        return sendErrorResponse(res, 400, 'Nombre es requerido');
      }

      // Insertar proveedor
      const query = `
        INSERT INTO suppliers (
          nombre, tipo_proveedor, doc_identificacion,
          usa_credito, tipo_beneficiario, is_active,
          created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const result = await db.query(query, [
        nombre, tipo_proveedor || null, doc_identificacion || null,
        usa_credito !== undefined ? usa_credito : false, tipo_beneficiario || '1',
        is_active !== undefined ? is_active : true, created_by
      ]);

      const newSupplier = await db.query(
        'SELECT * FROM suppliers WHERE id = ?',
        [result.insertId]
      );

      return sendSuccessResponse(res, newSupplier[0], 'Proveedor creado exitosamente', 201);

    } catch (error) {
      logger.error('Error creating supplier:', error);
      return sendErrorResponse(res, 500, 'Error al crear proveedor');
    }
  }
);

/**
 * @route   PUT /api/v1/suppliers/:id
 * @desc    Actualizar proveedor
 * @access  Private (suppliers.update)
 */
router.put('/:id',
  requirePermission('suppliers.update'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updated_by = req.user.id;

      // Verificar que existe
      const existing = await db.query(
        'SELECT id FROM suppliers WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        return sendErrorResponse(res, 404, 'Proveedor no encontrado');
      }

      // Construir query de actualización
      const allowedFields = [
        'nombre', 'tipo_proveedor', 'doc_identificacion',
        'usa_credito', 'tipo_beneficiario', 'is_active'
      ];

      const updates = [];
      const values = [];

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(req.body[field]);
        }
      });

      if (updates.length === 0) {
        return sendErrorResponse(res, 400, 'No hay campos para actualizar');
      }

      updates.push('updated_by = ?');
      updates.push('updated_at = NOW()');
      values.push(updated_by);
      values.push(id);

      const query = `UPDATE suppliers SET ${updates.join(', ')} WHERE id = ?`;
      await db.query(query, values);

      const updatedSupplier = await db.query(
        'SELECT * FROM suppliers WHERE id = ?',
        [id]
      );

      return sendSuccessResponse(res, updatedSupplier[0], 'Proveedor actualizado exitosamente');

    } catch (error) {
      logger.error('Error updating supplier:', error);
      return sendErrorResponse(res, 500, 'Error al actualizar proveedor');
    }
  }
);

/**
 * @route   DELETE /api/v1/suppliers/:id
 * @desc    Eliminar proveedor (soft delete)
 * @access  Private (suppliers.delete)
 */
router.delete('/:id',
  requirePermission('suppliers.delete'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const deleted_by = req.user.id;

      // Verificar que existe
      const existing = await db.query(
        'SELECT id FROM suppliers WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        return sendErrorResponse(res, 404, 'Proveedor no encontrado');
      }

      // Verificar si tiene compras asociadas
      const purchases = await db.query(
        'SELECT COUNT(*) as count FROM purchases WHERE supplier_id = ?',
        [id]
      );

      if (purchases[0].count > 0) {
        return sendErrorResponse(res, 409, 
          `No se puede eliminar el proveedor porque tiene ${purchases[0].count} compra(s) asociada(s)`
        );
      }

      // Soft delete
      await db.query(
        'UPDATE suppliers SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
        [deleted_by, id]
      );

      return sendSuccessResponse(res, null, 'Proveedor eliminado exitosamente');

    } catch (error) {
      logger.error('Error deleting supplier:', error);
      return sendErrorResponse(res, 500, 'Error al eliminar proveedor');
    }
  }
);

module.exports = router;