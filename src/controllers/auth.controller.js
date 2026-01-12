// ===================================================================
// PROSPERPOS - CONTROLADOR DE AUTENTICACIÓN
// ===================================================================

const AuthService = require('../services/auth.service');
const { 
  sendSuccessResponse, 
  sendErrorResponse, 
  sendCreatedResponse 
} = require('../utils/response');
const logger = require('../utils/logger');

class AuthController {
  /**
   * Login de usuario
   */
  static async login(req, res) {
    try {
      const { email, username, password, remember_me = false } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // Validar que venga email o username
      if (!email && !username) {
        return sendErrorResponse(res, 400, 'Email o nombre de usuario requerido');
      }

      if (!password) {
        return sendErrorResponse(res, 400, 'Contraseña requerida');
      }

      const result = await AuthService.login({
        email: email || username,
        password,
        remember_me,
        ipAddress,
        userAgent
      });

      logger.auth('LOGIN', result.user.id, {
        ip: ipAddress,
        userAgent,
        remember_me
      });

      return sendSuccessResponse(res, result, 'Login exitoso');

    } catch (error) {
      logger.error('Error in login controller:', error);
      
      if (error.message === 'Credenciales inválidas') {
        return sendErrorResponse(res, 401, error.message);
      }
      
      if (error.message === 'Usuario inactivo') {
        return sendErrorResponse(res, 403, 'Tu cuenta ha sido desactivada. Contacta al administrador');
      }
      
      if (error.message.includes('bloqueada')) {
        return sendErrorResponse(res, 429, error.message);
      }
      
      return sendErrorResponse(res, 500, 'Error al iniciar sesión');
    }
  }

  /**
   * Login con Google OAuth usando Access Token
   */
  static async googleOAuthLogin(req, res) {
    try {
      console.log('📨 googleOAuthLogin - Request body:', req.body);

      const { email, given_name, family_name, picture, sub } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      if (!email || !sub) {
        console.log('❌ Información incompleta:', { email, sub });
        return sendErrorResponse(res, 400, 'Información de Google incompleta');
      }

      console.log('✅ Llamando a AuthService.loginWithGoogleOAuth...');
      const result = await AuthService.loginWithGoogleOAuth({
        email,
        given_name,
        family_name,
        picture,
        sub,
        ipAddress,
        userAgent
      });

      console.log('✅ Login exitoso, resultado:', { hasToken: !!result.token, hasCustomer: !!result.customer });
      logger.info(`Login con Google OAuth: ${email}`);

      return sendSuccessResponse(res, result, 'Login con Google exitoso');

    } catch (error) {
      console.error('❌ Error en googleOAuthLogin controller:', error.message);
      console.error('Stack:', error.stack);
      logger.error('Error in Google OAuth login controller:', error);

      if (error.message === 'Usuario inactivo') {
        return sendErrorResponse(res, 403, 'Tu cuenta ha sido desactivada. Contacta al administrador');
      }

      return sendErrorResponse(res, 500, `Error al iniciar sesión con Google: ${error.message}`);
    }
  }

  /**
   * Login con Google OAuth (método original con ID Token)
   */
  static async googleLogin(req, res) {
    try {
      const { token: googleToken } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      if (!googleToken) {
        return sendErrorResponse(res, 400, 'Token de Google requerido');
      }

      const result = await AuthService.loginWithGoogle({
        googleToken,
        ipAddress,
        userAgent
      });

      logger.auth('GOOGLE_LOGIN', result.user.id, {
        ip: ipAddress,
        userAgent
      });

      return sendSuccessResponse(res, result, 'Login con Google exitoso');

    } catch (error) {
      logger.error('Error in Google login controller:', error);

      if (error.message === 'Usuario inactivo') {
        return sendErrorResponse(res, 403, 'Tu cuenta ha sido desactivada. Contacta al administrador');
      }

      return sendErrorResponse(res, 500, error.message || 'Error al iniciar sesión con Google');
    }
  }

