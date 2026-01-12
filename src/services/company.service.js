/**
 * Company Service
 * Gestión de empresas/sucursales
 */

const db = require('../utils/database');
const logger = require('../utils/logger');

class CompanyService {
  /**
   * Obtener todas las empresas
   */
  static async getAllCompanies() {
    try {
      const companies = await db.execute(
        'SELECT * FROM companies WHERE deleted_at IS NULL ORDER BY is_default DESC, name ASC'
      );

      return companies;
    } catch (error) {
      logger.error('Error in CompanyService.getAllCompanies:', error);
      throw error;
    }
  }

  /**
   * Obtener empresa por ID
   */
  static async getCompanyById(id) {
    try {
      const companies = await db.execute(
        'SELECT * FROM companies WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (!companies || companies.length === 0) {
        throw new Error('Empresa no encontrada');
      }

      return companies[0];
    } catch (error) {
      logger.error('Error in CompanyService.getCompanyById:', error);
      throw error;
    }
  }

  /**
   * Obtener empresa por defecto
   */
  static async getDefaultCompany() {
    try {
      const companies = await db.execute(
        'SELECT * FROM companies WHERE is_default = 1 AND deleted_at IS NULL LIMIT 1'
      );

      if (!companies || companies.length === 0) {
        // Si no hay empresa por defecto, obtener la primera activa
        const firstCompany = await db.execute(
          'SELECT * FROM companies WHERE is_active = 1 AND deleted_at IS NULL ORDER BY id ASC LIMIT 1'
        );

        if (!firstCompany || firstCompany.length === 0) {
          throw new Error('No hay empresas registradas');
        }

        return firstCompany[0];
      }

      return companies[0];
    } catch (error) {
      logger.error('Error in CompanyService.getDefaultCompany:', error);
      throw error;
    }
  }

  /**
   * Crear nueva empresa
   */
  static async createCompany(companyData, userId) {
    try {
      const result = await db.execute(
        `INSERT INTO companies (
          name, commercial_name, rtn, address, phone, email, website,
          country, state, city,
          facebook, instagram, whatsapp, tiktok,
          logo_url,
          timezone, date_format, time_format, financial_year, starting_month,
          is_active, is_default,
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          companyData.name,
          companyData.commercial_name || null,
          companyData.rtn || null,
          companyData.address || null,
          companyData.phone || null,
          companyData.email || null,
          companyData.website || null,
          companyData.country || 'Honduras',
          companyData.state || null,
          companyData.city || null,
          companyData.facebook || null,
          companyData.instagram || null,
          companyData.whatsapp || null,
          companyData.tiktok || null,
          companyData.logo_url || null,
          companyData.timezone || 'America/Tegucigalpa',
          companyData.date_format || 'DD/MM/YYYY',
          companyData.time_format || '12',
          companyData.financial_year || new Date().getFullYear(),
          companyData.starting_month || 1,
          companyData.is_active !== undefined ? companyData.is_active : 1,
          companyData.is_default || 0,
          userId
        ]
      );

      return {
        id: result.insertId,
        message: 'Empresa creada exitosamente'
      };
    } catch (error) {
      logger.error('Error in CompanyService.createCompany:', error);
      throw error;
    }
  }

  /**
   * Actualizar empresa
   */
  static async updateCompany(id, companyData, userId) {
    try {
      const updates = [];
      const params = [];

      const allowedFields = [
        'name', 'commercial_name', 'rtn', 'address', 'phone', 'email', 'website',
        'country', 'state', 'city',
        'facebook', 'instagram', 'whatsapp', 'tiktok',
        'logo_url',
        'timezone', 'date_format', 'time_format', 'financial_year', 'starting_month',
        'is_active', 'is_default'
      ];

      allowedFields.forEach(field => {
        if (companyData[field] !== undefined) {
          updates.push(`${field} = ?`);
          params.push(companyData[field]);
        }
      });

      if (updates.length === 0) {
        throw new Error('No hay datos para actualizar');
      }

      updates.push('updated_by = ?');
      params.push(userId);
      params.push(id);

      // Si se marca como defecto, desmarcar las demás
      if (companyData.is_default === 1 || companyData.is_default === true) {
        await db.execute('UPDATE companies SET is_default = 0 WHERE id != ?', [id]);
      }

      const result = await db.execute(
        `UPDATE companies SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
        params
      );

      return { message: 'Empresa actualizada exitosamente' };
    } catch (error) {
      logger.error('Error in CompanyService.updateCompany:', error);
      throw error;
    }
  }

  /**
   * Eliminar empresa (soft delete)
   */
  static async deleteCompany(id, userId) {
    try {
      // Verificar que no sea la empresa por defecto
      const company = await this.getCompanyById(id);

      if (company.is_default) {
        throw new Error('No se puede eliminar la empresa por defecto');
      }

      await db.execute(
        'UPDATE companies SET deleted_at = NOW(), updated_by = ? WHERE id = ?',
        [userId, id]
      );

      return { message: 'Empresa eliminada exitosamente' };
    } catch (error) {
      logger.error('Error in CompanyService.deleteCompany:', error);
      throw error;
    }
  }

  /**
   * Establecer empresa como defecto
   */
  static async setAsDefault(id, userId) {
    try {
      // Desmarcar todas las empresas como defecto
      await db.execute('UPDATE companies SET is_default = 0');

      // Marcar esta como defecto
      await db.execute(
        'UPDATE companies SET is_default = 1, updated_by = ? WHERE id = ? AND deleted_at IS NULL',
        [userId, id]
      );

      return { message: 'Empresa establecida como predeterminada' };
    } catch (error) {
      logger.error('Error in CompanyService.setAsDefault:', error);
      throw error;
    }
  }
}

module.exports = CompanyService;
