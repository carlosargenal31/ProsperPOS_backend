// ===================================================================
// PROSPERPOS - RUTAS DE CIUDADES/MUNICIPIOS
// ===================================================================

const express = require('express');
const router = express.Router();
const CityController = require('../controllers/city.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Rutas de ciudades
router.get('/', requirePermission('cities.read'), CityController.getCities);
router.get('/active', requirePermission('cities.read'), CityController.getActiveCities);
router.get('/:id', requirePermission('cities.read'), CityController.getCity);
router.post('/', requirePermission('cities.create'), CityController.createCity);
router.put('/:id', requirePermission('cities.update'), CityController.updateCity);
router.delete('/:id', requirePermission('cities.delete'), CityController.deleteCity);

module.exports = router;
