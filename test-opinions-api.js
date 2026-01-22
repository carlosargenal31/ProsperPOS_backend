// ===================================================================
// PROSPERPOS - TEST DEL API DE OPINIONES
// ===================================================================

const axios = require('axios');

const API_URL = 'http://localhost:3001/api/v1';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testCreateOpinion() {
  try {
    log('\n📝 TEST 1: Crear nueva opinión (endpoint público)...', 'blue');

    const response = await axios.post(`${API_URL}/opinions`, {
      name: 'Carlos',
      lastname: 'Argañal',
      email: 'carlos@example.com',
      inquiry_type: 'Seguimiento con Asesor',
      message: 'Necesito información sobre el estado de mi pedido #1234. ¿Cuándo llegará?'
    });

    if (response.data.success) {
      log('✅ Opinión creada exitosamente', 'green');
      log(`   ID: ${response.data.data.id}`, 'green');
      log(`   Estado: ${response.data.data.status}`, 'green');
      return response.data.data.id;
    } else {
      log('❌ Error: ' + response.data.message, 'red');
      return null;
    }
  } catch (error) {
    log('❌ Error en la solicitud: ' + error.message, 'red');
    if (error.response) {
      log('   Respuesta del servidor: ' + JSON.stringify(error.response.data), 'red');
    }
    return null;
  }
}

async function testGetOpinions(token) {
  try {
    log('\n📋 TEST 2: Obtener todas las opiniones (requiere autenticación)...', 'blue');

    if (!token) {
      log('⚠️  No hay token de autenticación. Saltando test...', 'yellow');
      return;
    }

    const response = await axios.get(`${API_URL}/opinions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      log('✅ Opiniones obtenidas exitosamente', 'green');
      log(`   Total: ${response.data.pagination.total}`, 'green');
      log(`   Página: ${response.data.pagination.page} de ${response.data.pagination.pages}`, 'green');
    } else {
      log('❌ Error: ' + response.data.message, 'red');
    }
  } catch (error) {
    log('❌ Error en la solicitud: ' + error.message, 'red');
    if (error.response) {
      log('   Respuesta del servidor: ' + JSON.stringify(error.response.data), 'red');
    }
  }
}

async function testGetStats(token) {
  try {
    log('\n📊 TEST 3: Obtener estadísticas (requiere autenticación)...', 'blue');

    if (!token) {
      log('⚠️  No hay token de autenticación. Saltando test...', 'yellow');
      return;
    }

    const response = await axios.get(`${API_URL}/opinions/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      log('✅ Estadísticas obtenidas exitosamente', 'green');
      log(`   Total: ${response.data.data.summary.total}`, 'green');
      log(`   Pendientes: ${response.data.data.summary.pendientes}`, 'green');
      log(`   Respondidas: ${response.data.data.summary.respondidas}`, 'green');
    } else {
      log('❌ Error: ' + response.data.message, 'red');
    }
  } catch (error) {
    log('❌ Error en la solicitud: ' + error.message, 'red');
    if (error.response) {
      log('   Respuesta del servidor: ' + JSON.stringify(error.response.data), 'red');
    }
  }
}

async function runTests() {
  log('='.repeat(60), 'bright');
  log('PRUEBA DEL API DE OPINIONES DE CLIENTES', 'bright');
  log('='.repeat(60), 'bright');

  log('\n⚠️  NOTA:', 'yellow');
  log('  - El TEST 1 (crear opinión) es público y no requiere autenticación', 'yellow');
  log('  - Los TEST 2 y 3 requieren autenticación de administrador', 'yellow');
  log('  - Para probar los endpoints privados, necesitas proporcionar un token', 'yellow');

  // Test 1: Crear opinión (público)
  const opinionId = await testCreateOpinion();

  // Para los tests que requieren autenticación, necesitas un token válido
  // Puedes obtenerlo haciendo login primero
  const token = process.env.ADMIN_TOKEN || null;

  if (token) {
    await testGetOpinions(token);
    await testGetStats(token);
  } else {
    log('\n⚠️  No se proporcionó token de administrador', 'yellow');
    log('   Para probar los endpoints privados, ejecuta:', 'yellow');
    log('   ADMIN_TOKEN="tu-token-aqui" node test-opinions-api.js', 'yellow');
  }

  log('\n' + '='.repeat(60), 'bright');
  log('PRUEBA COMPLETADA', 'bright');
  log('='.repeat(60), 'bright');

  if (opinionId) {
    log('\n💡 TIP: La opinión creada tiene el ID: ' + opinionId, 'blue');
    log('   Puedes verla en el panel de administración', 'blue');
  }
}

// Ejecutar tests
runTests().catch(error => {
  console.error('Error ejecutando tests:', error);
  process.exit(1);
});
