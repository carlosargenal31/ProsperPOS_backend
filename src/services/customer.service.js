// ===================================================================
// PROSPERPOS - SERVICIO DE CLIENTES
// ===================================================================

const CustomerModel = require('../models/Customer.model');
const { ValidationError, DatabaseError } = require('../middleware/error.middleware');
const logger = require('../utils/logger');
const { query } = require('../utils/database');

// ===================================================================
// SERVICIO DE CLIENTES
// ===================================================================

class CustomerService {

  // ===================================================================
  // OBTENER CLIENTES CON FILTROS Y PAGINACIÓN
  // ===================================================================
  
  static async getCustomers(filters) {
    try {
      logger.info('Obteniendo clientes con filtros', { filters });
      
      const result = await CustomerModel.findAll(filters);
      
      logger.info('Clientes obtenidos exitosamente', {
        total: result.pagination.totalItems,
        page: result.pagination.currentPage
      });
      
      return result;
    } catch (error) {
      logger.error('Error obteniendo clientes:', error);
      throw new DatabaseError('Error al obtener clientes');
    }
  }

  // ===================================================================
  // OBTENER CLIENTE POR ID
  // ===================================================================
  
  static async getCustomerById(id, options = {}) {
    try {
      logger.info('Obteniendo cliente por ID', { id, options });
      
      const customer = await CustomerModel.findById(id, options);
      
      if (!customer) {
        logger.warn('Cliente no encontrado', { id });
        return null;
      }
      
      logger.info('Cliente obtenido exitosamente', { 
        id: customer.id, 
        name: customer.full_name 
      });
      
      return customer;
    } catch (error) {
      logger.error('Error obteniendo cliente por ID:', error);
      throw new DatabaseError('Error al obtener cliente');
    }
  }

  // ===================================================================
  // CREAR NUEVO CLIENTE
  // ===================================================================
  
  static async createCustomer(customerData) {
    try {
      logger.info('Creando nuevo cliente', { 
        name: `${customerData.first_name} ${customerData.last_name}`,
        type: customerData.customer_type,
        email: customerData.email
      });

      // Validar que el email no exista (si se proporciona)
      if (customerData.email) {
        const emailExists = await CustomerModel.emailExists(customerData.email);
        if (emailExists) {
          throw new ValidationError('El email ya está registrado para otro cliente');
        }
      }

      // Validar que el documento no exista (si se proporciona)
      if (customerData.document_type && customerData.document_number) {
        const documentExists = await CustomerModel.documentExists(
          customerData.document_type, 
          customerData.document_number
        );
        if (documentExists) {
          throw new ValidationError('El documento ya está registrado para otro cliente');
        }
      }

      // Validaciones específicas para tipo de cliente
      if (customerData.customer_type === 'business') {
        if (!customerData.company_name) {
          throw new ValidationError('El nombre de la empresa es requerido para clientes empresariales');
        }
        
        // En Honduras, las empresas necesitan RTN
        if (customerData.document_type === 'rtn' && !customerData.tax_id) {
          customerData.tax_id = customerData.document_number;
        }
      }

      // Validar límite de crédito
      if (customerData.credit_limit && customerData.credit_limit < 0) {
        throw new ValidationError('El límite de crédito no puede ser negativo');
      }

      // Crear cliente
      const newCustomer = await CustomerModel.create(customerData);

      logger.info('Cliente creado exitosamente', { 
        id: newCustomer.id, 
        name: newCustomer.full_name 
      });

      return newCustomer;
    } catch (error) {
      logger.error('Error creando cliente:', error);
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new DatabaseError('Error al crear cliente');
    }
  }

  // ===================================================================
  // ACTUALIZAR CLIENTE
  // ===================================================================
  
