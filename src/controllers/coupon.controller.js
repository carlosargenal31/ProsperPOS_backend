// ===================================================================
// PROSPERPOS - CONTROLADOR DE CUPONES
// ===================================================================

const db = require('../utils/database');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Obtener el siguiente código de cupón
 */
exports.getNextCode = async (req, res) => {
  try {
    const query = `
      SELECT codigo FROM coupons
      WHERE deleted_at IS NULL
      ORDER BY CAST(codigo AS UNSIGNED) DESC
      LIMIT 1
    `;
    const result = await db.query(query);

    let nextCode = '000001';
    if (result.length > 0) {
      const lastCode = result[0].codigo;
      const numericPart = parseInt(lastCode, 10);
      nextCode = String(numericPart + 1).padStart(6, '0');
    }

    return sendSuccessResponse(res, { codigo: nextCode }, 'Código generado exitosamente');

  } catch (error) {
    logger.error('Error generating next code:', error);
    return sendErrorResponse(res, 500, 'Error al generar código');
  }
};

/**
 * Obtener todos los cupones
 */
exports.getCoupons = async (req, res) => {
  try {
    const { is_active } = req.query;

    let query = `
      SELECT c.*,
             cat.name as categoria_nombre,
             sub.name as subcategoria_nombre,
             p.name as producto_nombre,
             p.code as producto_codigo,
             b.nombre as agencia_nombre
      FROM coupons c
      LEFT JOIN categories cat ON c.grupo_id = cat.id
      LEFT JOIN subcategories sub ON c.subgrupo_id = sub.id
      LEFT JOIN products p ON c.articulo_id = p.id
      LEFT JOIN branches b ON c.agencia_id = b.id
      WHERE c.deleted_at IS NULL
    `;

    // Filtrar por estado activo si se especifica
    if (is_active === '1' || is_active === 'true') {
      query += ` AND c.is_active = 1 AND c.suspendida = 0`;
      query += ` AND (c.limitar_fecha = 0 OR c.fecha_hasta IS NULL OR c.fecha_hasta >= CURDATE())`;
    }

    query += ` ORDER BY c.id DESC`;

    const coupons = await db.query(query);

    // Obtener items para cupones de tipo 'multiple'
    for (const coupon of coupons) {
      if (coupon.tipo_aplicacion === 'multiple') {
        const itemsQuery = `
          SELECT cp.*
          FROM coupon_products cp
          WHERE cp.coupon_id = ?
        `;
        const items = await db.query(itemsQuery, [coupon.id]);
        coupon.items = items;
      }

      // Formatear datos para el frontend
      coupon.code = coupon.codigo;
      coupon.discount_type = coupon.tipo_descuento;
      coupon.discount_value = coupon.valor_descuento;
      coupon.valid_until = coupon.fecha_hasta;
    }

    return sendSuccessResponse(res, coupons, 'Cupones obtenidos exitosamente');

  } catch (error) {
    logger.error('Error getting coupons:', error);
    return sendErrorResponse(res, 500, 'Error al obtener cupones');
  }
};

/**
 * Validar cupón por código
 */
