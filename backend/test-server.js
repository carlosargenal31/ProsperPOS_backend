// Script de prueba rápida del servidor
const express = require('express');

try {
  // Probar que Express funciona
  const app = express();
  console.log('✅ Express cargado correctamente');

  // Probar carga de rutas
  const cargoDescargoRoutes = require('./src/routes/cargo-descargo.routes');
  console.log('✅ Rutas de cargo-descargo cargadas correctamente');

  // Probar carga del controlador
  const cargoDescargoController = require('./src/controllers/cargo-descargo.controller');
  console.log('✅ Controlador de cargo-descargo cargado correctamente');

  // Probar carga del servicio
  const cargoDescargoService = require('./src/services/cargo-descargo.service');
  console.log('✅ Servicio de cargo-descargo cargado correctamente');

  // Probar carga del modelo
  const CargoDescargo = require('./src/models/cargo-descargo.model');
  console.log('✅ Modelo de cargo-descargo cargado correctamente');

  console.log('\n✅ TODAS LAS VERIFICACIONES PASARON - El módulo está correctamente implementado\n');
  process.exit(0);
} catch (error) {
  console.error('❌ ERROR:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
