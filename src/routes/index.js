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
const billingRoutes = require('./billing.routes');
const invoicesSalesRoutes = require('./invoices-sales.routes');
const sellerReportRoutes = require('./seller-report.routes');
const shipmentRoutes = require('./shipment.routes');
const salesReturnsRoutes = require('./sales-returns.routes');
const pendingInvoicesRoutes = require('./pending-invoices.routes');
const quotesRoutes = require('./quotes.routes');
const purchaseRoutes = require('./purchase.routes');
const purchaseReturnRoutes = require('./purchase-return.routes');
const offerRoutes = require('./offer.routes');
const consecutiveRoutes = require('./consecutive.routes');
const accountStatementRoutes = require('./account-statement.routes');
const dashboardRoutes = require('./dashboard.routes');
const cargoDescargoRoutes = require('./cargo-descargo.routes');
const salesBookRoutes = require('./sales-book.routes');
const purchaseBookRoutes = require('./purchase-book.routes');
const reprintRoutes = require('./reprint.routes');
const purchaseReprintRoutes = require('./purchase-reprint.routes');
const profitLossRoutes = require('./profit-loss.routes');
const supplierReportRoutes = require('./supplier-report.routes');
const purchaseStatementRoutes = require('./purchase-statement.routes');
const ecommerceRoutes = require('./ecommerce.routes');
const soldItemsRoutes = require('./sold-items.routes');
const physicalInventoryRoutes = require('./physical-inventory.routes');
const inventoryAdjustmentRoutes = require('./inventory-adjustment.routes');
const uploadRoutes = require('./upload.routes');
const stockHistoryRoutes = require('./stock-history.routes');
const barcodeRoutes = require('./barcode.routes');
const bannerRoutes = require('./banner.routes');


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
router.use('/v1/billing', billingRoutes);
router.use('/v1/invoices-sales', invoicesSalesRoutes);
router.use('/v1/reports', sellerReportRoutes);
router.use('/v1/shipments', shipmentRoutes);
router.use('/v1/sales-returns', salesReturnsRoutes);
router.use('/v1/pending-invoices', pendingInvoicesRoutes);
router.use('/v1/quotes', quotesRoutes);
router.use('/v1/purchases', purchaseRoutes);
router.use('/v1/purchase-returns', purchaseReturnRoutes);
router.use('/v1/offers', offerRoutes);
router.use('/v1/consecutives', consecutiveRoutes);
router.use('/v1/account-statement', accountStatementRoutes);
router.use('/v1/dashboard', dashboardRoutes);
router.use('/v1/cargo-descargo', cargoDescargoRoutes);
router.use('/v1/sales-book', salesBookRoutes);
router.use('/v1/purchase-book', purchaseBookRoutes);
router.use('/v1/reprint', reprintRoutes);
router.use('/v1/purchase-reprint', purchaseReprintRoutes);
router.use('/v1/profit-loss', profitLossRoutes);
router.use('/v1/supplier-reports', supplierReportRoutes);
router.use('/v1/purchase-statement', purchaseStatementRoutes);
router.use('/v1/ecommerce', ecommerceRoutes);
router.use('/v1/sold-items', soldItemsRoutes);
router.use('/v1/physical-inventory', physicalInventoryRoutes);
router.use('/v1/inventory-adjustments', inventoryAdjustmentRoutes);
router.use('/v1/upload', uploadRoutes);
router.use('/v1/stock-history', stockHistoryRoutes);
router.use('/v1/barcodes', barcodeRoutes);
router.use('/v1/banners', bannerRoutes);

// ===================================================================
// RUTAS FUTURAS (Comentadas)
// ===================================================================

// router.use('/v1/sales', salesRoutes);
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
      '/api/v1/pos',
      '/api/v1/billing',
      '/api/v1/shipments',
      '/api/v1/offers',
      '/api/v1/sales-book - Libro de Ventas',
      '/api/v1/purchase-book - Libro de Compras',
      '/api/v1/profit-loss - Reporte de Pérdidas y Ganancias',
      '/api/v1/supplier-reports - Reportes de Proveedores',
      '/api/v1/invoices-sales',
      '/api/v1/sales-returns',
      '/api/v1/purchase-returns',
      '/api/v1/quotes',
      '/api/v1/pending-invoices',
      '/api/v1/account-statement',
      '/api/v1/dashboard',
      '/api/v1/cargo-descargo',
      '/api/v1/sold-items - Productos Vendidos',
      '/api/v1/physical-inventory - Lista de Inventario Físico'
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