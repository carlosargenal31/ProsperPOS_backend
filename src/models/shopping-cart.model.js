// ===================================================================
// PROSPERPOS - MODELO DE CARRITO DE COMPRAS
// ===================================================================

const db = require('../utils/database');
const logger = require('../utils/logger');

class ShoppingCart {

  /**
   * Obtener carrito del cliente con detalles de productos
   */
  static async getByCustomerId(customerId) {
    try {
      const query = `
        SELECT
          sc.id as cart_id,
          sc.quantity,
          sc.created_at as added_at,
          p.id as product_id,
          p.name as product_name,
          p.code as product_code,
          p.image as product_image,
          p.description,
          p.unit,
          pp.price as unit_price,
          t.rate as tax_rate,
          (SELECT SUM(s.quantity) FROM stock s WHERE s.product_id = p.id) as stock_available
        FROM shopping_cart sc
        INNER JOIN products p ON sc.product_id = p.id
        LEFT JOIN product_prices pp ON p.id = pp.product_id AND pp.price_type = 'sale'
        LEFT JOIN taxes t ON p.tax_id = t.id
        WHERE sc.customer_id = ?
          AND p.status = 'active'
          AND p.deleted_at IS NULL
        ORDER BY sc.created_at DESC
      `;

      const [items] = await db.execute(query, [customerId]);

      // Calcular totales
      let subtotal = 0;
      let taxAmount = 0;
      let total = 0;

      items.forEach(item => {
        const itemSubtotal = item.quantity * (item.unit_price || 0);
        const itemTax = itemSubtotal * ((item.tax_rate || 0) / 100);

        item.subtotal = itemSubtotal;
        item.tax_amount = itemTax;
        item.total = itemSubtotal + itemTax;

        subtotal += itemSubtotal;
        taxAmount += itemTax;
        total += item.total;
      });

      return {
        items,
        summary: {
          items_count: items.length,
          subtotal: parseFloat(subtotal.toFixed(2)),
          tax_amount: parseFloat(taxAmount.toFixed(2)),
          total: parseFloat(total.toFixed(2))
        }
      };

    } catch (error) {
      logger.error('Error getting shopping cart:', error);
      throw error;
    }
  }

  /**
   * Agregar producto al carrito
   */
  static async addItem(customerId, productId, quantity = 1) {
    try {
      // Verificar que el producto existe y está activo
      const [products] = await db.execute(
        `SELECT id, name, status FROM products
         WHERE id = ? AND status = 'active' AND deleted_at IS NULL`,
        [productId]
      );

      if (products.length === 0) {
        throw new Error('Producto no disponible');
      }

      // Verificar stock disponible
      const [stock] = await db.execute(
        'SELECT SUM(quantity) as available FROM stock WHERE product_id = ?',
        [productId]
      );

      const available = stock[0]?.available || 0;

      if (available < quantity) {
        throw new Error(`Stock insuficiente. Disponible: ${available}`);
      }

      // Verificar si ya existe en el carrito
      const [existing] = await db.execute(
        'SELECT id, quantity FROM shopping_cart WHERE customer_id = ? AND product_id = ?',
        [customerId, productId]
      );

      if (existing.length > 0) {
        // Actualizar cantidad
        const newQuantity = existing[0].quantity + quantity;

        if (available < newQuantity) {
          throw new Error(`Stock insuficiente. Disponible: ${available}`);
        }

        await db.execute(
          'UPDATE shopping_cart SET quantity = ?, updated_at = NOW() WHERE id = ?',
          [newQuantity, existing[0].id]
        );

        return {
          message: 'Cantidad actualizada en el carrito',
          cart_id: existing[0].id,
          quantity: newQuantity
        };
      } else {
        // Insertar nuevo item
        const [result] = await db.execute(
          `INSERT INTO shopping_cart (customer_id, product_id, quantity, created_at)
           VALUES (?, ?, ?, NOW())`,
          [customerId, productId, quantity]
        );

        return {
          message: 'Producto agregado al carrito',
          cart_id: result.insertId,
          quantity
        };
      }

    } catch (error) {
      logger.error('Error adding item to cart:', error);
      throw error;
    }
  }

  /**
   * Actualizar cantidad de un item
   */
  static async updateQuantity(customerId, productId, quantity) {
    try {
      if (quantity <= 0) {
        return this.removeItem(customerId, productId);
      }

      // Verificar stock disponible
      const [stock] = await db.execute(
        'SELECT SUM(quantity) as available FROM stock WHERE product_id = ?',
        [productId]
      );

      const available = stock[0]?.available || 0;

      if (available < quantity) {
        throw new Error(`Stock insuficiente. Disponible: ${available}`);
      }

      const [result] = await db.execute(
        `UPDATE shopping_cart SET quantity = ?, updated_at = NOW()
         WHERE customer_id = ? AND product_id = ?`,
        [quantity, customerId, productId]
      );

      if (result.affectedRows === 0) {
        throw new Error('Item no encontrado en el carrito');
      }

      return {
        message: 'Cantidad actualizada',
        quantity
      };

    } catch (error) {
      logger.error('Error updating cart quantity:', error);
      throw error;
    }
  }

  /**
   * Eliminar item del carrito
   */
  static async removeItem(customerId, productId) {
    try {
      const [result] = await db.execute(
        'DELETE FROM shopping_cart WHERE customer_id = ? AND product_id = ?',
        [customerId, productId]
      );

      if (result.affectedRows === 0) {
        throw new Error('Item no encontrado en el carrito');
      }

      return { message: 'Producto eliminado del carrito' };

    } catch (error) {
      logger.error('Error removing item from cart:', error);
      throw error;
    }
  }

  /**
   * Limpiar todo el carrito
   */
  static async clear(customerId) {
    try {
      await db.execute(
        'DELETE FROM shopping_cart WHERE customer_id = ?',
        [customerId]
      );

      return { message: 'Carrito vaciado' };

    } catch (error) {
      logger.error('Error clearing cart:', error);
      throw error;
    }
  }

  /**
   * Contar items en el carrito
   */
  static async getItemCount(customerId) {
    try {
      const [result] = await db.execute(
        'SELECT COUNT(*) as count, SUM(quantity) as total_quantity FROM shopping_cart WHERE customer_id = ?',
        [customerId]
      );

      return {
        items_count: result[0].count || 0,
        total_quantity: result[0].total_quantity || 0
      };

    } catch (error) {
      logger.error('Error getting cart item count:', error);
      throw error;
    }
  }
}

module.exports = ShoppingCart;