  /**
   * Registro de nuevo usuario
   */
  static async register(req, res) {
    try {
      // Verificar si el registro está habilitado
      if (process.env.ALLOW_REGISTRATION !== 'true') {
        return sendErrorResponse(res, 403, 'El registro de usuarios está deshabilitado');
      }

      const userData = {
        ...req.body,
        ipAddress: req.ip || req.connection.remoteAddress
      };

      const result = await AuthService.register(userData);

      logger.auth('REGISTER', result.user.id, {
        email: result.user.email,
        ip: userData.ipAddress
      });

      return sendCreatedResponse(res, result, 'Usuario registrado exitosamente');

    } catch (error) {
      logger.error('Error in register controller:', error);
      
      if (error.message.includes('ya existe')) {
        return sendErrorResponse(res, 409, error.message);
      }
      
      return sendErrorResponse(res, 500, 'Error al registrar usuario');
    }
  }

  /**
   * Logout de usuario
   */
  static async logout(req, res) {
    try {
      const token = req.header('Authorization')?.substring(7);
      const userId = req.user.id;

      await AuthService.logout(userId, token);

      logger.auth('LOGOUT', userId, {
        ip: req.ip
      });

      return sendSuccessResponse(res, null, 'Sesión cerrada exitosamente');

    } catch (error) {
      logger.error('Error in logout controller:', error);
      return sendErrorResponse(res, 500, 'Error al cerrar sesión');
    }
  }

  /**
   * Cerrar todas las sesiones del usuario
   */
  static async logoutAll(req, res) {
    try {
      const userId = req.user.id;

      const result = await AuthService.logoutAll(userId);

      logger.auth('LOGOUT_ALL', userId, {
        sessionsCloses: result.sessionsCloses,
        ip: req.ip
      });

      return sendSuccessResponse(res, result, 'Todas las sesiones cerradas exitosamente');

    } catch (error) {
      logger.error('Error in logoutAll controller:', error);
      return sendErrorResponse(res, 500, 'Error al cerrar sesiones');
    }
  }

  /**
   * Obtener usuario actual
   */
  static async getCurrentUser(req, res) {
    try {
      const userId = req.user.id;

      const user = await AuthService.getUserById(userId);

      if (!user) {
        return sendErrorResponse(res, 404, 'Usuario no encontrado');
      }

      return sendSuccessResponse(res, user, 'Usuario obtenido exitosamente');

    } catch (error) {
      logger.error('Error in getCurrentUser controller:', error);
      return sendErrorResponse(res, 500, 'Error al obtener usuario');
    }
  }

  /**
   * Actualizar perfil del usuario
   */
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const updates = req.body;

      // No permitir actualizar estos campos desde el perfil
      delete updates.password;
      delete updates.is_active;
      delete updates.role_id;

      const user = await AuthService.updateUserProfile(userId, updates);

      logger.userActivity(userId, 'PROFILE_UPDATED', {
        fields: Object.keys(updates)
      });

