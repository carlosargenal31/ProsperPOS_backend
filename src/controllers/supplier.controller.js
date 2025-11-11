// ===================================================================
// PROSPERPOS - CONTROLADOR DE PROVEEDORES COMPLETO
// ===================================================================

const supplierService = require('../services/supplier.service');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/response');
const { validationResult } = require('express-validator');

class SupplierController {

  // ===================================================================
  // OPERACIONES CRUD
  // ===================================================================

  /**
   * @desc    Crear nuevo proveedor
   * @route   POST /api/v1/suppliers
   * @access  Private (Admin, Manager)
   */
  async createSupplier(req, res) {
    try {
      // Verificar errores de validación
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 'Errores de validación', 400, errors.array());
      }

      const result = await supplierService.createSupplier(req.body, req.user.id);
      
      return successResponse(
        res, 
        result.data, 
        result.message, 
        201
      );
    } catch (error) {
      logger.error('Error en createSupplier', { 
        error: error.message, 
        userId: req.user?.id,
        body: req.body 
      });
      
      return errorResponse(
        res, 
        error.message || 'Error interno del servidor', 
        error.statusCode || 500
      );
    }
  }

  /**
   * @desc    Obtener todos los proveedores
   * @route   GET /api/v1/suppliers
   * @access  Private
   */
  async getSuppliers(req, res) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        search: req.query.search || '',
        supplier_type: req.query.supplier_type || null,
        is_active: req.query.is_active !== undefined ? 
          req.query.is_active === 'true' : null,
        country: req.query.country || null,
        sort_by: req.query.sort_by || 'name',
        sort_order: req.query.sort_order || 'ASC'
      };

      const result = await supplierService.getSuppliers(filters);
      
      return successResponse(res, result.data, 'Proveedores obtenidos exitosamente', 200, {
        pagination: result.pagination,
        filters: result.filters
      });
    } catch (error) {
      logger.error('Error en getSuppliers', { 
        error: error.message, 
        query: req.query 
      });
      
      return errorResponse(
        res, 
        error.message || 'Error interno del servidor', 
        500
      );
    }
  }

  /**
   * @desc    Obtener proveedor por ID
   * @route   GET /api/v1/suppliers/:id
   * @access  Private
   */
  async getSupplierById(req, res) {
    try {
      const { id } = req.params;
      
      const result = await supplierService.getSupplierById(id);
      
      return successResponse(
        res, 
        result.data, 
        'Proveedor obtenido exitosamente'
      );
    } catch (error) {
      logger.error('Error en getSupplierById', { 
        error: error.message, 
        supplierId: req.params.id 
      });
      
      const statusCode = error.message === 'Proveedor no encontrado' ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  /**
   * @desc    Obtener proveedor por código
   * @route   GET /api/v1/suppliers/code/:code
   * @access  Private
   */
  async getSupplierByCode(req, res) {
    try {
      const { code } = req.params;
      
      const result = await supplierService.getSupplierByCode(code);
      
      return successResponse(
        res, 
        result.data, 
        'Proveedor obtenido exitosamente'
      );
    } catch (error) {
      logger.error('Error en getSupplierByCode', { 
        error: error.message, 
        code: req.params.code 
      });
      
      const statusCode = error.message === 'Proveedor no encontrado' ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  /**
   * @desc    Actualizar proveedor
   * @route   PUT /api/v1/suppliers/:id
   * @access  Private (Admin, Manager)
   */
  async updateSupplier(req, res) {
    try {
      // Verificar errores de validación
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 'Errores de validación', 400, errors.array());
      }

      const { id } = req.params;
      
      const result = await supplierService.updateSupplier(id, req.body, req.user.id);
      
      return successResponse(
        res, 
        result.data, 
        result.message
      );
    } catch (error) {
      logger.error('Error en updateSupplier', { 
        error: error.message, 
        supplierId: req.params.id,
        body: req.body 
      });
      
      const statusCode = error.message === 'Proveedor no encontrado' ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  /**
   * @desc    Eliminar proveedor
   * @route   DELETE /api/v1/suppliers/:id
   * @access  Private (Admin)
   */
  async deleteSupplier(req, res) {
    try {
      const { id } = req.params;
      
      const result = await supplierService.deleteSupplier(id, req.user.id);
      
      return successResponse(
        res, 
        null, 
        result.message
      );
    } catch (error) {
      logger.error('Error en deleteSupplier', { 
        error: error.message, 
        supplierId: req.params.id 
      });
      
      const statusCode = error.message === 'Proveedor no encontrado' ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  // ===================================================================
  // OPERACIONES ESPECIALIZADAS
  // ===================================================================

  /**
   * @desc    Obtener proveedores activos para formularios
   * @route   GET /api/v1/suppliers/active
   * @access  Private
   */
  async getActiveSuppliersForForms(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      
      const result = await supplierService.getActiveSuppliersForForms(limit);
      
      return successResponse(
        res, 
        result.data, 
        'Proveedores activos obtenidos exitosamente'
      );
    } catch (error) {
      logger.error('Error en getActiveSuppliersForForms', { error: error.message });
      
      return errorResponse(
        res, 
        error.message || 'Error interno del servidor', 
        500
      );
    }
  }

  /**
   * @desc    Buscar proveedores
   * @route   GET /api/v1/suppliers/search
   * @access  Private
   */
  async searchSuppliers(req, res) {
    try {
      const { q: search, limit } = req.query;
      
      if (!search || search.trim().length < 2) {
        return successResponse(res, [], 'Búsqueda requiere al menos 2 caracteres');
      }

      const result = await supplierService.searchSuppliers(search, limit);
      
      return successResponse(
        res, 
        result.data, 
        'Búsqueda completada exitosamente'
      );
    } catch (error) {
      logger.error('Error en searchSuppliers', { 
        error: error.message, 
        search: req.query.q 
      });
      
      return errorResponse(
        res, 
        error.message || 'Error interno del servidor', 
        500
      );
    }
  }

  /**
   * @desc    Obtener proveedores por tipo
   * @route   GET /api/v1/suppliers/type/:type
   * @access  Private
   */
  async getSuppliersByType(req, res) {
    try {
      const { type } = req.params;
      
      const result = await supplierService.getSuppliersByType(type);
      
      return successResponse(
        res, 
        result.data, 
        `Proveedores tipo ${type} obtenidos exitosamente`
      );
    } catch (error) {
      logger.error('Error en getSuppliersByType', { 
        error: error.message, 
        type: req.params.type 
      });
      
      return errorResponse(
        res, 
        error.message || 'Error interno del servidor', 
        500
      );
    }
  }

  /**
   * @desc    Obtener historial de compras de un proveedor
   * @route   GET /api/v1/suppliers/:id/purchases
   * @access  Private
   */
  async getSupplierPurchaseHistory(req, res) {
    try {
      const { id } = req.params;
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10
      };
      
      const result = await supplierService.getSupplierPurchaseHistory(id, filters);
      
      return successResponse(
        res, 
        result.data, 
        'Historial de compras obtenido exitosamente',
        200,
        {
          pagination: result.pagination,
          supplier: result.supplier
        }
      );
    } catch (error) {
      logger.error('Error en getSupplierPurchaseHistory', { 
        error: error.message, 
        supplierId: req.params.id 
      });
      
      const statusCode = error.message === 'Proveedor no encontrado' ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  /**
   * @desc    Activar/Desactivar proveedor
   * @route   PUT /api/v1/suppliers/:id/toggle-status
   * @access  Private (Admin, Manager)
   */
  async toggleSupplierStatus(req, res) {
    try {
      const { id } = req.params;
      
      const result = await supplierService.toggleSupplierStatus(id, req.user.id);
      
      return successResponse(
        res, 
        result.data, 
        result.message
      );
    } catch (error) {
      logger.error('Error en toggleSupplierStatus', { 
        error: error.message, 
        supplierId: req.params.id 
      });
      
      const statusCode = error.message === 'Proveedor no encontrado' ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  /**
   * @desc    Duplicar proveedor
   * @route   POST /api/v1/suppliers/:id/duplicate
   * @access  Private (Admin, Manager)
   */
  async duplicateSupplier(req, res) {
    try {
      const { id } = req.params;
      
      const result = await supplierService.duplicateSupplier(id, req.user.id);
      
      return successResponse(
        res, 
        result.data, 
        result.message,
        201
      );
    } catch (error) {
      logger.error('Error en duplicateSupplier', { 
        error: error.message, 
        supplierId: req.params.id 
      });
      
      const statusCode = error.message === 'Proveedor no encontrado' ? 404 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  /**
   * @desc    Generar código de proveedor
   * @route   GET /api/v1/suppliers/generate-code
   * @access  Private (Admin, Manager)
   */
  async generateSupplierCode(req, res) {
    try {
      const result = await supplierService.generateSupplierCode();
      
      return successResponse(
        res, 
        result.data, 
        'Código generado exitosamente'
      );
    } catch (error) {
      logger.error('Error en generateSupplierCode', { error: error.message });
      
      return errorResponse(
        res, 
        error.message || 'Error interno del servidor', 
        500
      );
    }
  }

  /**
   * @desc    Obtener proveedores con deuda pendiente
   * @route   GET /api/v1/suppliers/with-debt
   * @access  Private (Admin, Manager)
   */
  async getSuppliersWithDebt(req, res) {
    try {
      const result = await supplierService.getSuppliersWithDebt();
      
      return successResponse(
        res, 
        result.data, 
        'Proveedores con deuda obtenidos exitosamente',
        200,
        {
          total_debt: result.total_debt,
          count: result.data.length
        }
      );
    } catch (error) {
      logger.error('Error en getSuppliersWithDebt', { error: error.message });
      
      return errorResponse(
        res, 
        error.message || 'Error interno del servidor', 
        500
      );
    }
  }

  // ===================================================================
  // ESTADÍSTICAS Y REPORTES
  // ===================================================================

  /**
   * @desc    Obtener estadísticas de proveedores
   * @route   GET /api/v1/suppliers/stats
   * @access  Private (Admin, Manager)
   */
  async getSupplierStats(req, res) {
    try {
      const result = await supplierService.getSupplierStats();
      
      return successResponse(
        res, 
        result.data, 
        'Estadísticas obtenidas exitosamente'
      );
    } catch (error) {
      logger.error('Error en getSupplierStats', { error: error.message });
      
      return errorResponse(
        res, 
        error.message || 'Error interno del servidor', 
        500
      );
    }
  }

  /**
   * @desc    Obtener top proveedores por compras
   * @route   GET /api/v1/suppliers/top-by-purchases
   * @access  Private (Admin, Manager)
   */
  async getTopSuppliersByPurchases(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      
      const result = await supplierService.getTopSuppliersByPurchases(limit);
      
      return successResponse(
        res, 
        result.data, 
        'Top proveedores obtenidos exitosamente'
      );
    } catch (error) {
      logger.error('Error en getTopSuppliersByPurchases', { error: error.message });
      
      return errorResponse(
        res, 
        error.message || 'Error interno del servidor', 
        500
      );
    }
  }

  // ===================================================================
  // OPERACIONES MASIVAS
  // ===================================================================

  /**
   * @desc    Operaciones masivas en proveedores
   * @route   POST /api/v1/suppliers/bulk-action
   * @access  Private (Admin, Manager)
   */
  async bulkSupplierAction(req, res) {
    try {
      // Verificar errores de validación
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 'Errores de validación', 400, errors.array());
      }

      const { action, supplier_ids } = req.body;
      
      const result = await supplierService.bulkSupplierAction(action, supplier_ids, req.user.id);
      
      return successResponse(
        res, 
        result.data, 
        result.message
      );
    } catch (error) {
      logger.error('Error en bulkSupplierAction', { 
        error: error.message, 
        body: req.body 
      });
      
      return errorResponse(
        res, 
        error.message || 'Error interno del servidor', 
        500
      );
    }
  }

  // ===================================================================
  // VALIDACIONES Y UTILIDADES
  // ===================================================================

  /**
   * @desc    Verificar si un proveedor puede ser eliminado
   * @route   GET /api/v1/suppliers/:id/can-delete
   * @access  Private (Admin)
   */
  async canDeleteSupplier(req, res) {
    try {
      const { id } = req.params;
      
      const result = await supplierService.canDeleteSupplier(id);
      
      return successResponse(
        res, 
        result, 
        'Verificación completada'
      );
    } catch (error) {
      logger.error('Error en canDeleteSupplier', { 
        error: error.message, 
        supplierId: req.params.id 
      });
      
      return errorResponse(
        res, 
        error.message || 'Error interno del servidor', 
        500
      );
    }
  }

  /**
   * @desc    Validar RTN hondureño
   * @route   POST /api/v1/suppliers/validate-rtn
   * @access  Private
   */
  async validateRTN(req, res) {
    try {
      const { rtn } = req.body;
      
      if (!rtn) {
        return errorResponse(res, 'RTN es requerido', 400);
      }

      const Supplier = require('../models/Supplier.model');
      const isValid = Supplier.validateRTN(rtn);
      
      return successResponse(
        res, 
        { 
          rtn, 
          is_valid: isValid,
          message: isValid ? 'RTN válido' : 'RTN inválido - debe tener 14 dígitos'
        }, 
        'Validación completada'
      );
    } catch (error) {
      logger.error('Error en validateRTN', { error: error.message });
      
      return errorResponse(
        res, 
        error.message || 'Error interno del servidor', 
        500
      );
    }
  }

  // ===================================================================
  // IMPORTACIÓN Y EXPORTACIÓN
  // ===================================================================

  /**
   * @desc    Exportar proveedores a Excel/CSV
   * @route   GET /api/v1/suppliers/export
   * @access  Private (Admin, Manager)
   */
  async exportSuppliers(req, res) {
    try {
      const { format = 'excel', ...filters } = req.query;
      
      // Obtener todos los proveedores (sin paginación para exportar)
      const result = await supplierService.getSuppliers({
        ...filters,
        limit: 10000, // Límite alto para exportar todo
        page: 1
      });

      const suppliers = result.data.map(supplier => ({
        Código: supplier.code,
        Nombre: supplier.name,
        'Nombre Empresa': supplier.company_name || '',
        Email: supplier.email || '',
        Teléfono: supplier.phone || '',
        Móvil: supplier.mobile || '',
        Dirección: supplier.address || '',
        Ciudad: supplier.city || '',
        Estado: supplier.state || '',
        País: supplier.country || '',
        'Código Postal': supplier.postal_code || '',
        'Sitio Web': supplier.website || '',
        RTN: supplier.rtn || '',
        'Límite Crédito': supplier.credit_limit || 0,
        'Términos Pago (días)': supplier.payment_terms || 0,
        'Tipo Proveedor': supplier.supplier_type || '',
        Estado: supplier.is_active ? 'Activo' : 'Inactivo',
        'Total Compras': supplier.total_purchases || 0,
        'Monto Total': supplier.total_purchased || 0,
        'Saldo Pendiente': supplier.balance_due || 0,
        'Fecha Creación': supplier.created_at
      }));

      if (format === 'csv') {
        const csv = this.convertToCSV(suppliers);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=proveedores.csv');
        return res.send(csv);
      } else {
        // Para Excel, necesitarías una librería como 'xlsx'
        return successResponse(
          res,
          suppliers,
          'Datos preparados para exportación'
        );
      }
    } catch (error) {
      logger.error('Error en exportSuppliers', { error: error.message });
      
      return errorResponse(
        res, 
        error.message || 'Error interno del servidor', 
        500
      );
    }
  }

  /**
   * @desc    Importar proveedores desde Excel/CSV
   * @route   POST /api/v1/suppliers/import
   * @access  Private (Admin)
   */
  async importSuppliers(req, res) {
    try {
      // Esta funcionalidad requeriría middleware de upload de archivos
      // y procesamiento de Excel/CSV
      
      return errorResponse(
        res,
        'Funcionalidad de importación en desarrollo',
        501
      );
    } catch (error) {
      logger.error('Error en importSuppliers', { error: error.message });
      
      return errorResponse(
        res, 
        error.message || 'Error interno del servidor', 
        500
      );
    }
  }

  // ===================================================================
  // MÉTODOS AUXILIARES
  // ===================================================================

  /**
   * Convertir array de objetos a CSV
   */
  convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escapar valores que contengan comas o comillas
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  }

  /**
   * Validar filtros de consulta
   */
  validateQueryFilters(query) {
    const allowedFilters = [
      'page', 'limit', 'search', 'supplier_type', 'is_active', 
      'country', 'sort_by', 'sort_order'
    ];
    
    const invalidFilters = Object.keys(query).filter(
      key => !allowedFilters.includes(key)
    );
    
    if (invalidFilters.length > 0) {
      throw new Error(`Filtros no válidos: ${invalidFilters.join(', ')}`);
    }
    
    return true;
  }

  /**
   * Formatear respuesta de proveedor
   */
  formatSupplierResponse(supplier) {
    return {
      ...supplier,
      display_name: supplier.company_name || supplier.name,
      formatted_credit_limit: supplier.credit_limit ? 
        `L. ${supplier.credit_limit.toLocaleString('es-HN')}` : 'Sin límite',
      payment_terms_text: supplier.payment_terms ? 
        `${supplier.payment_terms} días` : 'Inmediato',
      status_text: supplier.is_active ? 'Activo' : 'Inactivo'
    };
  }
}

module.exports = new SupplierController();