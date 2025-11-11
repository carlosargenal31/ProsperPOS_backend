// ===================================================================
// PROSPERPOS - SERVICIO DE AUTENTICACIÓN
// ===================================================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../utils/database');
const logger = require('../utils/logger');

class AuthService {
  /**
   * Login de usuario
   */
  static async login({ email, password, remember_me = false, ipAddress, userAgent }) {
    try {
      // Buscar usuario por email o username
      const query = `
        SELECT 
          u.*,
          s.name as store_name
        FROM users u
        LEFT JOIN stores s ON u.store_id = s.id
        WHERE (u.email = ? OR u.username = ?) 
          AND u.deleted_at IS NULL
        LIMIT 1
      `;

      const users = await db.query(query, [email, email]);

      if (users.length === 0) {
        // Registrar intento fallido
        await this.recordLoginAttempt(email, ipAddress, userAgent, false, 'user_not_found');
        throw new Error('Credenciales inválidas');
      }

      const user = users[0];

      // Verificar si el usuario está activo
      if (!user.is_active) {
        await this.recordLoginAttempt(email, ipAddress, userAgent, false, 'user_inactive');
        throw new Error('Usuario inactivo');
      }

      // Verificar contraseña
      const validPassword = await bcrypt.compare(password, user.password);
      
      if (!validPassword) {
        await this.recordLoginAttempt(email, ipAddress, userAgent, false, 'invalid_password');
        
        // Verificar intentos fallidos
        const failedAttempts = await this.getRecentFailedAttempts(email, ipAddress);
        if (failedAttempts >= 5) {
          // Bloquear usuario temporalmente
          await this.lockUser(user.id);
          throw new Error('Cuenta bloqueada por múltiples intentos fallidos. Intenta en 15 minutos.');
        }
        
        throw new Error('Credenciales inválidas');
      }

      // Obtener roles y permisos del usuario
      const rolesPermissions = await this.getUserRolesAndPermissions(user.id);

      // Generar token JWT
      const expiresIn = remember_me ? '7d' : '24h';
      const token = this.generateToken(user, expiresIn);

      // Calcular fecha de expiración
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (remember_me ? 168 : 24));

      // Guardar sesión en la base de datos
      await db.query(`
        INSERT INTO user_sessions (
          user_id, token, ip_address, user_agent, expires_at, created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())
      `, [user.id, token, ipAddress, userAgent, expiresAt]);

      // Registrar login exitoso
      await this.recordLoginAttempt(email, ipAddress, userAgent, true);

      // Preparar respuesta
      return {
        token,
        expires_at: expiresAt,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          full_name: `${user.first_name} ${user.last_name}`,
          phone: user.phone,
          avatar: user.avatar,
          store_id: user.store_id,
          store_name: user.store_name,
          roles: rolesPermissions.roles,
          permissions: rolesPermissions.permissions
        }
      };

    } catch (error) {
      logger.error('Error in login service:', error);
      throw error;
    }
  }

  /**
   * Registro de nuevo usuario
   */
  static async register(userData) {
    try {
      const { 
        username, 
        email, 
        password, 
        first_name, 
        last_name, 
        phone,
        store_id = 1 
      } = userData;

      // Verificar si el usuario ya existe
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1',
        [email, username]
      );

      if (existingUser.length > 0) {
        throw new Error('El email o nombre de usuario ya existe');
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insertar usuario
      const result = await db.query(`
        INSERT INTO users (
          username, email, password, first_name, last_name, 
          phone, store_id, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, true, NOW())
      `, [username, email, hashedPassword, first_name, last_name, phone, store_id]);

      const userId = result.insertId;

      // Asignar rol por defecto (Cashier = 2)
      await db.query(`
        INSERT INTO user_roles (user_id, role_id, assigned_at)
        VALUES (?, 2, NOW())
      `, [userId]);

      // Obtener usuario creado con sus datos completos
      const newUser = await this.getUserById(userId);

      return {
        user: newUser,
        message: 'Usuario registrado exitosamente'
      };

    } catch (error) {
      logger.error('Error in register service:', error);
      throw error;
    }
  }

  /**
   * Logout de usuario
   */
  static async logout(userId, token) {
    try {
      await db.query(`
        UPDATE user_sessions 
        SET is_active = false 
        WHERE user_id = ? AND token = ?
      `, [userId, token]);

      return { success: true };
    } catch (error) {
      logger.error('Error in logout service:', error);
      throw error;
    }
  }

  /**
   * Cerrar todas las sesiones del usuario
   */
  static async logoutAll(userId) {
    try {
      const result = await db.query(`
        UPDATE user_sessions 
        SET is_active = false 
        WHERE user_id = ? AND is_active = true
      `, [userId]);

      return { 
        success: true,
        sessionsCloses: result.affectedRows
      };
    } catch (error) {
      logger.error('Error in logoutAll service:', error);
      throw error;
    }
  }

  /**
   * Obtener usuario por ID
   */
  static async getUserById(userId) {
    try {
      const query = `
        SELECT 
          u.id,
          u.username,
          u.email,
          u.first_name,
          u.last_name,
          u.phone,
          u.avatar,
          u.store_id,
          u.is_active,
          u.created_at,
          s.name as store_name
        FROM users u
        LEFT JOIN stores s ON u.store_id = s.id
        WHERE u.id = ? AND u.deleted_at IS NULL
        LIMIT 1
      `;

      const users = await db.query(query, [userId]);

      if (users.length === 0) {
        return null;
      }

      const user = users[0];

      // Obtener roles y permisos
      const rolesPermissions = await this.getUserRolesAndPermissions(userId);

      return {
        ...user,
        full_name: `${user.first_name} ${user.last_name}`,
        roles: rolesPermissions.roles,
        permissions: rolesPermissions.permissions
      };

    } catch (error) {
      logger.error('Error in getUserById service:', error);
      throw error;
    }
  }

  /**
   * Actualizar perfil de usuario
   */
  static async updateUserProfile(userId, updates) {
    try {
      const allowedFields = ['first_name', 'last_name', 'phone', 'avatar'];
      const updateFields = [];
      const values = [];

      // Filtrar solo campos permitidos
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }

      values.push(userId);

      await db.query(`
        UPDATE users 
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = ?
      `, values);

      return await this.getUserById(userId);

    } catch (error) {
      logger.error('Error in updateUserProfile service:', error);
      throw error;
    }
  }

  /**
   * Cambiar contraseña
   */
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      // Obtener contraseña actual
      const users = await db.query(
        'SELECT password FROM users WHERE id = ? LIMIT 1',
        [userId]
      );

      if (users.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar contraseña actual
      const validPassword = await bcrypt.compare(currentPassword, users[0].password);
      
      if (!validPassword) {
        throw new Error('Contraseña actual incorrecta');
      }

      // Hash de nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Actualizar contraseña
      await db.query(`
        UPDATE users 
        SET password = ?, updated_at = NOW()
        WHERE id = ?
      `, [hashedPassword, userId]);

      // Cerrar todas las sesiones excepto la actual
      await db.query(`
        UPDATE user_sessions 
        SET is_active = false 
        WHERE user_id = ? AND is_active = true
      `, [userId]);

      return { success: true };

    } catch (error) {
      logger.error('Error in changePassword service:', error);
      throw error;
    }
  }

  /**
   * Solicitar reseteo de contraseña
   */
  static async requestPasswordReset(email) {
    try {
      const users = await db.query(
        'SELECT id FROM users WHERE email = ? AND is_active = true AND deleted_at IS NULL LIMIT 1',
        [email]
      );

      if (users.length === 0) {
        // No revelar si el email existe o no
        return { success: true };
      }

      const userId = users[0].id;

      // Generar token aleatorio
      const token = crypto.randomBytes(32).toString('hex');
      
      // Expirar en 1 hora
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Guardar token
      await db.query(`
        INSERT INTO password_resets (user_id, token, expires_at, created_at)
        VALUES (?, ?, ?, NOW())
      `, [userId, token, expiresAt]);

      // TODO: Enviar email con el token
      logger.info('Password reset token generated', { userId, token });

      return { success: true, token }; // En producción, no devolver el token

    } catch (error) {
      logger.error('Error in requestPasswordReset service:', error);
      throw error;
    }
  }

  /**
   * Resetear contraseña con token
   */
  static async resetPassword(token, newPassword) {
    try {
      // Buscar token válido
      const resets = await db.query(`
        SELECT user_id 
        FROM password_resets 
        WHERE token = ? 
          AND used = false 
          AND expires_at > NOW()
        LIMIT 1
      `, [token]);

      if (resets.length === 0) {
        throw new Error('Token inválido o expirado');
      }

      const userId = resets[0].user_id;

      // Hash de nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Actualizar contraseña
      await db.query(`
        UPDATE users 
        SET password = ?, updated_at = NOW()
        WHERE id = ?
      `, [hashedPassword, userId]);

      // Marcar token como usado
      await db.query(`
        UPDATE password_resets 
        SET used = true, used_at = NOW()
        WHERE token = ?
      `, [token]);

      // Cerrar todas las sesiones
      await db.query(`
        UPDATE user_sessions 
        SET is_active = false 
        WHERE user_id = ?
      `, [userId]);

      return { success: true };

    } catch (error) {
      logger.error('Error in resetPassword service:', error);
      throw error;
    }
  }

  /**
   * Refrescar token
   */
  static async refreshToken(userId, oldToken) {
    try {
      const user = await this.getUserById(userId);
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Generar nuevo token
      const newToken = this.generateToken(user, '24h');
      
      // Actualizar sesión
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await db.query(`
        UPDATE user_sessions 
        SET token = ?, expires_at = ?, last_activity = NOW()
        WHERE user_id = ? AND token = ?
      `, [newToken, expiresAt, userId, oldToken]);

      return {
        token: newToken,
        expires_at: expiresAt
      };

    } catch (error) {
      logger.error('Error in refreshToken service:', error);
      throw error;
    }
  }

  /**
   * Verificar si un token es válido
   */
  static async verifyToken(token) {
    try {
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'prosperpos_secret_key'
      );

      // Verificar si la sesión existe y está activa
      const sessions = await db.query(`
        SELECT id 
        FROM user_sessions 
        WHERE token = ? 
          AND is_active = true 
          AND expires_at > NOW()
        LIMIT 1
      `, [token]);

      return sessions.length > 0;

    } catch (error) {
      return false;
    }
  }

  /**
   * Obtener sesiones activas del usuario
   */
  static async getActiveSessions(userId) {
    try {
      const sessions = await db.query(`
        SELECT 
          id,
          ip_address,
          user_agent,
          device_info,
          created_at,
          last_activity,
          expires_at,
          TIMESTAMPDIFF(MINUTE, last_activity, NOW()) as minutes_idle
        FROM user_sessions
        WHERE user_id = ? 
          AND is_active = true 
          AND expires_at > NOW()
        ORDER BY last_activity DESC
      `, [userId]);

      return sessions;

    } catch (error) {
      logger.error('Error in getActiveSessions service:', error);
      throw error;
    }
  }

  /**
   * Cerrar una sesión específica
   */
  static async closeSpecificSession(userId, sessionId) {
    try {
      await db.query(`
        UPDATE user_sessions 
        SET is_active = false 
        WHERE id = ? AND user_id = ?
      `, [sessionId, userId]);

      return { success: true };

    } catch (error) {
      logger.error('Error in closeSpecificSession service:', error);
      throw error;
    }
  }

  /**
   * Obtener roles y permisos del usuario
   */
  static async getUserRolesAndPermissions(userId) {
    try {
      const results = await db.query(`
        SELECT DISTINCT
          r.name as role_name,
          p.name as permission_name
        FROM users u
        INNER JOIN user_roles ur ON u.id = ur.user_id
        INNER JOIN roles r ON ur.role_id = r.id
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = ?
      `, [userId]);

      const roles = [...new Set(results.map(r => r.role_name))];
      const permissions = [...new Set(results.map(r => r.permission_name).filter(p => p))];

      return { roles, permissions };

    } catch (error) {
      logger.error('Error in getUserRolesAndPermissions service:', error);
      return { roles: [], permissions: [] };
    }
  }

  /**
   * Obtener permisos del usuario
   */
  static async getUserPermissions(userId) {
    try {
      const results = await db.query(`
        SELECT DISTINCT
          p.name as permission_name,
          p.display_name,
          p.description,
          p.module
        FROM users u
        INNER JOIN user_roles ur ON u.id = ur.user_id
        INNER JOIN roles r ON ur.role_id = r.id
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = ? AND p.id IS NOT NULL
        ORDER BY p.module, p.name
      `, [userId]);

      // Agrupar por módulo
      const grouped = results.reduce((acc, perm) => {
        if (!acc[perm.module]) {
          acc[perm.module] = [];
        }
        acc[perm.module].push({
          name: perm.permission_name,
          display_name: perm.display_name,
          description: perm.description
        });
        return acc;
      }, {});

      return {
        permissions: results.map(r => r.permission_name),
        grouped
      };

    } catch (error) {
      logger.error('Error in getUserPermissions service:', error);
      throw error;
    }
  }

  // ===================================================================
  // FUNCIONES AUXILIARES
  // ===================================================================

  /**
   * Generar token JWT
   */
  static generateToken(user, expiresIn = '24h') {
    return jwt.sign(
      {
        id: user.id,
        userId: user.id, // Compatibilidad
        email: user.email,
        username: user.username,
        storeId: user.store_id
      },
      process.env.JWT_SECRET || 'prosperpos_secret_key',
      { expiresIn }
    );
  }

  /**
   * Registrar intento de login
   */
  static async recordLoginAttempt(email, ipAddress, userAgent, success, failureReason = null) {
    try {
      await db.query(`
        INSERT INTO login_attempts (
          email, ip_address, user_agent, success, failure_reason, attempted_at
        ) VALUES (?, ?, ?, ?, ?, NOW())
      `, [email, ipAddress, userAgent, success, failureReason]);
    } catch (error) {
      logger.error('Error recording login attempt:', error);
    }
  }

  /**
   * Obtener intentos fallidos recientes
   */
  static async getRecentFailedAttempts(email, ipAddress) {
    try {
      const results = await db.query(`
        SELECT COUNT(*) as count
        FROM login_attempts
        WHERE (email = ? OR ip_address = ?)
          AND success = false
          AND attempted_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
      `, [email, ipAddress]);

      return results[0]?.count || 0;
    } catch (error) {
      logger.error('Error getting failed attempts:', error);
      return 0;
    }
  }

  /**
   * Bloquear usuario temporalmente
   */
  static async lockUser(userId) {
    try {
      await db.query(`
        UPDATE users 
        SET is_active = false, updated_at = NOW()
        WHERE id = ?
      `, [userId]);

      logger.security('USER_LOCKED', { userId, reason: 'multiple_failed_attempts' });
    } catch (error) {
      logger.error('Error locking user:', error);
    }
  }

  /**
   * Generar token de desarrollo
   */
  static async generateDevToken() {
    try {
      // Buscar o crear usuario admin
      let users = await db.query(
        'SELECT id FROM users WHERE username = ? LIMIT 1',
        ['admin']
      );

      let userId = 1;
      if (users.length > 0) {
        userId = users[0].id;
      }

      const token = jwt.sign(
        {
          id: userId,
          userId: userId,
          email: 'admin@prosperpos.com',
          username: 'admin',
          storeId: 1
        },
        process.env.JWT_SECRET || 'prosperpos_secret_key',
        { expiresIn: '24h' }
      );

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Guardar sesión
      await db.query(`
        INSERT INTO user_sessions (
          user_id, token, ip_address, user_agent, expires_at, created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())
      `, [userId, token, '127.0.0.1', 'Development', expiresAt]);

      return { token, expires_at: expiresAt };

    } catch (error) {
      logger.error('Error generating dev token:', error);
      throw error;
    }
  }
}

module.exports = AuthService;