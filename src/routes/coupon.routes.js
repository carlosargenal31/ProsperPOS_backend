// ===================================================================
// PROSPERPOS - RUTAS DE CUPONES
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
 * @route   GET /api/v1/coupons
 * @desc    Obtener todos los cupones
 * @access  Private (coupons.read)
 */
router.get('/',
  requirePermission('coupons.read'),
  async (req, res) => {
    try {
      const query = `
        SELECT c.*,
               cat.nombre as grupo_nombre,
               sub.nombre as subgrupo_nombre,
               p.nombre as articulo_nombre
        FROM coupons c
        LEFT JOIN categories cat ON c.grupo_id = cat.id
        LEFT JOIN subcategories sub ON c.subgrupo_id = sub.id
        LEFT JOIN products p ON c.articulo_id = p.id
        WHERE c.deleted_at IS NULL
        ORDER BY c.id DESC
      `;
      const coupons = await db.query(query);

      return sendSuccessResponse(res, coupons, 'Cupones obtenidos exitosamente');

    } catch (error) {
      logger.error('Error getting coupons:', error);
      return sendErrorResponse(res, 500, 'Error al obtener cupones');
    }
  }
);

/**
 * @route   GET /api/v1/coupons/active
 * @desc    Obtener cupones activos
 * @access  Private (coupons.read)
 */
router.get('/active',
  requirePermission('coupons.read'),
  async (req, res) => {
    try {
      const query = `
        SELECT c.*,
               cat.nombre as grupo_nombre,
               sub.nombre as subgrupo_nombre,
               p.nombre as articulo_nombre
        FROM coupons c
        LEFT JOIN categories cat ON c.grupo_id = cat.id
        LEFT JOIN subcategories sub ON c.subgrupo_id = sub.id
        LEFT JOIN products p ON c.articulo_id = p.id
        WHERE c.is_active = 1
          AND c.suspendido = 0
          AND c.deleted_at IS NULL
          AND c.fecha_desde <= CURDATE()
          AND c.fecha_hasta >= CURDATE()
        ORDER BY c.id DESC
      `;
      const coupons = await db.query(query);

      return sendSuccessResponse(res, coupons, 'Cupones activos obtenidos exitosamente');

    } catch (error) {
      logger.error('Error getting active coupons:', error);
      return sendErrorResponse(res, 500, 'Error al obtener cupones activos');
    }
  }
);

/**
 * @route   GET /api/v1/coupons/:id
 * @desc    Obtener cupón por ID
 * @access  Private (coupons.read)
 */
router.get('/:id',
  requirePermission('coupons.read'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const query = `
        SELECT c.*,
               cat.nombre as grupo_nombre,
               sub.nombre as subgrupo_nombre,
               p.nombre as articulo_nombre
        FROM coupons c
        LEFT JOIN categories cat ON c.grupo_id = cat.id
        LEFT JOIN subcategories sub ON c.subgrupo_id = sub.id
        LEFT JOIN products p ON c.articulo_id = p.id
        WHERE c.id = ? AND c.deleted_at IS NULL
      `;
      const coupons = await db.query(query, [id]);

      if (coupons.length === 0) {
        return sendErrorResponse(res, 404, 'Cupón no encontrado');
      }

      // Si es múltiples artículos, obtener los productos relacionados
      if (coupons[0].aplicar_a === 'multiples_articulos') {
        const productsQuery = `
          SELECT p.id, p.nombre
          FROM coupon_products cp
          JOIN products p ON cp.product_id = p.id
          WHERE cp.coupon_id = ?
        `;
        const products = await db.query(productsQuery, [id]);
        coupons[0].productos = products;
      }

      return sendSuccessResponse(res, coupons[0], 'Cupón obtenido exitosamente');

    } catch (error) {
      logger.error('Error getting coupon:', error);
      return sendErrorResponse(res, 500, 'Error al obtener cupón');
    }
  }
);

/**
 * @route   POST /api/v1/coupons
 * @desc    Crear nuevo cupón
 * @access  Private (coupons.create)
 */
