// ===================================================================
// PROSPERPOS - RUTAS DE E-COMMERCE
// ===================================================================

const express = require('express');
const router = express.Router();

// Controllers
const EcommerceAuthController = require('../controllers/ecommerce-auth.controller');
const EcommerceProductsController = require('../controllers/ecommerce-products.controller');
const EcommerceCartController = require('../controllers/ecommerce-cart.controller');
const EcommerceOrdersController = require('../controllers/ecommerce-orders.controller');
const EcommerceCustomersController = require('../controllers/ecommerce-customers.controller');
const CustomerAddressesController = require('../controllers/customer-addresses.controller');
const BillingInfoController = require('../controllers/billing-info.controller');
const FavoritesController = require('../controllers/favorites.controller');

// Middleware
const { verifyCustomerToken, optionalCustomerAuth } = require('../middleware/ecommerce-auth.middleware');

// ===================================================================
// RUTAS PÚBLICAS (Sin autenticación)
// ===================================================================

// Autenticación
router.post('/auth/register', EcommerceAuthController.register);
router.post('/auth/login', EcommerceAuthController.login);

// Registro de clientes (nueva tabla ecommerce_customers)
router.post('/customers/register', EcommerceCustomersController.register);
router.post('/customers/login', EcommerceCustomersController.login);

// Productos
router.get('/products/catalog', EcommerceProductsController.getCatalog);
router.get('/products/featured', EcommerceProductsController.getFeaturedProducts);
router.get('/products/search', EcommerceProductsController.search);
router.get('/products', EcommerceProductsController.getCatalog); // Para búsqueda autocompletada
router.get('/products/:id', EcommerceProductsController.getProductDetails);

// Búsqueda y sugerencias
router.get('/search-suggestions', EcommerceProductsController.getSearchSuggestions);

// Categorías, Subcategorías y Marcas
router.get('/categories', EcommerceProductsController.getCategories);
router.get('/subcategories', EcommerceProductsController.getSubcategories);
router.get('/brands', EcommerceProductsController.getBrands);

// ===================================================================
// RUTAS PROTEGIDAS (Requieren autenticación)
// ===================================================================

// Perfil de cliente
router.get('/auth/profile', verifyCustomerToken, EcommerceAuthController.getProfile);
router.put('/auth/profile', verifyCustomerToken, EcommerceAuthController.updateProfile);
router.put('/auth/change-password', verifyCustomerToken, EcommerceAuthController.changePassword);

// Perfil de clientes (nueva tabla ecommerce_customers)
router.get('/customers/profile', verifyCustomerToken, EcommerceCustomersController.getProfile);
router.put('/customers/profile', verifyCustomerToken, EcommerceCustomersController.updateProfile);
router.put('/customers/change-password', verifyCustomerToken, EcommerceCustomersController.changePassword);

// Direcciones de clientes
router.get('/customers/addresses', verifyCustomerToken, CustomerAddressesController.getAddresses);
router.post('/customers/addresses', verifyCustomerToken, CustomerAddressesController.createAddress);
router.put('/customers/addresses/:id', verifyCustomerToken, CustomerAddressesController.updateAddress);
router.delete('/customers/addresses/:id', verifyCustomerToken, CustomerAddressesController.deleteAddress);
router.put('/customers/addresses/:id/set-default', verifyCustomerToken, CustomerAddressesController.setDefaultAddress);

// Información de facturación (RTN)
router.get('/customers/billing-info', verifyCustomerToken, BillingInfoController.getBillingInfo);
router.post('/customers/billing-info', verifyCustomerToken, BillingInfoController.createBillingInfo);
router.put('/customers/billing-info/:id', verifyCustomerToken, BillingInfoController.updateBillingInfo);
router.delete('/customers/billing-info/:id', verifyCustomerToken, BillingInfoController.deleteBillingInfo);
router.put('/customers/billing-info/:id/set-default', verifyCustomerToken, BillingInfoController.setDefaultBillingInfo);

// Favoritos
router.get('/favorites', verifyCustomerToken, FavoritesController.getFavorites);
router.post('/favorites', verifyCustomerToken, FavoritesController.addFavorite);
router.delete('/favorites/:product_id', verifyCustomerToken, FavoritesController.removeFavorite);
router.get('/favorites/check/:product_id', verifyCustomerToken, FavoritesController.isFavorite);

// Carrito de compras
router.get('/cart', verifyCustomerToken, EcommerceCartController.getCart);
router.post('/cart/add', verifyCustomerToken, EcommerceCartController.addItem);
router.put('/cart/item/:product_id', verifyCustomerToken, EcommerceCartController.updateQuantity);
router.delete('/cart/item/:product_id', verifyCustomerToken, EcommerceCartController.removeItem);
router.delete('/cart/clear', verifyCustomerToken, EcommerceCartController.clearCart);
router.get('/cart/count', verifyCustomerToken, EcommerceCartController.getItemCount);

// Pedidos
router.post('/orders', verifyCustomerToken, EcommerceOrdersController.createOrder);
router.get('/orders', verifyCustomerToken, EcommerceOrdersController.getMyOrders);
router.get('/orders/:order_number', verifyCustomerToken, EcommerceOrdersController.getOrderByNumber);
router.post('/orders/:order_number/cancel', verifyCustomerToken, EcommerceOrdersController.cancelOrder);
router.get('/orders/:order_number/whatsapp', verifyCustomerToken, EcommerceOrdersController.getWhatsAppUrl);

module.exports = router;
