// ===================================================================
// PROSPERPOS - CONTROLADOR DE REPORTE DE PROVEEDORES
// ===================================================================

const SupplierReportService = require('../services/supplier-report.service');
const logger = require('../utils/logger');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');

class SupplierReportController {
  /**
   * Obtener reporte de compras por proveedor
   * @route GET /api/supplier-reports/purchases-by-supplier
   */
  static async getPurchasesBySupplier(req, res) {
    try {
      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        supplier_id: req.query.supplier_id,
        agency: req.query.agency,
        document_type: req.query.document_type,
        status: req.query.status
      };

      const result = await SupplierReportService.getPurchasesBySupplier(filters);

      return sendSuccessResponse(
        res,
        result,
        'Reporte de compras por proveedor obtenido exitosamente'
      );
    } catch (error) {
      logger.error('Error in SupplierReportController.getPurchasesBySupplier:', error);
      return sendErrorResponse(
        res,
        500,
        'Error al obtener el reporte de compras por proveedor',
        error.message
      );
    }
  }

  /**
   * Obtener detalle de compras por proveedor específico
   * @route GET /api/supplier-reports/supplier-detail/:supplier_name
   */
  static async getSupplierPurchasesDetail(req, res) {
    try {
      const { supplier_name } = req.params;

      if (!supplier_name) {
        return sendErrorResponse(
          res,
          400,
          'El nombre del proveedor es requerido'
        );
      }

      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        document_type: req.query.document_type,
        status: req.query.status
      };

      const result = await SupplierReportService.getSupplierPurchasesDetail(
        supplier_name,
        filters
      );

      return sendSuccessResponse(
        res,
        result,
        'Detalle de compras del proveedor obtenido exitosamente'
      );
    } catch (error) {
      logger.error('Error in SupplierReportController.getSupplierPurchasesDetail:', error);
      return sendErrorResponse(
        res,
        500,
        'Error al obtener el detalle de compras del proveedor',
        error.message
      );
    }
  }

  /**
   * Obtener lista de proveedores para filtros
   * @route GET /api/supplier-reports/suppliers-list
   */
  static async getSuppliersList(req, res) {
    try {
      const suppliers = await SupplierReportService.getSuppliersList();

      return sendSuccessResponse(
        res,
        suppliers,
        'Lista de proveedores obtenida exitosamente'
      );
    } catch (error) {
      logger.error('Error in SupplierReportController.getSuppliersList:', error);
      return sendErrorResponse(
        res,
        500,
        'Error al obtener la lista de proveedores',
        error.message
      );
    }
  }

  /**
   * Obtener top proveedores por monto de compras
   * @route GET /api/supplier-reports/top-suppliers
   */
  static async getTopSuppliers(req, res) {
    try {
      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        limit: req.query.limit || 10
      };

      const result = await SupplierReportService.getTopSuppliers(filters);

      return sendSuccessResponse(
        res,
        result,
        'Top proveedores obtenidos exitosamente'
      );
    } catch (error) {
      logger.error('Error in SupplierReportController.getTopSuppliers:', error);
      return sendErrorResponse(
        res,
        500,
        'Error al obtener los top proveedores',
        error.message
      );
    }
  }

  /**
   * Obtener estadísticas de compras por periodo
   * @route GET /api/supplier-reports/purchases-by-period
   */
  static async getPurchasesByPeriod(req, res) {
    try {
      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        period: req.query.period || 'month', // day, week, month, year
        supplier_id: req.query.supplier_id
      };

      const result = await SupplierReportService.getPurchasesByPeriod(filters);

      return sendSuccessResponse(
        res,
        result,
        'Estadísticas de compras por periodo obtenidas exitosamente'
      );
    } catch (error) {
      logger.error('Error in SupplierReportController.getPurchasesByPeriod:', error);
      return sendErrorResponse(
        res,
        500,
        'Error al obtener las estadísticas de compras por periodo',
        error.message
      );
    }
  }

  /**
   * Obtener información de la empresa para encabezado
   * @route GET /api/supplier-reports/company-info
   */
  static async getCompanyInfo(req, res) {
    try {
      const company = await SupplierReportService.getCompanyInfo();

      return sendSuccessResponse(
        res,
        company,
        'Información de empresa obtenida exitosamente'
      );
    } catch (error) {
      logger.error('Error in SupplierReportController.getCompanyInfo:', error);
      return sendErrorResponse(
        res,
        500,
        'Error al obtener información de la empresa',
        error.message
      );
    }
  }
}

module.exports = SupplierReportController;
