// ===================================================================
// PROSPERPOS - RUTAS UNIFICADAS DE PRODUCTOS E INVENTARIO
// ===================================================================

const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/product.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');
const { validateProductCreation, validateProductUpdate, validateStockAdjustment } = require('../middleware/validation.middleware');
const upload = require('../middleware/upload.middleware');

// Middleware global
router.use(authenticateToken);

// ===================================================================
// RUTAS DE PRODUCTOS
// ===================================================================

/**
 * @route   GET /api/v1/products
 * @desc    Obtener lista de productos con filtros y paginación
 * @access  Private (products.read)
 */
router.get('/', 
  requirePermission('products.read'),
  ProductController.getProducts
);

/**
 * @route   GET /api/v1/products/summary
 * @desc    Obtener resumen de inventario
 * @access  Private (inventory.read)
 */
router.get('/summary',
  requirePermission('inventory.read'),
  ProductController.getInventorySummary
);

/**
 * @route   GET /api/v1/products/low-stock
 * @desc    Obtener productos con stock bajo
 * @access  Private (inventory.read)
 */
router.get('/low-stock',
  requirePermission('inventory.read'),
  ProductController.getLowStockProducts
);

/**
 * @route   GET /api/v1/products/search/all
 * @desc    Buscar todos los productos sin paginación (para búsquedas)
 * @access  Private (products.read)
 */
router.get('/search/all',
  requirePermission('products.read'),
  ProductController.getAllProductsForSearch
);

/**
 * @route   GET /api/v1/products/generate-code
 * @desc    Generar código de producto
 * @access  Private (products.create)
 */
router.get('/generate-code',
  requirePermission('products.create'),
  ProductController.generateProductCode
);

/**
 * @route   GET /api/v1/products/barcode/:barcode
 * @desc    Buscar producto por código de barras
 * @access  Private (products.read)
 */
router.get('/barcode/:barcode',
  requirePermission('products.read'),
  ProductController.getProductByBarcode
);

/**
 * @route   GET /api/v1/products/:id/gallery
 * @desc    Obtener imágenes de galería del producto
 * @access  Private (products.read)
 */
router.get('/:id/gallery',
  requirePermission('products.read'),
  ProductController.getProductGallery
);

/**
 * @route   DELETE /api/v1/products/:id/gallery/:imageId
 * @desc    Eliminar imagen de galería del producto
 * @access  Private (products.update)
 */
router.delete('/:id/gallery/:imageId',
  requirePermission('products.update'),
  ProductController.deleteGalleryImage
);

/**
 * @route   GET /api/v1/products/:id
 * @desc    Obtener producto por ID
 * @access  Private (products.read)
 */
router.get('/:id',
  requirePermission('products.read'),
  ProductController.getProduct
);

/**
 * @route   POST /api/v1/products
 * @desc    Crear nuevo producto
 * @access  Private (products.create)
 */
router.post('/',
  requirePermission('products.create'),
  validateProductCreation,
  ProductController.createProduct
);

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Actualizar producto
 * @access  Private (products.update)
 */
router.put('/:id',
  requirePermission('products.update'),
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'gallery_0', maxCount: 1 },
    { name: 'gallery_1', maxCount: 1 },
    { name: 'gallery_2', maxCount: 1 },
    { name: 'gallery_3', maxCount: 1 },
    { name: 'gallery_4', maxCount: 1 }
  ]),
  validateProductUpdate,
  ProductController.updateProduct
);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Eliminar producto (soft delete)
 * @access  Private (products.delete)
 */
router.delete('/:id',
  requirePermission('products.delete'),
  ProductController.deleteProduct
);

/**
 * @route   PATCH /api/v1/products/:id/featured
 * @desc    Marcar/desmarcar producto como destacado
 * @access  Private (products.update)
 */
router.patch('/:id/featured',
  requirePermission('products.update'),
  ProductController.toggleFeatured
);

// ===================================================================
// RUTAS DE INVENTARIO (STOCK)
// ===================================================================

/**
 * @route   GET /api/v1/products/stock/current
 * @desc    Obtener stock actual de productos
 * @access  Private (inventory.read)
 */
router.get('/stock/current',
  requirePermission('inventory.read'),
  ProductController.getStock
);

/**
 * @route   GET /api/v1/products/stock/check
 * @desc    Verificar disponibilidad de stock
 * @access  Private (inventory.read)
 */
router.get('/stock/check',
  requirePermission('inventory.read'),
  ProductController.checkStock
);

/**
 * @route   POST /api/v1/products/stock/validate
 * @desc    Validar stock para múltiples productos (ventas)
 * @access  Private (inventory.read)
 */
router.post('/stock/validate',
  requirePermission('inventory.read'),
  ProductController.validateStockForSale
);

/**
 * @route   POST /api/v1/products/stock/adjust
 * @desc    Ajustar stock de producto
 * @access  Private (inventory.adjust)
 */
router.post('/stock/adjust',
  requirePermission('inventory.adjust'),
  validateStockAdjustment,
  ProductController.adjustStock
);

/**
 * @route   POST /api/v1/products/stock/transfer
 * @desc    Transferir stock entre almacenes
 * @access  Private (inventory.transfer)
 */
router.post('/stock/transfer',
  requirePermission('inventory.transfer'),
  ProductController.transferStock
);

// ===================================================================
// RUTAS DE REPORTES
// ===================================================================

/**
 * @route   GET /api/v1/products/reports/movements
 * @desc    Reporte de movimientos de inventario
 * @access  Private (reports.inventory)
 */
router.get('/reports/movements',
  requirePermission('reports.inventory'),
  ProductController.getMovementsReport
);

/**
 * @route   GET /api/v1/products/reports/valuation
 * @desc    Reporte de valorización de inventario
 * @access  Private (reports.inventory)
 */
router.get('/reports/valuation',
  requirePermission('reports.inventory'),
  ProductController.getValuationReport
);

/**
 * @route   GET /api/v1/products/reports/critical-stock
 * @desc    Reporte de productos con stock crítico
 * @access  Private (reports.inventory)
 */
router.get('/reports/critical-stock',
  requirePermission('reports.inventory'),
  ProductController.getCriticalStockReport
);

module.exports = router;