// ===================================================================
// PROSPERPOS - RUTAS DE CLIENTES
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
 * @route   GET /api/v1/customers
 * @desc    Obtener lista de clientes
 * @access  Private (customers.read)
 */
router.get('/',
  requirePermission('customers.read'),
  async (req, res) => {
    try {
      const query = 'SELECT * FROM customers WHERE deleted_at IS NULL ORDER BY id ASC';
      const customers = await db.query(query);

      return sendSuccessResponse(res, customers, 'Clientes obtenidos exitosamente');

    } catch (error) {
      logger.error('Error getting customers:', error);
      return sendErrorResponse(res, 500, 'Error al obtener clientes');
    }
  }
);

/**
 * @route   GET /api/v1/customers/:id
 * @desc    Obtener cliente por ID
 * @access  Private (customers.read)
 */
router.get('/:id',
  requirePermission('customers.read'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const customers = await db.query(
        'SELECT * FROM customers WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (customers.length === 0) {
        return sendErrorResponse(res, 404, 'Cliente no encontrado');
      }

      return sendSuccessResponse(res, customers[0], 'Cliente obtenido exitosamente');

    } catch (error) {
      logger.error('Error getting customer:', error);
      return sendErrorResponse(res, 500, 'Error al obtener cliente');
    }
  }
);

/**
 * @route   POST /api/v1/customers
 * @desc    Crear nuevo cliente
 * @access  Private (customers.create)
 */
router.post('/',
  requirePermission('customers.create'),
  async (req, res) => {
    try {
      const {
        codigo,
        nombre,
        nombre_comercial,
        codigo_tipo_precio,
        fecha_inicio,
        doc_identificacion,
        telefono,
        email,
        direccion,
        descuento_prc,
        persona_contacto,
        tipo_beneficiario,
        is_active
      } = req.body;

      const created_by = req.user.id;

      // Validaciones
      if (!codigo || !nombre) {
        return sendErrorResponse(res, 400, 'Código y nombre son requeridos');
      }

      // Verificar código duplicado
      const existing = await db.query(
        'SELECT id FROM customers WHERE codigo = ? AND deleted_at IS NULL',
        [codigo]
      );

      if (existing.length > 0) {
        return sendErrorResponse(res, 409, 'Ya existe un cliente con ese código');
      }

      // Insertar cliente
      const query = `
        INSERT INTO customers (
          codigo, nombre, nombre_comercial, codigo_tipo_precio, fecha_inicio,
          doc_identificacion, telefono, email, direccion, descuento_prc,
          persona_contacto, tipo_beneficiario, is_active,
          created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const result = await db.query(query, [
        codigo, nombre, nombre_comercial || null, codigo_tipo_precio || null, fecha_inicio || null,
        doc_identificacion || null, telefono || null, email || null, direccion || null, descuento_prc || 0,
        persona_contacto || null, tipo_beneficiario || '1', is_active !== undefined ? is_active : true,
        created_by
      ]);

      const newCustomer = await db.query(
        'SELECT * FROM customers WHERE id = ?',
        [result.insertId]
      );

      return sendSuccessResponse(res, newCustomer[0], 'Cliente creado exitosamente', 201);

    } catch (error) {
      logger.error('Error creating customer:', error);
      return sendErrorResponse(res, 500, 'Error al crear cliente');
    }
  }
);

/**
 * @route   PUT /api/v1/customers/:id
 * @desc    Actualizar cliente
 * @access  Private (customers.update)
 */
router.put('/:id',
  requirePermission('customers.update'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updated_by = req.user.id;

      // Verificar que existe
      const existing = await db.query(
        'SELECT id FROM customers WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        return sendErrorResponse(res, 404, 'Cliente no encontrado');
      }

      // Construir query de actualización
      const allowedFields = [
        'codigo', 'nombre', 'nombre_comercial', 'codigo_tipo_precio', 'fecha_inicio',
        'doc_identificacion', 'telefono', 'email', 'direccion', 'descuento_prc',
        'persona_contacto', 'tipo_beneficiario', 'is_active'
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

      const query = `UPDATE customers SET ${updates.join(', ')} WHERE id = ?`;
      await db.query(query, values);

      const updatedCustomer = await db.query(
        'SELECT * FROM customers WHERE id = ?',
        [id]
      );

      return sendSuccessResponse(res, updatedCustomer[0], 'Cliente actualizado exitosamente');

    } catch (error) {
      logger.error('Error updating customer:', error);
      return sendErrorResponse(res, 500, 'Error al actualizar cliente');
    }
  }
);

/**
 * @route   DELETE /api/v1/customers/:id
 * @desc    Eliminar cliente (soft delete)
 * @access  Private (customers.delete)
 */
router.delete('/:id',
  requirePermission('customers.delete'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const deleted_by = req.user.id;

      // Verificar que existe
      const existing = await db.query(
        'SELECT id FROM customers WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        return sendErrorResponse(res, 404, 'Cliente no encontrado');
      }

      // Soft delete
      await db.query(
        'UPDATE customers SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
        [deleted_by, id]
      );

      return sendSuccessResponse(res, null, 'Cliente eliminado exitosamente');

    } catch (error) {
      logger.error('Error deleting customer:', error);
      return sendErrorResponse(res, 500, 'Error al eliminar cliente');
    }
  }
);

module.exports = router;