exports.validateCoupon = async (req, res) => {
  try {
    const { code } = req.params;

    const query = `
      SELECT c.*,
             cat.name as categoria_nombre,
             sub.name as subcategoria_nombre,
             p.name as producto_nombre,
             p.code as producto_codigo,
             b.nombre as agencia_nombre
      FROM coupons c
      LEFT JOIN categories cat ON c.grupo_id = cat.id
      LEFT JOIN subcategories sub ON c.subgrupo_id = sub.id
      LEFT JOIN products p ON c.articulo_id = p.id
      LEFT JOIN branches b ON c.agencia_id = b.id
      WHERE c.codigo = ? AND c.deleted_at IS NULL
    `;
    const coupons = await db.query(query, [code.trim().toUpperCase()]);

    if (coupons.length === 0) {
      return sendErrorResponse(res, 404, 'Cupón no encontrado');
    }

    const coupon = coupons[0];

    // Validar si el cupón está activo
    if (!coupon.is_active || coupon.suspendida) {
      return sendErrorResponse(res, 400, 'Este cupón no está activo');
    }

    // Validar fechas si está limitado por fecha
    if (coupon.limitar_fecha) {
      const now = new Date();
      const fechaDesde = coupon.fecha_desde ? new Date(coupon.fecha_desde) : null;
      const fechaHasta = coupon.fecha_hasta ? new Date(coupon.fecha_hasta) : null;

      if (fechaDesde && now < fechaDesde) {
        return sendErrorResponse(res, 400, 'Este cupón aún no es válido');
      }

      if (fechaHasta && now > fechaHasta) {
        return sendErrorResponse(res, 400, 'Este cupón ha expirado');
      }
    }

    // Si es múltiples artículos, obtener los productos relacionados
    if (coupon.tipo_aplicacion === 'multiple') {
      const productsQuery = `
        SELECT cp.*
        FROM coupon_products cp
        WHERE cp.coupon_id = ?
      `;
      const products = await db.query(productsQuery, [coupon.id]);
      coupon.items = products;
    }

    // Formatear la respuesta para el frontend
    const response = {
      id: coupon.id,
      code: coupon.codigo,
      name: coupon.nombre,
      discount_type: coupon.tipo_descuento, // 'percentage' o 'fixed'
      discount_value: coupon.valor_descuento,
      is_active: Boolean(coupon.is_active),
      valid_until: coupon.fecha_hasta,
      tipo_aplicacion: coupon.tipo_aplicacion,
      items: coupon.items || []
    };

    return sendSuccessResponse(res, response, 'Cupón validado exitosamente');

  } catch (error) {
    logger.error('Error validating coupon:', error);
    return sendErrorResponse(res, 500, 'Error al validar cupón');
  }
};

/**
 * Obtener cupón por ID
 */
exports.getCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT c.*,
             cat.name as categoria_nombre,
             sub.name as subcategoria_nombre,
             p.name as producto_nombre,
             p.code as producto_codigo,
             b.nombre as agencia_nombre
      FROM coupons c
      LEFT JOIN categories cat ON c.grupo_id = cat.id
      LEFT JOIN subcategories sub ON c.subgrupo_id = sub.id
      LEFT JOIN products p ON c.articulo_id = p.id
      LEFT JOIN branches b ON c.agencia_id = b.id
      WHERE c.id = ? AND c.deleted_at IS NULL
    `;
    const coupons = await db.query(query, [id]);

    if (coupons.length === 0) {
      return sendErrorResponse(res, 404, 'Cupón no encontrado');
    }

    // Si es múltiples artículos, obtener los productos relacionados
    if (coupons[0].tipo_aplicacion === 'multiple') {
      const productsQuery = `
        SELECT cp.*
        FROM coupon_products cp
        WHERE cp.coupon_id = ?
      `;
      const products = await db.query(productsQuery, [id]);
      coupons[0].items = products;
    }

    return sendSuccessResponse(res, coupons[0], 'Cupón obtenido exitosamente');

  } catch (error) {
    logger.error('Error getting coupon:', error);
    return sendErrorResponse(res, 500, 'Error al obtener cupón');
  }
};

/**
 * Crear nuevo cupón
 */
exports.createCoupon = async (req, res) => {
  try {
    const {
      codigo,
      nombre,
      agencia_id,
      tipo_aplicacion,
      categoria_id,
      subcategoria_id,
      producto_id,
      tipo_descuento,
      valor_descuento,
      limitar_fecha,
      fecha_desde,
      fecha_hasta,
      items,
      suspendida,
      is_active
    } = req.body;
    const created_by = req.user.id;

    // Validaciones
    if (!codigo || !nombre || !tipo_descuento || !valor_descuento || !tipo_aplicacion) {
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
        codigo, nombre, agencia_id, tipo_descuento, valor_descuento,
        limitar_fecha, fecha_desde, fecha_hasta,
        tipo_aplicacion, grupo_id, subgrupo_id, articulo_id,
        suspendida, is_active, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const result = await db.query(query, [
      codigo.trim().toUpperCase(),
      nombre.trim(),
      agencia_id || null,
      tipo_descuento,
      valor_descuento,
      limitar_fecha || 0,
      fecha_desde || null,
      fecha_hasta || null,
      tipo_aplicacion,
      categoria_id || null,
      subcategoria_id || null,
      producto_id || null,
      suspendida || 0,
      is_active !== undefined ? is_active : 1,
      created_by
    ]);

    // Si es múltiples artículos, insertar relaciones
    if (tipo_aplicacion === 'multiple' && items && items.length > 0) {
      const insertQuery = `
        INSERT INTO coupon_products (
          coupon_id, product_id, product_code, product_name,
          descuento_porcentaje, descuento_monto
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;

      for (const item of items) {
        await db.query(insertQuery, [
          result.insertId,
          item.product_id || null,
          item.product_code || '',
          item.product_name || '',
          item.descuento_porcentaje || 0,
          item.descuento_monto || 0
        ]);
      }
    }

    const newCoupon = await db.query(
      'SELECT * FROM coupons WHERE id = ?',
      [result.insertId]
    );

    return sendSuccessResponse(res, newCoupon[0], 'Cupón creado exitosamente', 201);

  } catch (error) {
    logger.error('Error creating coupon:', error);
    return sendErrorResponse(res, 500, 'Error al crear cupón: ' + error.message);
  }
};

