// ===================================================================
// PROSPERPOS - RUTAS DE PEDIDOS EN LÍNEA (ADMINISTRATIVAS)
// ===================================================================

const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/order.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// =================================================================
// RUTAS ADMINISTRATIVAS (REQUIEREN AUTENTICACIÓN POS)
// =================================================================
// Nota: Las rutas del ecommerce están en ecommerce.routes.js

// Obtener todos los pedidos (con filtros)
router.get('/', authenticateToken, OrderController.getAllOrders);

// Obtener estadísticas de pedidos
router.get('/stats', authenticateToken, OrderController.getOrderStats);

// Exportar pedidos a Excel
router.get('/export/excel', authenticateToken, OrderController.exportToExcel);

// Exportar pedido individual a PDF
router.get('/:id/export/pdf', authenticateToken, OrderController.exportOrderToPDF);

// Obtener un pedido por ID
router.get('/:id', authenticateToken, OrderController.getOrderById);

// Crear pedido manualmente (desde el POS)
router.post('/', authenticateToken, OrderController.createOrder);

// Actualizar estado del pedido
router.patch('/:id/status', authenticateToken, OrderController.updateOrderStatus);

// Actualizar notas del pedido
router.patch('/:id/notes', authenticateToken, OrderController.updateOrderNotes);

// Convertir pedido a factura
router.post('/:id/convert-to-invoice', authenticateToken, OrderController.convertToInvoice);

// Eliminar pedido
router.delete('/:id', authenticateToken, OrderController.deleteOrder);

// Obtener pedidos de un cliente específico
router.get('/customer/:customer_id', authenticateToken, OrderController.getOrdersByCustomer);

module.exports = router;
