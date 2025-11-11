// ===================================================================
// PROSPERPOS - CONTROLADOR DE CLIENTES
// ===================================================================

const customerService = require('../services/customer.service');
const { createResponse } = require('../utils/response');
const { catchAsync, ValidationError, NotFoundError, AuthorizationError } = require('../middleware/error.middleware');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

// ===================================================================
// LISTAR CLIENTES
// ===================================================================

const getCustomers = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    customerType = '',
    status = '',
    city = '',
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = req.query;

  logger.info('Listando clientes', {
    userId: req.user.id,
    filters: { search, customerType, status, city },
    pagination: { page, limit }
  });

  const result = await customerService.getCustomers({
    page: parseInt(page),
    limit: parseInt(limit),
    search,
    customerType,
    status,
    city,
    sortBy,
    sortOrder
  });

  res.json(createResponse(
    true,
    'Clientes obtenidos correctamente',
    result.data,
    {
      pagination: result.pagination,
      filters: { search, customerType, status, city }
    }
  ));
});

// ===================================================================
// OBTENER CLIENTE POR ID
// ===================================================================

const getCustomerById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const includeSalesStats = req.query.include_sales_stats === 'true';
  const includeLastSale = req.query.include_last_sale === 'true';
  const includePaymentHistory = req.query.include_payment_history === 'true';

  logger.info('Obteniendo cliente por ID', {
    userId: req.user.id,
    customerId: id,
    includes: { salesStats: includeSalesStats, lastSale: includeLastSale, paymentHistory: includePaymentHistory }
  });

  const customer = await customerService.getCustomerById(id, {
    includeSalesStats,
    includeLastSale,
    includePaymentHistory
  });

  if (!customer) {
    throw new NotFoundError('Cliente no encontrado');
  }

  res.json(createResponse(
    true,
    'Cliente obtenido correctamente',
    customer
  ));
});

// ===================================================================
// CREAR CLIENTE
// ===================================================================

const createCustomer = catchAsync(async (req, res) => {
  // Validar datos de entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Datos de entrada inválidos', errors.array());
  }

  const customerData = {
    ...req.body,
    created_by: req.user.id
  };

  logger.info('Creando nuevo cliente', {
    userId: req.user.id,
    customerName: `${customerData.first_name} ${customerData.last_name}`,
    customerType: customerData.customer_type
  });

  const newCustomer = await customerService.createCustomer(customerData);

  logger.info('Cliente creado exitosamente', {
    userId: req.user.id,
    customerId: newCustomer.id,
    customerName: newCustomer.full_name
  });

  res.status(201).json(createResponse(
    true,
    'Cliente creado correctamente',
    newCustomer
  ));
});

// ===================================================================
// CREAR CLIENTE RÁPIDO (PARA POS)
// ===================================================================

const createQuickCustomer = catchAsync(async (req, res) => {
  const { name, phone, email } = req.body;

  if (!name || name.trim().length < 2) {
    throw new ValidationError('El nombre es requerido y debe tener al menos 2 caracteres');
  }

  logger.info('Creando cliente rápido desde POS', {
    userId: req.user.id,
    customerName: name,
    phone
  });

  const newCustomer = await customerService.createQuickCustomer({
    name: name.trim(),
    phone,
    email
  }, req.user.id);

  logger.info('Cliente rápido creado exitosamente', {
    userId: req.user.id,
    customerId: newCustomer.id,
    customerName: newCustomer.full_name
  });

  res.status(201).json(createResponse(
    true,
    'Cliente creado correctamente',
    newCustomer
  ));
});

// ===================================================================
// ACTUALIZAR CLIENTE
// ===================================================================

const updateCustomer = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Validar datos de entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Datos de entrada inválidos', errors.array());
  }

  // Verificar que el cliente existe
  const existingCustomer = await customerService.getCustomerById(id);
  if (!existingCustomer) {
    throw new NotFoundError('Cliente no encontrado');
  }

  const updateData = {
    ...req.body,
    updated_by: req.user.id,
    updated_at: new Date()
  };

  logger.info('Actualizando cliente', {
    userId: req.user.id,
    customerId: id,
    fieldsToUpdate: Object.keys(updateData)
  });

  const updatedCustomer = await customerService.updateCustomer(id, updateData);

  logger.info('Cliente actualizado exitosamente', {
    userId: req.user.id,
    customerId: id
  });

  res.json(createResponse(
    true,
    'Cliente actualizado correctamente',
    updatedCustomer
  ));
});

// ===================================================================
// ELIMINAR CLIENTE (SOFT DELETE)
// ===================================================================

const deleteCustomer = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Verificar que el cliente existe
  const existingCustomer = await customerService.getCustomerById(id);
  if (!existingCustomer) {
    throw new NotFoundError('Cliente no encontrado');
  }

  logger.info('Eliminando cliente', {
    userId: req.user.id,
    customerId: id,
    customerName: existingCustomer.full_name
  });

  await customerService.deleteCustomer(id, req.user.id);

  logger.info('Cliente eliminado exitosamente', {
    userId: req.user.id,
    customerId: id
  });

  res.json(createResponse(
    true,
    'Cliente eliminado correctamente'
  ));
});

// ===================================================================
// CAMBIAR ESTADO DE CLIENTE
// ===================================================================

const changeCustomerStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'inactive', 'suspended'].includes(status)) {
    throw new ValidationError('Estado inválido. Use: active, inactive, suspended');
  }

  // Verificar que el cliente existe
  const existingCustomer = await customerService.getCustomerById(id);
  if (!existingCustomer) {
    throw new NotFoundError('Cliente no encontrado');
  }

  logger.info('Cambiando estado de cliente', {
    userId: req.user.id,
    customerId: id,
    oldStatus: existingCustomer.status,
    newStatus: status
  });

  await customerService.changeCustomerStatus(id, status, req.user.id);

  logger.info('Estado de cliente cambiado exitosamente', {
    userId: req.user.id,
    customerId: id,
    newStatus: status
  });

  res.json(createResponse(
    true,
    `Cliente ${status === 'active' ? 'activado' : status === 'inactive' ? 'desactivado' : 'suspendido'} correctamente`
  ));
});

// ===================================================================
// BÚSQUEDA RÁPIDA PARA POS
// ===================================================================

const searchCustomersForPOS = catchAsync(async (req, res) => {
  const { q: searchTerm, limit = 10 } = req.query;

  if (!searchTerm || searchTerm.length < 2) {
    return res.json(createResponse(
      true,
      'Búsqueda de clientes',
      []
    ));
  }

  logger.info('Búsqueda rápida de clientes para POS', {
    userId: req.user.id,
    searchTerm,
    limit
  });

  const customers = await customerService.searchCustomersForPOS(searchTerm, parseInt(limit));

  res.json(createResponse(
    true,
    'Clientes encontrados',
    customers
  ));
});

// ===================================================================
// OBTENER CLIENTES ACTIVOS PARA SELECT
// ===================================================================

const getActiveCustomers = catchAsync(async (req, res) => {
  logger.info('Obteniendo clientes activos para select', {
    userId: req.user.id
  });

  const customers = await customerService.getActiveCustomersForSelect();

  res.json(createResponse(
    true,
    'Clientes activos obtenidos',
    customers
  ));
});

// ===================================================================
// OBTENER ESTADÍSTICAS DE CLIENTES
// ===================================================================

const getCustomerStats = catchAsync(async (req, res) => {
  logger.info('Obteniendo estadísticas de clientes', {
    userId: req.user.id
  });

  const stats = await customerService.getCustomerStats();

  res.json(createResponse(
    true,
    'Estadísticas obtenidas correctamente',
    stats
  ));
});

// ===================================================================
// OBTENER HISTORIAL DE COMPRAS DEL CLIENTE
// ===================================================================

const getCustomerPurchaseHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const {
    page = 1,
    limit = 10,
    start_date: startDate,
    end_date: endDate
  } = req.query;

  logger.info('Obteniendo historial de compras del cliente', {
    userId: req.user.id,
    customerId: id,
    pagination: { page, limit },
    dateRange: { startDate, endDate }
  });

  const result = await customerService.getCustomerPurchaseHistory(id, {
    page: parseInt(page),
    limit: parseInt(limit),
    startDate,
    endDate
  });

  res.json(createResponse(
    true,
    'Historial de compras obtenido correctamente',
    result.data,
    {
      pagination: result.pagination,
      filters: { startDate, endDate }
    }
  ));
});

// ===================================================================
// OBTENER PRODUCTOS FAVORITOS DEL CLIENTE
// ===================================================================

const getCustomerFavoriteProducts = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { limit = 10 } = req.query;

  logger.info('Obteniendo productos favoritos del cliente', {
    userId: req.user.id,
    customerId: id,
    limit
  });

  const products = await customerService.getCustomerFavoriteProducts(id, parseInt(limit));

  res.json(createResponse(
    true,
    'Productos favoritos obtenidos correctamente',
    products
  ));
});

// ===================================================================
// VALIDAR LÍMITE DE CRÉDITO
// ===================================================================

const validateCreditLimit = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { sale_amount } = req.body;

  if (!sale_amount || sale_amount <= 0) {
    throw new ValidationError('El monto de la venta debe ser mayor a 0');
  }

  logger.info('Validando límite de crédito', {
    userId: req.user.id,
    customerId: id,
    saleAmount: sale_amount
  });

  const creditValidation = await customerService.validateCreditLimit(id, parseFloat(sale_amount));

  res.json(createResponse(
    true,
    creditValidation.allowed ? 'Límite de crédito válido' : 'Límite de crédito excedido',
    creditValidation
  ));
});

// ===================================================================
// OBTENER RESUMEN DEL CLIENTE
// ===================================================================

const getCustomerSummary = catchAsync(async (req, res) => {
  const { id } = req.params;

  logger.info('Obteniendo resumen del cliente', {
    userId: req.user.id,
    customerId: id
  });

  const summary = await customerService.getCustomerSummary(id);

  res.json(createResponse(
    true,
    'Resumen del cliente obtenido correctamente',
    summary
  ));
});

// ===================================================================
// EXPORTACIONES
// ===================================================================

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  createQuickCustomer,
  updateCustomer,
  deleteCustomer,
  changeCustomerStatus,
  searchCustomersForPOS,
  getActiveCustomers,
  getCustomerStats,
  getCustomerPurchaseHistory,
  getCustomerFavoriteProducts,
  validateCreditLimit,
  getCustomerSummary
};