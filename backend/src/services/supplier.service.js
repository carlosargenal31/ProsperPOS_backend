// ===================================================================
// PROSPERPOS - SERVICIO DE PROVEEDORES COMPLETO
// ===================================================================

const Supplier = require('../models/Supplier.model');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

class SupplierService {
  
  // ===================================================================
  // OPERACIONES CRUD
  // ===================================================================

  /**
   * Crear nuevo proveedor
   */
  async createSupplier(supplierData, userId) {
    try {
      logger.info('Creando nuevo proveedor', { supplierData, userId });

      // Validaciones de negocio
      await this.validateSupplierData(supplierData);

      const supplier = await Supplier.create(supplierData, userId);

      logger.info('Proveedor creado exitosamente', { supplierId: supplier.id });
      return {
        success: true,
        data: supplier,
        message: 'Proveedor creado exitosamente'
      };
    } catch (error) {
      logger.error('Error al crear proveedor', { error: error.message, supplierData });
      throw error;
    }
  }

  /**
   * Obtener proveedor por ID
   */
  async getSupplierById(id) {
    try {
      const supplier = await Supplier.findById(id);
      
      if (!supplier) {
        throw new Error('Proveedor no encontrado');
      }

      // Obtener estadísticas adicionales
      const stats = await Supplier.getSupplierStats(id);

      return {
        success: true,
        data: {
          ...supplier,
          stats,
          contact_info: supplier.getContactInfo(),
          bank_info: supplier.getBankInfo()
        }
      };
    } catch (error) {
      logger.error('Error al obtener proveedor', { error: error.message, supplierId: id });
      throw error;
    }
  }

  /**
   * Obtener proveedor por código
   */
  async getSupplierByCode(code) {
    try {
      const supplier = await Supplier.findByCode(code);
      
      if (!supplier) {
        throw new Error('Proveedor no encontrado');
      }

      return {
        success: true,
        data: supplier
      };
    } catch (error) {
      logger.error('Error al obtener proveedor por código', { error: error.message, code });
      throw error;
    }
  }

  /**
   * Actualizar proveedor
   */
  async updateSupplier(id, updateData, userId) {
    try {
      logger.info('Actualizando proveedor', { supplierId: id, updateData, userId });

      // Validaciones de negocio
      if (Object.keys(updateData).length === 0) {
        throw new Error('No se proporcionaron datos para actualizar');
      }

      await this.validateSupplierData(updateData, false);

      const supplier = await Supplier.update(id, updateData, userId);

      logger.info('Proveedor actualizado exitosamente', { supplierId: id });
      return {
        success: true,
        data: supplier,
        message: 'Proveedor actualizado exitosamente'
      };
    } catch (error) {
      logger.error('Error al actualizar proveedor', { error: error.message, supplierId: id });
      throw error;
    }
  }

  /**
   * Eliminar proveedor
   */
  async deleteSupplier(id, userId) {
    try {
      logger.info('Eliminando proveedor', { supplierId: id, userId });

      const deleted = await Supplier.delete(id, userId);

      if (!deleted) {
        throw new Error('No se pudo eliminar el proveedor');
      }

      logger.info('Proveedor eliminado exitosamente', { supplierId: id });
      return {
        success: true,
        message: 'Proveedor eliminado exitosamente'
      };
    } catch (error) {
      logger.error('Error al eliminar proveedor', { error: error.message, supplierId: id });
      throw error;
    }
  }

  // ===================================================================
  // OPERACIONES DE CONSULTA
  // ===================================================================

