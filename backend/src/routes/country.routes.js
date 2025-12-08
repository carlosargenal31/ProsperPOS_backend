// ===================================================================
// PROSPERPOS - RUTAS DE PAÍSES
// ===================================================================

const express = require('express');
const router = express.Router();
const CountryController = require('../controllers/country.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Rutas de países
router.get('/', requirePermission('countries.read'), CountryController.getCountries);
router.get('/active', requirePermission('countries.read'), CountryController.getActiveCountries);
router.get('/:id', requirePermission('countries.read'), CountryController.getCountry);
router.post('/', requirePermission('countries.create'), CountryController.createCountry);
router.put('/:id', requirePermission('countries.update'), CountryController.updateCountry);
router.delete('/:id', requirePermission('countries.delete'), CountryController.deleteCountry);

module.exports = router;
