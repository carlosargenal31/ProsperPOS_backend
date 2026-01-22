/**
 * Company Controller
 * Endpoints para gestión de empresas
 */

const CompanyService = require('../services/company.service');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class CompanyController {
  /**
   * GET /api/v1/companies
   * Obtener todas las empresas
   */
  static async getAllCompanies(req, res) {
    try {
      const companies = await CompanyService.getAllCompanies();

      sendSuccessResponse(res, companies, 'Empresas obtenidas exitosamente');
    } catch (error) {
      logger.error('Error in CompanyController.getAllCompanies:', error);
      sendErrorResponse(res, 500, 'Error al obtener empresas', error.message);
    }
  }

  /**
   * GET /api/v1/companies/:id
   * Obtener empresa por ID
   */
  static async getCompanyById(req, res) {
    try {
      const { id } = req.params;

      const company = await CompanyService.getCompanyById(id);

      sendSuccessResponse(res, company, 'Empresa obtenida exitosamente');
    } catch (error) {
      logger.error('Error in CompanyController.getCompanyById:', error);

      if (error.message === 'Empresa no encontrada') {
        return sendErrorResponse(res, 404, error.message);
      }

      sendErrorResponse(res, 500, 'Error al obtener empresa', error.message);
    }
  }

  /**
   * GET /api/v1/companies/default
   * Obtener empresa por defecto
   */
  static async getDefaultCompany(req, res) {
    try {
      const company = await CompanyService.getDefaultCompany();

      sendSuccessResponse(res, company, 'Empresa por defecto obtenida exitosamente');
    } catch (error) {
      logger.error('Error in CompanyController.getDefaultCompany:', error);

      if (error.message === 'No hay empresas registradas') {
        return sendErrorResponse(res, 404, error.message);
      }

      sendErrorResponse(res, 500, 'Error al obtener empresa por defecto', error.message);
    }
  }

  /**
   * POST /api/v1/companies
   * Crear nueva empresa
   */
  static async createCompany(req, res) {
    try {
      const companyData = req.body;
      const userId = req.user.userId;

      const result = await CompanyService.createCompany(companyData, userId);

      sendSuccessResponse(res, result, 'Empresa creada exitosamente', 201);
    } catch (error) {
      logger.error('Error in CompanyController.createCompany:', error);
      sendErrorResponse(res, 500, 'Error al crear empresa', error.message);
    }
  }

  /**
   * PUT /api/v1/companies/:id
   * Actualizar empresa
   */
  static async updateCompany(req, res) {
    try {
      const { id } = req.params;
      const companyData = req.body;
      const userId = req.user.userId;

      const result = await CompanyService.updateCompany(id, companyData, userId);

      sendSuccessResponse(res, result, 'Empresa actualizada exitosamente');
    } catch (error) {
      logger.error('Error in CompanyController.updateCompany:', error);

      if (error.message === 'Empresa no encontrada') {
        return sendErrorResponse(res, 404, error.message);
      }

      sendErrorResponse(res, 500, 'Error al actualizar empresa', error.message);
    }
  }

  /**
   * DELETE /api/v1/companies/:id
   * Eliminar empresa (soft delete)
   */
  static async deleteCompany(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const result = await CompanyService.deleteCompany(id, userId);

      sendSuccessResponse(res, result, 'Empresa eliminada exitosamente');
    } catch (error) {
      logger.error('Error in CompanyController.deleteCompany:', error);

      if (error.message === 'Empresa no encontrada') {
        return sendErrorResponse(res, 404, error.message);
      }

      if (error.message === 'No se puede eliminar la empresa por defecto') {
        return sendErrorResponse(res, 400, error.message);
      }

      sendErrorResponse(res, 500, 'Error al eliminar empresa', error.message);
    }
  }

  /**
   * PUT /api/v1/companies/:id/set-default
   * Establecer empresa como defecto
   */
  static async setAsDefault(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const result = await CompanyService.setAsDefault(id, userId);

      sendSuccessResponse(res, result, 'Empresa establecida como predeterminada');
    } catch (error) {
      logger.error('Error in CompanyController.setAsDefault:', error);
      sendErrorResponse(res, 500, 'Error al establecer empresa como predeterminada', error.message);
    }
  }

  /**
   * GET /api/v1/companies/ecommerce/config
   * Obtener configuración de e-commerce
   */
  static async getEcommerceConfig(req, res) {
    try {
      const config = await CompanyService.getEcommerceConfig();

      sendSuccessResponse(res, config, 'Configuración de e-commerce obtenida exitosamente');
    } catch (error) {
      logger.error('Error in CompanyController.getEcommerceConfig:', error);

      if (error.message === 'No hay empresas registradas') {
        return sendErrorResponse(res, 404, error.message);
      }

      sendErrorResponse(res, 500, 'Error al obtener configuración de e-commerce', error.message);
    }
  }

  /**
   * PUT /api/v1/companies/ecommerce/config
   * Actualizar configuración de e-commerce
   */
  static async updateEcommerceConfig(req, res) {
    try {
      const configData = req.body;
      const userId = req.user.userId;

      const result = await CompanyService.updateEcommerceConfig(configData, userId);

      sendSuccessResponse(res, result, 'Configuración de tienda actualizada exitosamente');
    } catch (error) {
      logger.error('Error in CompanyController.updateEcommerceConfig:', error);

      if (error.message === 'No hay empresas registradas') {
        return sendErrorResponse(res, 404, error.message);
      }

      sendErrorResponse(res, 500, 'Error al actualizar configuración de e-commerce', error.message);
    }
  }
}

module.exports = CompanyController;