router.post('/',
  requirePermission('coupons.create'),
  async (req, res) => {
    try {
      const {
        codigo,
        nombre,
        tipo_descuento,
        valor_descuento,
        fecha_desde,
        fecha_hasta,
        aplicar_a,
        grupo_id,
        subgrupo_id,
        articulo_id,
        productos,
        suspendido,
        is_active
      } = req.body;
      const created_by = req.user.id;

      // Validaciones
      if (!codigo || !nombre || !tipo_descuento || !valor_descuento || !fecha_desde || !fecha_hasta || !aplicar_a) {
        return sendErrorResponse(res, 400, 'Campos requeridos faltantes');
      }

      // Verificar que el código no exista
      const existing = await db.query(
        'SELECT id FROM coupons WHERE codigo = ? AND deleted_at IS NULL',
        [codigo.trim().toUpperCase()]
      );

      if (existing.length > 0) {
        return sendErrorResponse(res, 409, 'Ya existe un cupón con ese código');
      }

      // Insertar cupón
      const query = `
        INSERT INTO coupons (
          codigo, nombre, tipo_descuento, valor_descuento, fecha_desde, fecha_hasta,
          aplicar_a, grupo_id, subgrupo_id, articulo_id, suspendido, is_active,
          created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const result = await db.query(query, [
        codigo.trim().toUpperCase(),
        nombre.trim(),
        tipo_descuento,
        valor_descuento,
        fecha_desde,
        fecha_hasta,
        aplicar_a,
        grupo_id || null,
        subgrupo_id || null,
        articulo_id || null,
        suspendido || 0,
        is_active !== undefined ? is_active : 1,
        created_by
      ]);

      // Si es múltiples artículos, insertar relaciones
      if (aplicar_a === 'multiples_articulos' && productos && productos.length > 0) {
        const values = productos.map(productId => [result.insertId, productId]);
        await db.query(
          'INSERT INTO coupon_products (coupon_id, product_id) VALUES ?',
          [values]
        );
      }

      const newCoupon = await db.query(
        'SELECT * FROM coupons WHERE id = ?',
        [result.insertId]
      );

      return sendSuccessResponse(res, newCoupon[0], 'Cupón creado exitosamente', 201);

    } catch (error) {
      logger.error('Error creating coupon:', error);
      return sendErrorResponse(res, 500, 'Error al crear cupón');
    }
  }
);

/**
 * @route   PUT /api/v1/coupons/:id
 * @desc    Actualizar cupón
 * @access  Private (coupons.update)
 */
router.put('/:id',
  requirePermission('coupons.update'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updated_by = req.user.id;

      // Verificar que el cupón existe
      const existing = await db.query(
        'SELECT * FROM coupons WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        return sendErrorResponse(res, 404, 'Cupón no encontrado');
      }

      // Construir query de actualización
      const allowedFields = [
        'codigo', 'nombre', 'tipo_descuento', 'valor_descuento',
        'fecha_desde', 'fecha_hasta', 'aplicar_a', 'grupo_id',
        'subgrupo_id', 'articulo_id', 'suspendido', 'is_active'
      ];
      const updates = [];
      const values = [];

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          if (field === 'codigo' || field === 'nombre') {
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

      // Verificar código único si se está actualizando
      if (req.body.codigo) {
        const codeExists = await db.query(
          'SELECT id FROM coupons WHERE codigo = ? AND id != ? AND deleted_at IS NULL',
          [req.body.codigo.trim().toUpperCase(), id]
        );

        if (codeExists.length > 0) {
          return sendErrorResponse(res, 409, 'Ya existe un cupón con ese código');
        }
      }

      updates.push('updated_by = ?');
      updates.push('updated_at = NOW()');
      values.push(updated_by);
      values.push(id);

      const updateQuery = `UPDATE coupons SET ${updates.join(', ')} WHERE id = ?`;
      await db.query(updateQuery, values);

      // Actualizar productos si es múltiples artículos
      if (req.body.aplicar_a === 'multiples_articulos' && req.body.productos) {
        // Eliminar relaciones existentes
        await db.query('DELETE FROM coupon_products WHERE coupon_id = ?', [id]);

        // Insertar nuevas relaciones
        if (req.body.productos.length > 0) {
          const productValues = req.body.productos.map(productId => [id, productId]);
          await db.query(
            'INSERT INTO coupon_products (coupon_id, product_id) VALUES ?',
            [productValues]
          );
        }
      }

      const updatedCoupon = await db.query(
        'SELECT * FROM coupons WHERE id = ?',
        [id]
      );

      return sendSuccessResponse(res, updatedCoupon[0], 'Cupón actualizado exitosamente');

    } catch (error) {
      logger.error('Error updating coupon:', error);
      return sendErrorResponse(res, 500, 'Error al actualizar cupón');
    }
  }
);

/**
 * @route   DELETE /api/v1/coupons/:id
 * @desc    Eliminar cupón (soft delete)
 * @access  Private (coupons.delete)
 */
router.delete('/:id',
  requirePermission('coupons.delete'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const deleted_by = req.user.id;

      const existing = await db.query(
        'SELECT * FROM coupons WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (existing.length === 0) {
        return sendErrorResponse(res, 404, 'Cupón no encontrado');
      }

      await db.query(
        'UPDATE coupons SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
        [deleted_by, id]
      );

      return sendSuccessResponse(res, null, 'Cupón eliminado exitosamente');

    } catch (error) {
      logger.error('Error deleting coupon:', error);
      return sendErrorResponse(res, 500, 'Error al eliminar cupón');
    }
  }
);

module.exports = router;
