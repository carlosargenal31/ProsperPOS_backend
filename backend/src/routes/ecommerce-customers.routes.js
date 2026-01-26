const express = require('express');
const router = express.Router();
const customersController = require('../controllers/ecommerce-customers.controller');

// Rutas públicas (sin autenticación)
router.post('/register', customersController.register);
router.post('/login', customersController.login);

// Rutas protegidas (requieren autenticación)
// TODO: Agregar middleware de autenticación
// router.get('/profile', authMiddleware, customersController.getProfile);
// router.put('/profile', authMiddleware, customersController.updateProfile);

module.exports = router;