  static async updateCustomer(id, updateData) {
    try {
      logger.info('Actualizando cliente', { id, fields: Object.keys(updateData) });

      // Validar que el cliente exista
      const existingCustomer = await CustomerModel.findById(id);
      if (!existingCustomer) {
        throw new ValidationError('Cliente no encontrado');
      }

      // Validar email único si se está actualizando
      if (updateData.email) {
        const emailExists = await CustomerModel.emailExists(updateData.email, id);
        if (emailExists) {
          throw new ValidationError('El email ya está registrado para otro cliente');
        }
      }

      // Validar documento único si se está actualizando
      if (updateData.document_type && updateData.document_number) {
        const documentExists = await CustomerModel.documentExists(
          updateData.document_type, 
          updateData.document_number, 
          id
        );
        if (documentExists) {
          throw new ValidationError('El documento ya está registrado para otro cliente');
        }
      }

      // Validaciones específicas para tipo de cliente
      if (updateData.customer_type === 'business' && updateData.company_name === '') {
        throw new ValidationError('El nombre de la empresa es requerido para clientes empresariales');
      }

      // Validar límite de crédito
      if (updateData.credit_limit !== undefined && updateData.credit_limit < 0) {
        throw new ValidationError('El límite de crédito no puede ser negativo');
      }

      const updatedCustomer = await CustomerModel.update(id, updateData);

      logger.info('Cliente actualizado exitosamente', { id });

      return updatedCustomer;
    } catch (error) {
      logger.error('Error actualizando cliente:', error);
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new DatabaseError('Error al actualizar cliente');
    }
  }

  // ===================================================================
  // ELIMINAR CLIENTE (SOFT DELETE)
  // ===================================================================
  
  static async deleteCustomer(id, deletedBy) {
    try {
      logger.info('Eliminando cliente', { id, deletedBy });

      const existingCustomer = await CustomerModel.findById(id);
      if (!existingCustomer) {
        throw new ValidationError('Cliente no encontrado');
      }

      // Verificar que no tenga ventas pendientes o activas
      const hasPendingSales = await this.customerHasPendingSales(id);
      if (hasPendingSales) {
        throw new ValidationError('No se puede eliminar el cliente porque tiene ventas pendientes');
      }

      const deleted = await CustomerModel.softDelete(id, deletedBy);
      
      if (!deleted) {
        throw new DatabaseError('No se pudo eliminar el cliente');
      }

      logger.info('Cliente eliminado exitosamente', { id });

      return true;
    } catch (error) {
      logger.error('Error eliminando cliente:', error);
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new DatabaseError('Error al eliminar cliente');
    }
  }

  // ===================================================================
  // CAMBIAR ESTADO DE CLIENTE
  // ===================================================================
  
  static async changeCustomerStatus(id, status, updatedBy) {
    try {
      logger.info('Cambiando estado de cliente', { id, status, updatedBy });

      const validStatuses = ['active', 'inactive', 'suspended'];
      if (!validStatuses.includes(status)) {
        throw new ValidationError('Estado inválido');
      }

      const updated = await CustomerModel.update(id, { 
        status, 
        updated_by: updatedBy 
      });

      if (!updated) {
        throw new ValidationError('Cliente no encontrado');
      }

      logger.info('Estado de cliente cambiado exitosamente', { id, status });

      return updated;
    } catch (error) {
      logger.error('Error cambiando estado de cliente:', error);
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new DatabaseError('Error al cambiar estado del cliente');
    }
  }

  // ===================================================================
  // BÚSQUEDA RÁPIDA PARA POS
  // ===================================================================
  
  static async searchCustomersForPOS(searchTerm, limit = 10) {
    try {
      logger.info('Búsqueda rápida de clientes para POS', { searchTerm, limit });

      if (!searchTerm || searchTerm.length < 2) {
        return [];
      }

      const customers = await CustomerModel.searchForPOS(searchTerm, limit);

      logger.info('Búsqueda de clientes completada', { 
        searchTerm, 
        results: customers.length 
      });

      return customers;
    } catch (error) {
      logger.error('Error en búsqueda de clientes:', error);
      throw new DatabaseError('Error al buscar clientes');
    }
  }

  // ===================================================================
  // OBTENER ESTADÍSTICAS
  // ===================================================================
  
  static async getCustomerStats() {
    try {
      logger.info('Obteniendo estadísticas de clientes');

      const stats = await CustomerModel.getStats();

      // Obtener estadísticas adicionales
      const citySql = `
        SELECT city, COUNT(*) as count
        FROM customers
        WHERE city IS NOT NULL AND city != '' 
        AND deleted_at IS NULL
        GROUP BY city
        ORDER BY count DESC
        LIMIT 10
      `;
      
      const cityStats = await query(citySql);
      stats.by_city = cityStats;

      // Top clientes por ventas
      const topCustomers = await CustomerModel.getTopCustomers(5);
      stats.top_customers = topCustomers;

      // Actividad reciente
      const recentActivitySql = `
        SELECT DATE(created_at) as date, COUNT(*) as customers_created
        FROM customers
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND deleted_at IS NULL
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `;
      
      const recentActivity = await query(recentActivitySql);
      stats.recent_activity = recentActivity;

      // Distribución por género
      const genderSql = `
        SELECT 
          CASE 
            WHEN gender = 'M' THEN 'Masculino'
            WHEN gender = 'F' THEN 'Femenino'
            ELSE 'No especificado'
          END as gender_label,
          COUNT(*) as count
        FROM customers
        WHERE deleted_at IS NULL
        GROUP BY gender
      `;
      
      const genderStats = await query(genderSql);
      stats.by_gender = genderStats;

      logger.info('Estadísticas obtenidas exitosamente');

      return stats;
    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      throw new DatabaseError('Error al obtener estadísticas');
    }
  }

