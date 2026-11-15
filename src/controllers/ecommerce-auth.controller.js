// ===================================================================
// PROSPERPOS - CONTROLADOR DE AUTENTICACIÓN E-COMMERCE
// ===================================================================

const WebCustomer = require('../models/web-customer.model');
const { getJwtSecret } = require('../tenancy/context');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class EcommerceAuthController {

  /**
   * Registrar nuevo cliente
   */
  static async register(req, res) {
    try {
      const {
        email,
        password,
        first_name,
        last_name,
        phone,
        document_type,
        document_number
      } = req.body;

      // Validar campos requeridos
      if (!email || !password || !first_name || !last_name) {
        return res.status(400).json({
          success: false,
          message: 'Email, contraseña, nombre y apellido son requeridos'
        });
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de email inválido'
        });
      }

      // Validar longitud de contraseña
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres'
        });
      }

      const result = await WebCustomer.create({
        email,
        password,
        first_name,
        last_name,
        phone,
        document_type,
        document_number
      });

      // Generar token JWT
      const token = jwt.sign(
        {
          id: result.id,
          email: result.email,
          type: 'web_customer'
        },
        getJwtSecret(),
        { expiresIn: '30d' }
      );

      res.status(201).json({
        success: true,
        message: result.message,
        data: {
          customer: {
            id: result.id,
            email: result.email,
            first_name: result.first_name,
            last_name: result.last_name
          },
          token
        }
      });

    } catch (error) {
      logger.error('Error in register:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al registrar cliente'
      });
    }
  }

  /**
   * Login de cliente
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son requeridos'
        });
      }

      const customer = await WebCustomer.authenticate(email, password);

      // Generar token JWT
      const token = jwt.sign(
        {
          id: customer.id,
          email: customer.email,
          type: 'web_customer'
        },
        getJwtSecret(),
        { expiresIn: '30d' }
      );

      res.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: {
          customer: {
            id: customer.id,
            email: customer.email,
            first_name: customer.first_name,
            last_name: customer.last_name,
            phone: customer.phone,
            email_verified: customer.email_verified
          },
          token
        }
      });

    } catch (error) {
      logger.error('Error in login:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Error al iniciar sesión'
      });
    }
  }

  /**
   * Obtener perfil del cliente autenticado
   */
  static async getProfile(req, res) {
    try {
      const customerId = req.customer.id;

      const customer = await WebCustomer.getById(customerId);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      res.json({
        success: true,
        data: customer
      });

    } catch (error) {
      logger.error('Error in getProfile:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener perfil'
      });
    }
  }

  /**
   * Actualizar perfil
   */
  static async updateProfile(req, res) {
    try {
      const customerId = req.customer.id;
      const updateData = req.body;

      await WebCustomer.updateProfile(customerId, updateData);

      const updatedCustomer = await WebCustomer.getById(customerId);

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: updatedCustomer
      });

    } catch (error) {
      logger.error('Error in updateProfile:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al actualizar perfil'
      });
    }
  }

  /**
   * Cambiar contraseña
   */
  static async changePassword(req, res) {
    try {
      const customerId = req.customer.id;
      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña actual y nueva contraseña son requeridas'
        });
      }

      if (new_password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
      }

      await WebCustomer.changePassword(customerId, current_password, new_password);

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });

    } catch (error) {
      logger.error('Error in changePassword:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al cambiar contraseña'
      });
    }
  }
}

module.exports = EcommerceAuthController;
