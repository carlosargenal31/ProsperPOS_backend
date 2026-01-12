const express = require('express');
const router = express.Router();
const billingInfoController = require('../controllers/billing-info.controller');
const { verifyEcommerceToken } = require('../middleware/ecommerce-auth.middleware');

// Todas las rutas requieren autenticación
router.use(verifyEcommerceToken);

// Obtener toda la información de facturación del cliente
router.get('/', billingInfoController.getBillingInfo);

// Crear nueva información de facturación
router.post('/', billingInfoController.createBillingInfo);

// Actualizar información de facturación
router.put('/:id', billingInfoController.updateBillingInfo);

// Eliminar información de facturación
router.delete('/:id', billingInfoController.deleteBillingInfo);

// Establecer información de facturación como predeterminada
router.put('/:id/set-default', billingInfoController.setDefaultBillingInfo);

module.exports = router;