  // ===================================================================
  // OBTENER HISTORIAL DE COMPRAS
  // ===================================================================
  
  static async getCustomerPurchaseHistory(customerId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        startDate = null,
        endDate = null
      } = options;

      logger.info('Obteniendo historial de compras', { customerId, options });

      const offset = (page - 1) * limit;
      let whereConditions = ['s.customer_id = ?', 's.deleted_at IS NULL'];
      let params = [customerId];

      if (startDate) {
        whereConditions.push('s.created_at >= ?');
        params.push(startDate);
      }

      if (endDate) {
        whereConditions.push('s.created_at <= ?');
        params.push(endDate);
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      const sql = `
        SELECT 
          s.id, s.invoice_number, s.total, s.total_items,
          s.payment_method, s.status, s.created_at,
          u.first_name as cashier_first_name,
          u.last_name as cashier_last_name
        FROM sales s
        LEFT JOIN users u ON s.user_id = u.id
        ${whereClause}
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const countSql = `
        SELECT COUNT(*) as total
        FROM sales s
        ${whereClause}
      `;

      const [sales, countResult] = await Promise.all([
        query(sql, [...params, limit, offset]),
        query(countSql, params)
      ]);

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      return {
        data: sales,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      logger.error('Error obteniendo historial de compras:', error);
      throw new DatabaseError('Error al obtener historial de compras');
    }
  }

  // ===================================================================
  // OBTENER PRODUCTOS FAVORITOS DEL CLIENTE
  // ===================================================================
  
  static async getCustomerFavoriteProducts(customerId, limit = 10) {
    try {
      logger.info('Obteniendo productos favoritos del cliente', { customerId, limit });

      const sql = `
        SELECT 
          p.id, p.name, p.sku, p.price,
          COUNT(si.id) as purchase_count,
          SUM(si.quantity) as total_quantity,
          SUM(si.subtotal) as total_spent_on_product,
          MAX(s.created_at) as last_purchase_date
        FROM products p
        INNER JOIN sale_items si ON p.id = si.product_id
        INNER JOIN sales s ON si.sale_id = s.id
        WHERE s.customer_id = ? AND s.deleted_at IS NULL AND p.deleted_at IS NULL
        GROUP BY p.id
        ORDER BY purchase_count DESC, total_quantity DESC
        LIMIT ?
      `;

      const products = await query(sql, [customerId, limit]);

      logger.info('Productos favoritos obtenidos', { 
        customerId, 
        products: products.length 
      });

      return products;
    } catch (error) {
      logger.error('Error obteniendo productos favoritos:', error);
      throw new DatabaseError('Error al obtener productos favoritos');
    }
  }

  // ===================================================================
  // VALIDAR LÍMITE DE CRÉDITO
  // ===================================================================
  
  static async validateCreditLimit(customerId, saleAmount) {
    try {
      logger.info('Validando límite de crédito', { customerId, saleAmount });

      // Obtener información del cliente
      const customer = await CustomerModel.findById(customerId);
      if (!customer) {
        throw new ValidationError('Cliente no encontrado');
      }

      // Si no tiene límite de crédito configurado, permitir la venta
      if (!customer.credit_limit || customer.credit_limit <= 0) {
        return { allowed: true, availableCredit: null };
      }

      // Calcular crédito usado (ventas pendientes de pago)
      const creditUsedSql = `
        SELECT COALESCE(SUM(s.total), 0) as credit_used
        FROM sales s
        WHERE s.customer_id = ? 
        AND s.payment_status IN ('pending', 'partial')
        AND s.deleted_at IS NULL
      `;

      const creditResult = await query(creditUsedSql, [customerId]);
      const creditUsed = creditResult[0].credit_used;
      const availableCredit = customer.credit_limit - creditUsed;

      const allowed = saleAmount <= availableCredit;

      logger.info('Validación de crédito completada', {
        customerId,
        creditLimit: customer.credit_limit,
        creditUsed,
        availableCredit,
        saleAmount,
        allowed
      });

      return {
        allowed,
        creditLimit: customer.credit_limit,
        creditUsed,
        availableCredit,
        exceedsBy: allowed ? 0 : saleAmount - availableCredit
      };
    } catch (error) {
      logger.error('Error validando límite de crédito:', error);
      throw new DatabaseError('Error al validar límite de crédito');
    }
  }

  // ===================================================================
  // FUNCIONES AUXILIARES
  // ===================================================================
  
  static async customerHasPendingSales(customerId) {
    try {
      // Verificar ventas no completadas o pendientes de pago
      const salesSql = `
        SELECT COUNT(*) as count
        FROM sales 
        WHERE customer_id = ? 
        AND (status != 'completed' OR payment_status IN ('pending', 'partial'))
        AND deleted_at IS NULL
      `;
      
      const salesResult = await query(salesSql, [customerId]);
      
      return salesResult[0].count > 0;
    } catch (error) {
      logger.error('Error verificando ventas pendientes:', error);
      return false;
    }
  }

  // ===================================================================
  // OBTENER CLIENTES ACTIVOS PARA SELECT
  // ===================================================================
  
  static async getActiveCustomersForSelect() {
    try {
      const sql = `
        SELECT 
          c.id, 
          CASE 
            WHEN c.customer_type = 'business' AND c.company_name IS NOT NULL 
            THEN c.company_name 
            ELSE CONCAT(c.first_name, ' ', c.last_name) 
          END as display_name,
          c.customer_type,
          c.email,
          c.phone
        FROM customers c
        WHERE c.status = 'active' AND c.deleted_at IS NULL
        ORDER BY display_name
      `;

      return await query(sql);
    } catch (error) {
      logger.error('Error obteniendo clientes activos:', error);
      throw new DatabaseError('Error al obtener clientes activos');
    }
  }

  // ===================================================================
  // CREAR CLIENTE RÁPIDO DESDE POS
  // ===================================================================
  
  static async createQuickCustomer(customerData, createdBy) {
    try {
      logger.info('Creando cliente rápido desde POS', { 
        name: customerData.name,
        phone: customerData.phone 
      });

      // Dividir nombre completo en nombre y apellido
      const nameParts = customerData.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      const quickCustomerData = {
        first_name: firstName,
        last_name: lastName || 'N/A',
        phone: customerData.phone || null,
        email: customerData.email || null,
        customer_type: 'individual',
        status: 'active',
        created_by: createdBy
      };

      return await this.createCustomer(quickCustomerData);
    } catch (error) {
      logger.error('Error creando cliente rápido:', error);
      throw error;
    }
  }

  // ===================================================================
  // OBTENER RESUMEN DEL CLIENTE
  // ===================================================================
  
  static async getCustomerSummary(customerId) {
    try {
      logger.info('Obteniendo resumen del cliente', { customerId });

      const customer = await CustomerModel.findById(customerId, {
        includeSalesStats: true,
        includeLastSale: true
      });

      if (!customer) {
        throw new ValidationError('Cliente no encontrado');
      }

      // Obtener productos favoritos
      const favoriteProducts = await this.getCustomerFavoriteProducts(customerId, 3);

      // Obtener estado de crédito si aplica
      let creditInfo = null;
      if (customer.credit_limit > 0) {
        creditInfo = await this.validateCreditLimit(customerId, 0);
      }

      const summary = {
        customer: {
          id: customer.id,
          full_name: customer.full_name,
          display_name: customer.display_name,
          email: customer.email,
          phone: customer.phone,
          customer_type: customer.customer_type,
          status: customer.status,
          created_at: customer.created_at
        },
        sales_stats: customer.sales_stats,
        last_sale: customer.last_sale,
        favorite_products: favoriteProducts,
        credit_info: creditInfo
      };

      logger.info('Resumen del cliente obtenido exitosamente', { customerId });

      return summary;
    } catch (error) {
      logger.error('Error obteniendo resumen del cliente:', error);
      throw new DatabaseError('Error al obtener resumen del cliente');
    }
  }
}

// ===================================================================
// EXPORTAR SERVICIO
// ===================================================================

module.exports = CustomerService;