  /**
   * Listar proveedores con filtros
   */
  async getSuppliers(filters = {}) {
    try {
      const result = await Supplier.findAll(filters);

      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
        filters: {
          search: filters.search || '',
          supplier_type: filters.supplier_type || null,
          is_active: filters.is_active !== undefined ? filters.is_active : null,
          country: filters.country || null,
          sort_by: filters.sort_by || 'name',
          sort_order: filters.sort_order || 'ASC'
        }
      };
    } catch (error) {
      logger.error('Error al listar proveedores', { error: error.message, filters });
      throw error;
    }
  }

  /**
   * Obtener proveedores activos para formularios
   */
  async getActiveSuppliersForForms(limit = 50) {
    try {
      const suppliers = await Supplier.getActiveSuppliers(limit);

      return {
        success: true,
        data: suppliers
      };
    } catch (error) {
      logger.error('Error al obtener proveedores activos', { error: error.message });
      throw error;
    }
  }

  /**
   * Buscar proveedores por término
   */
  async searchSuppliers(search, limit = 10) {
    try {
      if (!search || search.trim().length < 2) {
        return {
          success: true,
          data: []
        };
      }

      const suppliers = await Supplier.searchSuppliers(search.trim(), parseInt(limit));

      return {
        success: true,
        data: suppliers.map(supplier => ({
          id: supplier.id,
          code: supplier.code,
          name: supplier.name,
          company_name: supplier.company_name,
          display_name: supplier.company_name || supplier.name,
          email: supplier.email,
          phone: supplier.phone,
          city: supplier.city,
          country: supplier.country
        }))
      };
    } catch (error) {
      logger.error('Error al buscar proveedores', { error: error.message, search });
      throw error;
    }
  }

  /**
   * Obtener historial de compras de un proveedor
   */
  async getSupplierPurchaseHistory(supplierId, filters = {}) {
    try {
      // Verificar que el proveedor existe
      const supplier = await Supplier.findById(supplierId);
      if (!supplier) {
        throw new Error('Proveedor no encontrado');
      }

      const result = await Supplier.getPurchaseHistory(supplierId, filters);

      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
        supplier: {
          id: supplier.id,
          code: supplier.code,
          name: supplier.name,
          company_name: supplier.company_name
        }
      };
    } catch (error) {
      logger.error('Error al obtener historial de compras', { error: error.message, supplierId });
      throw error;
    }
  }

  // ===================================================================
  // OPERACIONES ESPECIALES
  // ===================================================================

  /**
   * Activar/Desactivar proveedor
   */
  async toggleSupplierStatus(id, userId) {
    try {
      const supplier = await Supplier.findById(id);
      if (!supplier) {
        throw new Error('Proveedor no encontrado');
      }

      const newStatus = !supplier.is_active;
      return await this.updateSupplier(id, { is_active: newStatus }, userId);
    } catch (error) {
      logger.error('Error al cambiar estado de proveedor', { error: error.message, supplierId: id });
      throw error;
    }
  }

  /**
   * Duplicar proveedor
   */
  async duplicateSupplier(id, userId) {
    try {
      const originalSupplier = await Supplier.findById(id);
      if (!originalSupplier) {
        throw new Error('Proveedor no encontrado');
      }

      const duplicateData = {
        name: `${originalSupplier.name} (Copia)`,
        company_name: originalSupplier.company_name ? `${originalSupplier.company_name} (Copia)` : null,
        phone: originalSupplier.phone,
        mobile: originalSupplier.mobile,
        address: originalSupplier.address,
        city: originalSupplier.city,
        state: originalSupplier.state,
        country: originalSupplier.country,
        postal_code: originalSupplier.postal_code,
        website: originalSupplier.website,
        supplier_type: originalSupplier.supplier_type,
        payment_terms: originalSupplier.payment_terms,
        credit_limit: originalSupplier.credit_limit,
        notes: originalSupplier.notes,
        is_active: false // Crear como inactivo por defecto
      };

      return await this.createSupplier(duplicateData, userId);
    } catch (error) {
      logger.error('Error al duplicar proveedor', { error: error.message, supplierId: id });
      throw error;
    }
  }

  /**
   * Obtener proveedores por tipo
   */
  async getSuppliersByType(supplierType) {
    try {
      const validTypes = ['general', 'manufacturer', 'distributor'];
      if (!validTypes.includes(supplierType)) {
        throw new Error('Tipo de proveedor inválido');
      }

      const result = await Supplier.findAll({
        supplier_type: supplierType,
        is_active: true,
        limit: 100
      });

      return {
        success: true,
        data: result.data,
        type: supplierType
      };
    } catch (error) {
      logger.error('Error al obtener proveedores por tipo', { error: error.message, supplierType });
      throw error;
    }
  }

  /**
   * Obtener proveedores con deuda pendiente
   */
  async getSuppliersWithDebt() {
    try {
      const result = await Supplier.findAll({
        limit: 100,
        sort_by: 'name',
        sort_order: 'ASC'
      });

      // Filtrar solo proveedores con deuda pendiente
      const suppliersWithDebt = result.data.filter(supplier => 
        supplier.balance_due && supplier.balance_due > 0
      );

      return {
        success: true,
        data: suppliersWithDebt,
        total_debt: suppliersWithDebt.reduce((sum, supplier) => sum + (supplier.balance_due || 0), 0)
      };
    } catch (error) {
      logger.error('Error al obtener proveedores con deuda', { error: error.message });
      throw error;
    }
  }

  /**
   * Generar código de proveedor
   */
  async generateSupplierCode() {
    try {
      const connection = await require('../utils/database').getConnection();
      try {
        const code = await Supplier.generateUniqueCode(connection);
        
        return {
          success: true,
          data: { code }
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      logger.error('Error al generar código de proveedor', { error: error.message });
      throw error;
    }
  }

  // ===================================================================
  // ESTADÍSTICAS Y REPORTES
  // ===================================================================

  /**
   * Obtener estadísticas generales de proveedores
   */
  async getSupplierStats() {
    try {
      const allSuppliers = await Supplier.findAll({ limit: 1000 });
      const activeSuppliers = await Supplier.findAll({ is_active: true, limit: 1000 });
      
      // Estadísticas por tipo
      const typeStats = {};
      allSuppliers.data.forEach(supplier => {
        const type = supplier.supplier_type || 'general';
        typeStats[type] = (typeStats[type] || 0) + 1;
      });

      // Estadísticas por país
      const countryStats = {};
      allSuppliers.data.forEach(supplier => {
        const country = supplier.country || 'No especificado';
        countryStats[country] = (countryStats[country] || 0) + 1;
      });

      const stats = {
        total_suppliers: allSuppliers.pagination.total,
        active_suppliers: activeSuppliers.pagination.total,
        inactive_suppliers: allSuppliers.pagination.total - activeSuppliers.pagination.total,
        suppliers_with_purchases: allSuppliers.data.filter(s => s.total_purchases > 0).length,
        suppliers_with_debt: allSuppliers.data.filter(s => s.balance_due > 0).length,
        total_debt: allSuppliers.data.reduce((sum, s) => sum + (s.balance_due || 0), 0),
        avg_credit_limit: allSuppliers.data.reduce((sum, s) => sum + (s.credit_limit || 0), 0) / allSuppliers.data.length,
        type_distribution: typeStats,
        country_distribution: countryStats
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas de proveedores', { error: error.message });
      throw error;
    }
  }

  /**
   * Obtener top proveedores por compras
   */
  async getTopSuppliersByPurchases(limit = 10) {
    try {
      const result = await Supplier.findAll({
        limit: 100,
        sort_by: 'total_purchased',
        sort_order: 'DESC'
      });

      const topSuppliers = result.data
        .filter(supplier => supplier.total_purchases > 0)
        .slice(0, limit)
        .map(supplier => ({
          id: supplier.id,
          code: supplier.code,
          name: supplier.name,
          company_name: supplier.company_name,
          total_purchases: supplier.total_purchases,
          total_purchased: supplier.total_purchased,
          balance_due: supplier.balance_due,
          avg_purchase: supplier.total_purchases > 0 ? 
            supplier.total_purchased / supplier.total_purchases : 0
        }));

      return {
        success: true,
        data: topSuppliers
      };
    } catch (error) {
      logger.error('Error al obtener top proveedores', { error: error.message });
      throw error;
    }
  }

  // ===================================================================
  // OPERACIONES MASIVAS
  // ===================================================================

  /**
   * Operaciones masivas en proveedores
   */
  async bulkSupplierAction(action, supplierIds, userId) {
    try {
      logger.info('Ejecutando operación masiva en proveedores', { action, supplierIds, userId });

      const results = [];
      const errors = [];

      for (const supplierId of supplierIds) {
        try {
          let result;
          
          switch (action) {
            case 'activate':
              result = await this.updateSupplier(supplierId, { is_active: true }, userId);
              break;
              
            case 'deactivate':
              result = await this.updateSupplier(supplierId, { is_active: false }, userId);
              break;
              
            case 'delete':
              result = await this.deleteSupplier(supplierId, userId);
              break;
              
            default:
              throw new Error('Acción no válida');
          }
          
          results.push({ supplierId, success: true, data: result });
        } catch (error) {
          errors.push({ supplierId, error: error.message });
        }
      }

      return {
        success: true,
        data: {
          successful: results.length,
          failed: errors.length,
          results: results,
          errors: errors
        },
        message: `Operación completada: ${results.length} exitosas, ${errors.length} fallidas`
      };
    } catch (error) {
      logger.error('Error en operación masiva de proveedores', { error: error.message });
      throw error;
    }
  }

  // ===================================================================
  // VALIDACIONES Y UTILIDADES
  // ===================================================================

  /**
   * Validar datos de proveedor
   */
  async validateSupplierData(data, isCreate = true) {
    const errors = [];

    // Validar nombre
    if (isCreate || data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push('El nombre del proveedor es requerido');
      } else if (data.name.trim().length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
      } else if (data.name.trim().length > 100) {
        errors.push('El nombre no puede exceder 100 caracteres');
      }
    }

    // Validar email
    if (data.email !== undefined && data.email !== null && data.email !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push('El formato del email no es válido');
      }
    }

    // Validar teléfonos
    if (data.phone !== undefined && data.phone !== null && data.phone !== '') {
      const phoneRegex = /^[\d\s\-\+\(\)]{8,20}$/;
      if (!phoneRegex.test(data.phone)) {
        errors.push('El formato del teléfono no es válido');
      }
    }

    if (data.mobile !== undefined && data.mobile !== null && data.mobile !== '') {
      const phoneRegex = /^[\d\s\-\+\(\)]{8,20}$/;
      if (!phoneRegex.test(data.mobile)) {
        errors.push('El formato del móvil no es válido');
      }
    }

    // Validar RTN
    if (data.rtn !== undefined && data.rtn !== null && data.rtn !== '') {
      if (!Supplier.validateRTN(data.rtn)) {
        errors.push('El RTN debe tener 14 dígitos');
      }
    }

    // Validar límite de crédito
    if (data.credit_limit !== undefined) {
      const creditLimit = parseFloat(data.credit_limit);
      if (isNaN(creditLimit) || creditLimit < 0) {
        errors.push('El límite de crédito debe ser un número positivo');
      }
    }

    // Validar términos de pago
    if (data.payment_terms !== undefined) {
      const paymentTerms = parseInt(data.payment_terms);
      if (isNaN(paymentTerms) || paymentTerms < 0) {
        errors.push('Los términos de pago deben ser un número positivo de días');
      }
    }

    // Validar tipo de proveedor
    if (data.supplier_type !== undefined) {
      const validTypes = ['general', 'manufacturer', 'distributor'];
      if (!validTypes.includes(data.supplier_type)) {
        errors.push('El tipo de proveedor debe ser: general, manufacturer o distributor');
      }
    }

    // Validar website
    if (data.website !== undefined && data.website !== null && data.website !== '') {
      try {
        new URL(data.website);
      } catch (e) {
        errors.push('El formato del sitio web no es válido');
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    return true;
  }

  /**
   * Validar permisos de usuario para operaciones
   */
  validateUserPermissions(userRole, operation) {
    const permissions = {
      'create': ['admin', 'manager'],
      'update': ['admin', 'manager'],
      'delete': ['admin'],
      'read': ['admin', 'manager', 'employee']
    };

    if (!permissions[operation] || !permissions[operation].includes(userRole)) {
      throw new Error('No tienes permisos para realizar esta operación');
    }

    return true;
  }

  /**
   * Formatear datos de proveedor para respuesta
   */
  formatSupplierForResponse(supplier) {
    return {
      ...supplier,
      display_name: supplier.company_name || supplier.name,
      contact_info: supplier.getContactInfo ? supplier.getContactInfo() : null,
      bank_info: supplier.getBankInfo ? supplier.getBankInfo() : null,
      formatted_credit_limit: supplier.credit_limit ? 
        `L. ${supplier.credit_limit.toLocaleString('es-HN')}` : 'Sin límite',
      payment_terms_text: supplier.payment_terms ? 
        `${supplier.payment_terms} días` : 'Inmediato'
    };
  }

  /**
   * Verificar si el proveedor puede ser eliminado
   */
  async canDeleteSupplier(supplierId) {
    try {
      const supplier = await Supplier.findById(supplierId);
      if (!supplier) {
        return { canDelete: false, reason: 'Proveedor no encontrado' };
      }

      // Verificar compras pendientes
      if (supplier.total_purchases > 0 && supplier.balance_due > 0) {
        return { 
          canDelete: false, 
          reason: 'El proveedor tiene compras con saldo pendiente' 
        };
      }

      // Verificar productos asignados
      if (supplier.total_products > 0) {
        return { 
          canDelete: false, 
          reason: 'El proveedor tiene productos asignados' 
        };
      }

      return { canDelete: true };
    } catch (error) {
      logger.error('Error al verificar si se puede eliminar proveedor', { 
        error: error.message, 
        supplierId 
      });
      return { canDelete: false, reason: 'Error interno del servidor' };
    }
  }
}

module.exports = new SupplierService();