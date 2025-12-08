const express = require('express');
const router = express.Router();
const cargoDescargoController = require('../controllers/cargo-descargo.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * @route GET /api/cargo-descargo
 * @desc Obtener todos los documentos de cargo/descargo
 * @access Private
 */
router.get('/', cargoDescargoController.getAllDocuments);

/**
 * @route GET /api/cargo-descargo/summary
 * @desc Obtener resumen por almacén
 * @access Private
 */
router.get('/summary', cargoDescargoController.getSummaryByWarehouse);

/**
 * @route GET /api/cargo-descargo/:id
 * @desc Obtener documento por ID
 * @access Private
 */
router.get('/:id', cargoDescargoController.getDocumentById);

/**
 * @route POST /api/cargo-descargo
 * @desc Crear nuevo documento
 * @access Private
 */
router.post('/', cargoDescargoController.createDocument);

/**
 * @route PUT /api/cargo-descargo/:id
 * @desc Actualizar documento
 * @access Private
 */
router.put('/:id', cargoDescargoController.updateDocument);

/**
 * @route POST /api/cargo-descargo/:id/process
 * @desc Procesar documento (BORRADOR -> PROCESADO)
 * @access Private
 */
router.post('/:id/process', cargoDescargoController.processDocument);

/**
 * @route POST /api/cargo-descargo/:id/cancel
 * @desc Cancelar documento
 * @access Private
 */
router.post('/:id/cancel', cargoDescargoController.cancelDocument);

/**
 * @route DELETE /api/cargo-descargo/:id
 * @desc Eliminar documento
 * @access Private
 */
router.delete('/:id', cargoDescargoController.deleteDocument);

module.exports = router;
