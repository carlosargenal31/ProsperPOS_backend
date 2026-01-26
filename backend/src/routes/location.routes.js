const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');

/**
 * Rutas públicas para departamentos y municipios
 */

// GET /api/v1/locations/states - Obtener todos los departamentos
router.get('/states', locationController.getStates);

// GET /api/v1/locations/cities/:stateId - Obtener municipios por departamento
router.get('/cities/:stateId', locationController.getCitiesByState);

// GET /api/v1/locations/cities - Obtener todos los municipios
router.get('/cities', locationController.getAllCities);

module.exports = router;
