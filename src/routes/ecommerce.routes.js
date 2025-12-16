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

// Middleware
const { verifyCustomerToken, optionalCustomerAuth } = require('../middleware/ecommerce-auth.middleware');

// ===================================================================
// RUTAS PÚBLICAS (Sin autenticación)
// ===================================================================

// Autenticación
router.post('/auth/register', EcommerceAuthController.register);
router.post('/auth/login', EcommerceAuthController.login);

// Productos
router.get('/products/catalog', EcommerceProductsController.getCatalog);
router.get('/products/featured', EcommerceProductsController.getFeaturedProducts);
router.get('/products/search', EcommerceProductsController.search);
router.get('/products/:id', EcommerceProductsController.getProductDetails);

// Categorías y Marcas
router.get('/categories', EcommerceProductsController.getCategories);
router.get('/brands', EcommerceProductsController.getBrands);

// ===================================================================
// RUTAS PROTEGIDAS (Requieren autenticación)
// ===================================================================

// Perfil de cliente
router.get('/auth/profile', verifyCustomerToken, EcommerceAuthController.getProfile);
router.put('/auth/profile', verifyCustomerToken, EcommerceAuthController.updateProfile);
router.put('/auth/change-password', verifyCustomerToken, EcommerceAuthController.changePassword);

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
