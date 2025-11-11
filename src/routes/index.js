// ===================================================================
// PROSPERPOS - ARCHIVO PRINCIPAL DE RUTAS
// ===================================================================

const express = require('express');
const router = express.Router();

// ===================================================================
// IMPORTAR RUTAS
// ===================================================================

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const customerRoutes = require('./customer.routes');
const supplierRoutes = require('./supplier.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const subcategoryRoutes = require('./subcategory.routes');
const brandRoutes = require('./brand.routes');
const unitRoutes = require('./unit.routes');
const posRoutes = require('./pos.routes');
const permissionRoutes = require('./permission.routes');
const rolesRoutes = require('./role.routes');
const taxRateRoutes = require('./taxRate.routes');
const currencyRoutes = require('./currency.routes');
const bankAccountRoutes = require('./bankAccount.routes');
const warehouseRoutes = require('./warehouse.routes');
const countryRoutes = require('./country.routes');
const stateRoutes = require('./state.routes');
const cityRoutes = require('./city.routes');
const branchRoutes = require('./branch.routes');
const vehicleRoutes = require('./vehicle.routes');
const departmentRoutes = require('./department.routes');
const positionRoutes = require('./position.routes');
const employeeRoutes = require('./employee.routes');
const beneficiaryTypeRoutes = require('./beneficiary-type.routes');
const couponRoutes = require('./coupon.routes');
const resolutionRoutes = require('./resolution.routes');


// ===================================================================
// REGISTRAR RUTAS
// ===================================================================

router.use('/v1/auth', authRoutes);
router.use('/v1/users', userRoutes);
router.use('/v1/roles', rolesRoutes);
router.use('/v1/permissions', permissionRoutes);
router.use('/v1/customers', customerRoutes);
router.use('/v1/suppliers', supplierRoutes);
router.use('/v1/products', productRoutes);
router.use('/v1/categories', categoryRoutes);
router.use('/v1/subcategories', subcategoryRoutes);
router.use('/v1/brands', brandRoutes);
router.use('/v1/units', unitRoutes);
router.use('/v1/tax-rates', taxRateRoutes);
router.use('/v1/currencies', currencyRoutes);
router.use('/v1/bank-accounts', bankAccountRoutes);
router.use('/v1/warehouses', warehouseRoutes);
router.use('/v1/countries', countryRoutes);
router.use('/v1/states', stateRoutes);
router.use('/v1/cities', cityRoutes);
router.use('/v1/branches', branchRoutes);
router.use('/v1/vehicles', vehicleRoutes);
router.use('/v1/departments', departmentRoutes);
router.use('/v1/positions', positionRoutes);
router.use('/v1/employees', employeeRoutes);
router.use('/v1/beneficiary-types', beneficiaryTypeRoutes);
router.use('/v1/coupons', couponRoutes);
router.use('/v1/resolutions', resolutionRoutes);
router.use('/v1/pos', posRoutes);

// ===================================================================
// RUTAS FUTURAS (Comentadas)
// ===================================================================

// router.use('/v1/sales', salesRoutes);
// router.use('/v1/purchases', purchaseRoutes);
// router.use('/v1/reports', reportRoutes);
// router.use('/v1/settings', settingsRoutes);

// ===================================================================
// HEALTH CHECK
// ===================================================================

router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'ProsperPOS API',
    uptime: process.uptime()
  });
});

// ===================================================================
// RUTA RAÍZ - INFORMACIÓN DE LA API
// ===================================================================

router.get('/', (req, res) => {
  res.json({
    message: 'ProsperPOS API v1.0',
    documentation: '/api/docs',
    health: '/api/health',
    version: '1.0.0',
    availableEndpoints: [
      '/api/v1/auth',
      '/api/v1/users',
      '/api/v1/customers',
      '/api/v1/suppliers',
      '/api/v1/products',
      '/api/v1/inventory',
      '/api/v1/categories',
      '/api/v1/subcategories',
      '/api/v1/brands',
      '/api/v1/units',
      '/api/v1/tax-rates',
      '/api/v1/currencies',
      '/api/v1/bank-accounts',
      '/api/v1/warehouses',
      '/api/v1/countries',
      '/api/v1/states',
      '/api/v1/cities',
      '/api/v1/branches',
      '/api/v1/vehicles',
      '/api/v1/departments',
      '/api/v1/positions',
      '/api/v1/employees',
      '/api/v1/beneficiary-types',
      '/api/v1/resolutions',
      '/api/v1/pos'
    ],
    comingSoon: [
      '/api/v1/sales',
      '/api/v1/purchases', 
      '/api/v1/reports',
      '/api/v1/settings'
    ]
  });
});

module.exports = router;