/**
 * Actualizar cupón
 */
exports.updateCoupon = async (req, res) => {
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
    const allowedFields = {
      codigo: 'codigo',
      nombre: 'nombre',
      agencia_id: 'agencia_id',
      tipo_descuento: 'tipo_descuento',
      valor_descuento: 'valor_descuento',
      limitar_fecha: 'limitar_fecha',
      fecha_desde: 'fecha_desde',
      fecha_hasta: 'fecha_hasta',
      tipo_aplicacion: 'tipo_aplicacion',
      categoria_id: 'grupo_id',
      subcategoria_id: 'subgrupo_id',
      producto_id: 'articulo_id',
      suspendida: 'suspendida',
      is_active: 'is_active'
    };

    const updates = [];
    const values = [];

    Object.keys(allowedFields).forEach(frontendField => {
      const dbField = allowedFields[frontendField];
      if (req.body[frontendField] !== undefined) {
        if (frontendField === 'codigo' || frontendField === 'nombre') {
          updates.push(`${dbField} = ?`);
          values.push(req.body[frontendField].trim());
        } else {
          updates.push(`${dbField} = ?`);
          values.push(req.body[frontendField]);
        }
      }
    });

    if (updates.length === 0 && !req.body.items) {
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

    if (updates.length > 0) {
      updates.push('updated_by = ?');
      updates.push('updated_at = NOW()');
      values.push(updated_by);
      values.push(id);

      const updateQuery = `UPDATE coupons SET ${updates.join(', ')} WHERE id = ?`;
      await db.query(updateQuery, values);
    }

    // Actualizar productos si es múltiples artículos
    if (req.body.tipo_aplicacion === 'multiple' && req.body.items) {
      // Eliminar relaciones existentes
      await db.query('DELETE FROM coupon_products WHERE coupon_id = ?', [id]);

      // Insertar nuevas relaciones
      if (req.body.items.length > 0) {
        const insertQuery = `
          INSERT INTO coupon_products (
            coupon_id, product_id, product_code, product_name,
            descuento_porcentaje, descuento_monto
          ) VALUES (?, ?, ?, ?, ?, ?)
        `;

        for (const item of req.body.items) {
          await db.query(insertQuery, [
            id,
            item.product_id || null,
            item.product_code || '',
            item.product_name || '',
            item.descuento_porcentaje || 0,
            item.descuento_monto || 0
          ]);
        }
      }
    }

    const updatedCoupon = await db.query(
      'SELECT * FROM coupons WHERE id = ?',
      [id]
    );

    return sendSuccessResponse(res, updatedCoupon[0], 'Cupón actualizado exitosamente');

  } catch (error) {
    logger.error('Error updating coupon:', error);
    return sendErrorResponse(res, 500, 'Error al actualizar cupón: ' + error.message);
  }
};

/**
 * Eliminar cupón (soft delete)
 */
exports.deleteCoupon = async (req, res) => {
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
};
