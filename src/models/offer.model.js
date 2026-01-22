// ===================================================================
// PROSPERPOS - MODELO DE OFERTAS
// ===================================================================

const db = require('../utils/database');

class OfferModel {

  /**
   * Obtener todas las ofertas
   */
  static async findAll(filters = {}) {
    try {
      const {
        search = '',
        is_active = null,
        agencia_id = null,
        tipo_aplicacion = null
      } = filters;

      let whereClause = 'WHERE o.deleted_at IS NULL';
      const params = [];

      if (search) {
        whereClause += ' AND (o.codigo LIKE ? OR o.nombre LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      if (is_active !== null) {
        whereClause += ' AND o.is_active = ?';
        params.push(is_active ? 1 : 0);
      }

      if (agencia_id) {
        whereClause += ' AND o.agencia_id = ?';
        params.push(agencia_id);
      }

      if (tipo_aplicacion) {
        whereClause += ' AND o.tipo_aplicacion = ?';
        params.push(tipo_aplicacion);
      }

      const query = `
        SELECT
          o.*,
          b.nombre as agencia_nombre,
          c.name as categoria_nombre,
          sc.name as subcategoria_nombre,
          p.name as producto_nombre,
          (SELECT COUNT(*) FROM offer_items WHERE offer_id = o.id) as items_count
        FROM offers o
        LEFT JOIN branches b ON o.agencia_id = b.id
        LEFT JOIN categories c ON o.categoria_id = c.id
        LEFT JOIN subcategories sc ON o.subcategoria_id = sc.id
        LEFT JOIN products p ON o.producto_id = p.id
        ${whereClause}
        ORDER BY o.id DESC
      `;

      const offers = await db.execute(query, params);
      return offers;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener oferta por ID
   */
  static async findById(id) {
    try {
      const query = `
        SELECT
          o.*,
          b.nombre as agencia_nombre,
          c.name as categoria_nombre,
          sc.name as subcategoria_nombre,
          p.name as producto_nombre,
          (SELECT COUNT(*) FROM offer_items WHERE offer_id = o.id) as items_count
        FROM offers o
        LEFT JOIN branches b ON o.agencia_id = b.id
        LEFT JOIN categories c ON o.categoria_id = c.id
        LEFT JOIN subcategories sc ON o.subcategoria_id = sc.id
        LEFT JOIN products p ON o.producto_id = p.id
        WHERE o.id = ? AND o.deleted_at IS NULL
      `;

      const rows = await db.execute(query, [id]);
      return rows[0] || null;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener oferta por código
   */
  static async findByCodigo(codigo) {
    try {
      const query = `
        SELECT o.*
        FROM offers o
        WHERE o.codigo = ? AND o.deleted_at IS NULL
      `;

      const rows = await db.execute(query, [codigo]);
      return rows[0] || null;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Crear nueva oferta
   */
  static async create(offerData) {
    try {
      const {
        codigo,
        nombre,
        agencia_id,
        tipo_aplicacion,
        categoria_id,
        subcategoria_id,
        producto_id,
        limitar_fecha,
        fecha_desde,
        fecha_hasta,
        limitar_hora,
        hora_desde,
        hora_hasta,
        aplica_lunes,
        aplica_martes,
        aplica_miercoles,
        aplica_jueves,
        aplica_viernes,
        aplica_sabado,
        aplica_domingo,
        tipo_descuento,
        valor_descuento,
        aplica_para,
        monto_minimo,
        cantidad_minima,
        suspendida,
        is_active,
        created_by
      } = offerData;

      const insertQuery = `
        INSERT INTO offers (
          codigo, nombre, agencia_id, tipo_aplicacion,
          categoria_id, subcategoria_id, producto_id,
          limitar_fecha, fecha_desde, fecha_hasta, limitar_hora, hora_desde, hora_hasta,
          aplica_lunes, aplica_martes, aplica_miercoles, aplica_jueves,
          aplica_viernes, aplica_sabado, aplica_domingo,
          tipo_descuento, valor_descuento,
          aplica_para, monto_minimo, cantidad_minima,
          suspendida, is_active, created_by, created_at
        ) VALUES (
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?,
          ?, ?, ?,
          ?, ?, ?, NOW()
        )
      `;

      const result = await db.execute(insertQuery, [
        codigo,
        nombre,
        agencia_id || null,
        tipo_aplicacion || 'grupo',
        categoria_id || null,
        subcategoria_id || null,
        producto_id || null,
        limitar_fecha ? 1 : 0,
        fecha_desde || null,
        fecha_hasta || null,
        limitar_hora ? 1 : 0,
        hora_desde || null,
        hora_hasta || null,
        aplica_lunes !== false ? 1 : 0,
        aplica_martes !== false ? 1 : 0,
        aplica_miercoles !== false ? 1 : 0,
        aplica_jueves !== false ? 1 : 0,
        aplica_viernes !== false ? 1 : 0,
        aplica_sabado ? 1 : 0,
        aplica_domingo ? 1 : 0,
        tipo_descuento || 'monto',
        valor_descuento || 0,
        aplica_para || 'todos',
        monto_minimo || 0,
        cantidad_minima || 0,
        suspendida ? 1 : 0,
        is_active !== false ? 1 : 0,
        created_by || 1
      ]);

      return {
        id: result.insertId,
        codigo,
        nombre
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar oferta
   */
  static async update(id, offerData) {
    try {
      const {
        nombre,
        agencia_id,
        tipo_aplicacion,
        categoria_id,
        subcategoria_id,
        producto_id,
        limitar_fecha,
        fecha_desde,
        fecha_hasta,
        limitar_hora,
        hora_desde,
        hora_hasta,
        aplica_lunes,
        aplica_martes,
        aplica_miercoles,
        aplica_jueves,
        aplica_viernes,
        aplica_sabado,
        aplica_domingo,
        tipo_descuento,
        valor_descuento,
        aplica_para,
        monto_minimo,
        cantidad_minima,
        suspendida,
        is_active,
        updated_by
      } = offerData;

      const updateQuery = `
        UPDATE offers SET
          nombre = ?,
          agencia_id = ?,
          tipo_aplicacion = ?,
          categoria_id = ?,
          subcategoria_id = ?,
          producto_id = ?,
          limitar_fecha = ?,
          fecha_desde = ?,
          fecha_hasta = ?,
          limitar_hora = ?,
          hora_desde = ?,
          hora_hasta = ?,
          aplica_lunes = ?,
          aplica_martes = ?,
          aplica_miercoles = ?,
          aplica_jueves = ?,
          aplica_viernes = ?,
          aplica_sabado = ?,
          aplica_domingo = ?,
          tipo_descuento = ?,
          valor_descuento = ?,
          aplica_para = ?,
          monto_minimo = ?,
          cantidad_minima = ?,
          suspendida = ?,
          is_active = ?,
          updated_by = ?,
          updated_at = NOW()
        WHERE id = ? AND deleted_at IS NULL
      `;

      await db.execute(updateQuery, [
        nombre,
        agencia_id || null,
        tipo_aplicacion || 'grupo',
        categoria_id || null,
        subcategoria_id || null,
        producto_id || null,
        limitar_fecha ? 1 : 0,
        fecha_desde || null,
        fecha_hasta || null,
        limitar_hora ? 1 : 0,
        hora_desde || null,
        hora_hasta || null,
        aplica_lunes !== false ? 1 : 0,
        aplica_martes !== false ? 1 : 0,
        aplica_miercoles !== false ? 1 : 0,
        aplica_jueves !== false ? 1 : 0,
        aplica_viernes !== false ? 1 : 0,
        aplica_sabado ? 1 : 0,
        aplica_domingo ? 1 : 0,
        tipo_descuento || 'monto',
        valor_descuento || 0,
        aplica_para || 'todos',
        monto_minimo || 0,
        cantidad_minima || 0,
        suspendida ? 1 : 0,
        is_active !== false ? 1 : 0,
        updated_by || 1,
        id
      ]);

      return { id, nombre };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Eliminar oferta (soft delete)
   */
  static async delete(id, deleted_by) {
    try {
      await db.execute(
        'UPDATE offers SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
        [deleted_by, id]
      );

      return { success: true };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Verificar si existe una oferta por código
   */
  static async existsByCodigo(codigo, excludeId = null) {
    try {
      let query = 'SELECT id FROM offers WHERE codigo = ? AND deleted_at IS NULL';
      const params = [codigo];

      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }

      const rows = await db.execute(query, params);
      return rows.length > 0;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener ofertas activas
   */
  static async getActiveOffers() {
    try {
      const query = `
        SELECT
          o.*,
          b.nombre as agencia_nombre
        FROM offers o
        LEFT JOIN branches b ON o.agencia_id = b.id
        WHERE o.is_active = 1
          AND o.suspendida = 0
          AND o.deleted_at IS NULL
        ORDER BY o.id DESC
      `;

      const offers = await db.execute(query);
      return offers;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener items de una oferta
   */
  static async getOfferItems(offerId) {
    try {
      const query = `
        SELECT *
        FROM offer_items
        WHERE offer_id = ?
        ORDER BY id ASC
      `;

      const items = await db.execute(query, [offerId]);
      return items;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Agregar items a una oferta
   */
  static async addOfferItems(offerId, items) {
    try {
      const insertQuery = `
        INSERT INTO offer_items (
          offer_id, product_id, product_code, product_name,
          descuento_porcentaje, descuento_monto,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;

      for (const item of items) {
        await db.execute(insertQuery, [
          offerId,
          item.product_id || null,
          item.product_code,
          item.product_name || null,
          item.descuento_porcentaje || 0,
          item.descuento_monto || 0
        ]);
      }

      return { success: true };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Eliminar items de una oferta
   */
  static async deleteOfferItems(offerId) {
    try {
      await db.execute('DELETE FROM offer_items WHERE offer_id = ?', [offerId]);
      return { success: true };

    } catch (error) {
      throw error;
    }
  }
}

module.exports = OfferModel;

// Método agregado: Obtener siguiente código
OfferModel.getNextCode = async function() {
  try {
    const query = `
      SELECT codigo
      FROM offers
      ORDER BY CAST(codigo AS UNSIGNED) DESC
      LIMIT 1
    `;

    const rows = await db.execute(query);

    if (rows.length === 0) {
      return '000001';
    }

    const lastCode = rows[0].codigo;
    const lastNumber = parseInt(lastCode);
    const nextNumber = lastNumber + 1;

    return String(nextNumber).padStart(6, '0');

  } catch (error) {
    throw error;
  }
};
