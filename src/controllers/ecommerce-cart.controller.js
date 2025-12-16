// ===================================================================
// PROSPERPOS - CONTROLADOR DE CARRITO DE COMPRAS
// ===================================================================

const ShoppingCart = require('../models/shopping-cart.model');
const logger = require('../utils/logger');

class EcommerceCartController {

  /**
   * Obtener carrito del cliente
   */
  static async getCart(req, res) {
    try {
      const customerId = req.customer.id;

      const cart = await ShoppingCart.getByCustomerId(customerId);

      res.json({
        success: true,
        data: cart
      });

    } catch (error) {
      logger.error('Error in getCart:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener carrito'
      });
    }
  }

  /**
   * Agregar producto al carrito
   */
  static async addItem(req, res) {
    try {
      const customerId = req.customer.id;
      const { product_id, quantity = 1 } = req.body;

      if (!product_id) {
        return res.status(400).json({
          success: false,
          message: 'ID del producto es requerido'
        });
      }

      if (quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'La cantidad debe ser mayor a 0'
        });
      }

      const result = await ShoppingCart.addItem(customerId, product_id, quantity);

      res.json({
        success: true,
        message: result.message,
        data: result
      });

    } catch (error) {
      logger.error('Error in addItem:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al agregar producto al carrito'
      });
    }
  }

  /**
   * Actualizar cantidad de un item
   */
  static async updateQuantity(req, res) {
    try {
      const customerId = req.customer.id;
      const { product_id } = req.params;
      const { quantity } = req.body;

      if (!quantity || quantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Cantidad inválida'
        });
      }

      const result = await ShoppingCart.updateQuantity(customerId, product_id, quantity);

      res.json({
        success: true,
        message: result.message,
        data: result
      });

    } catch (error) {
      logger.error('Error in updateQuantity:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al actualizar cantidad'
      });
    }
  }

  /**
   * Eliminar item del carrito
   */
  static async removeItem(req, res) {
    try {
      const customerId = req.customer.id;
      const { product_id } = req.params;

      const result = await ShoppingCart.removeItem(customerId, product_id);

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('Error in removeItem:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al eliminar producto del carrito'
      });
    }
  }

  /**
   * Vaciar carrito
   */
  static async clearCart(req, res) {
    try {
      const customerId = req.customer.id;

      const result = await ShoppingCart.clear(customerId);

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('Error in clearCart:', error);
      res.status(500).json({
        success: false,
        message: 'Error al vaciar carrito'
      });
    }
  }

  /**
   * Obtener contador de items
   */
  static async getItemCount(req, res) {
    try {
      const customerId = req.customer.id;

      const result = await ShoppingCart.getItemCount(customerId);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error in getItemCount:', error);
      res.status(500).json({
        success: false,
        message: 'Error al contar items del carrito'
      });
    }
  }
}

module.exports = EcommerceCartController;