      return sendSuccessResponse(res, user, 'Perfil actualizado exitosamente');

    } catch (error) {
      logger.error('Error in updateProfile controller:', error);
      return sendErrorResponse(res, 500, 'Error al actualizar perfil');
    }
  }

  /**
   * Cambiar contraseña
   */
  static async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { current_password, new_password } = req.body;

      await AuthService.changePassword(userId, current_password, new_password);

      logger.auth('PASSWORD_CHANGED', userId, {
        ip: req.ip
      });

      return sendSuccessResponse(res, null, 'Contraseña actualizada exitosamente');

    } catch (error) {
      logger.error('Error in changePassword controller:', error);
      
      if (error.message === 'Contraseña actual incorrecta') {
        return sendErrorResponse(res, 400, error.message);
      }
      
      return sendErrorResponse(res, 500, 'Error al cambiar contraseña');
    }
  }

  /**
   * Solicitar reseteo de contraseña
   */
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return sendErrorResponse(res, 400, 'Email requerido');
      }

      await AuthService.requestPasswordReset(email);

      // Siempre responder con éxito por seguridad (no revelar si el email existe)
      return sendSuccessResponse(
        res, 
        null, 
        'Si el email existe, recibirás instrucciones para resetear tu contraseña'
      );

    } catch (error) {
      logger.error('Error in forgotPassword controller:', error);
      return sendSuccessResponse(
        res, 
        null, 
        'Si el email existe, recibirás instrucciones para resetear tu contraseña'
      );
    }
  }

  /**
   * Resetear contraseña con token
   */
  static async resetPassword(req, res) {
    try {
      const { token, new_password } = req.body;

      if (!token || !new_password) {
        return sendErrorResponse(res, 400, 'Token y nueva contraseña requeridos');
      }

      await AuthService.resetPassword(token, new_password);

      logger.auth('PASSWORD_RESET', null, {
        token: token.substring(0, 10) + '...'
      });

      return sendSuccessResponse(res, null, 'Contraseña restablecida exitosamente');

    } catch (error) {
      logger.error('Error in resetPassword controller:', error);
      
      if (error.message.includes('inválido') || error.message.includes('expirado')) {
        return sendErrorResponse(res, 400, error.message);
      }
      
      return sendErrorResponse(res, 500, 'Error al restablecer contraseña');
    }
  }

  /**
   * Refrescar token
   */
  static async refreshToken(req, res) {
    try {
      const oldToken = req.header('Authorization')?.substring(7);
      const userId = req.user.id;

      const result = await AuthService.refreshToken(userId, oldToken);

      logger.auth('TOKEN_REFRESH', userId, {
        ip: req.ip
      });

      return sendSuccessResponse(res, result, 'Token refrescado exitosamente');

    } catch (error) {
      logger.error('Error in refreshToken controller:', error);
      return sendErrorResponse(res, 500, 'Error al refrescar token');
    }
  }

  /**
   * Verificar token
   */
  static async verifyToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return sendErrorResponse(res, 400, 'Token requerido');
      }

      const isValid = await AuthService.verifyToken(token);

      return sendSuccessResponse(res, { valid: isValid }, 'Token verificado');

    } catch (error) {
      logger.error('Error in verifyToken controller:', error);
      return sendSuccessResponse(res, { valid: false }, 'Token inválido');
    }
  }

  /**
   * Obtener sesiones activas
   */
  static async getActiveSessions(req, res) {
    try {
      const userId = req.user.id;

      const sessions = await AuthService.getActiveSessions(userId);

      return sendSuccessResponse(res, sessions, 'Sesiones obtenidas exitosamente');

    } catch (error) {
      logger.error('Error in getActiveSessions controller:', error);
      return sendErrorResponse(res, 500, 'Error al obtener sesiones');
    }
  }

  /**
   * Cerrar una sesión específica
   */
  static async closeSession(req, res) {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;

      await AuthService.closeSpecificSession(userId, sessionId);

      logger.auth('SESSION_CLOSED', userId, {
        sessionId,
        ip: req.ip
      });

      return sendSuccessResponse(res, null, 'Sesión cerrada exitosamente');

    } catch (error) {
      logger.error('Error in closeSession controller:', error);
      return sendErrorResponse(res, 500, 'Error al cerrar sesión');
    }
  }

  /**
   * Obtener permisos del usuario
   */
  static async getUserPermissions(req, res) {
    try {
      const userId = req.user.id;

      const permissions = await AuthService.getUserPermissions(userId);

      return sendSuccessResponse(res, permissions, 'Permisos obtenidos exitosamente');

    } catch (error) {
      logger.error('Error in getUserPermissions controller:', error);
      return sendErrorResponse(res, 500, 'Error al obtener permisos');
    }
  }

  /**
   * Generar token de desarrollo (solo desarrollo)
   */
  static async generateDevToken(req, res) {
    try {
      if (process.env.NODE_ENV === 'production') {
        return sendErrorResponse(res, 403, 'No disponible en producción');
      }

      const result = await AuthService.generateDevToken();

      logger.auth('DEV_TOKEN_GENERATED', 1, {
        ip: req.ip,
        env: 'development'
      });

      return sendSuccessResponse(res, result, 'Token de desarrollo generado');

    } catch (error) {
      logger.error('Error in generateDevToken controller:', error);
      return sendErrorResponse(res, 500, 'Error al generar token');
    }
  }
}

module.exports = AuthController;