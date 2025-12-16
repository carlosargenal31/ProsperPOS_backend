// Script para probar el endpoint completo de productos vendidos
// Este script asume que el backend está corriendo en http://localhost:3000

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/v1`;

async function testEndpoint() {
  try {
    console.log('=== Probando Endpoint de Productos Vendidos ===\n');
    console.log(`URL Base: ${API_URL}`);
    console.log('IMPORTANTE: Asegúrate de que el backend esté corriendo!\n');

    // Test 1: Login para obtener token (opcional, dependiendo de tu setup)
    console.log('1. Autenticación...');
    let token;
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: 'admin@prosperpos.com',
        password: 'admin123'
      });
      token = loginResponse.data.token;
      console.log('   ✓ Login exitoso, token obtenido\n');
    } catch (loginError) {
      console.log('   ⚠️  Login falló, continuando sin token...\n');
      token = null;
    }

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // Test 2: Obtener productos vendidos
    console.log('2. Probando GET /sold-items...');
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 30);

    try {
      const response = await axios.get(`${API_URL}/sold-items`, {
        params: {
          date_from: dateFrom.toISOString().split('T')[0],
          date_to: new Date().toISOString().split('T')[0]
        },
        headers
      });

      if (response.data && response.data.items) {
        console.log(`   ✓ Productos encontrados: ${response.data.items.length}`);
        console.log(`   ✓ Total final: L ${response.data.totals.total_final.toFixed(2)}\n`);
      } else {
        console.log('   ✓ Respuesta recibida pero sin formato esperado\n');
        console.log('   Respuesta:', response.data);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.response?.status || error.message}`);
      if (error.response?.data) {
        console.log('   Detalle:', error.response.data);
      }
      console.log();
    }

    // Test 3: Obtener categorías
    console.log('3. Probando GET /categories...');
    try {
      const response = await axios.get(`${API_URL}/categories`, { headers });
      console.log(`   ✓ Categorías encontradas: ${response.data.length || response.data.data?.length || 0}\n`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.response?.status || error.message}\n`);
    }

    // Test 4: Obtener subcategorías
    console.log('4. Probando GET /subcategories...');
    try {
      const response = await axios.get(`${API_URL}/subcategories`, { headers });
      console.log(`   ✓ Subcategorías encontradas: ${response.data.length || response.data.data?.length || 0}\n`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.response?.status || error.message}\n`);
    }

    // Test 5: Obtener productos
    console.log('5. Probando GET /products...');
    try {
      const response = await axios.get(`${API_URL}/products`, {
        headers,
        params: { limit: 10 }
      });
      console.log(`   ✓ Productos encontrados\n`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.response?.status || error.message}\n`);
    }

    // Test 6: Obtener marcas
    console.log('6. Probando GET /brands...');
    try {
      const response = await axios.get(`${API_URL}/brands`, { headers });
      console.log(`   ✓ Marcas encontradas\n`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.response?.status || error.message}\n`);
    }

    // Test 7: Obtener bodegas
    console.log('7. Probando GET /warehouses...');
    try {
      const response = await axios.get(`${API_URL}/warehouses`, { headers });
      console.log(`   ✓ Bodegas encontradas\n`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.response?.status || error.message}\n`);
    }

    // Test 8: Obtener sucursales
    console.log('8. Probando GET /branches...');
    try {
      const response = await axios.get(`${API_URL}/branches`, { headers });
      console.log(`   ✓ Sucursales encontradas\n`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.response?.status || error.message}\n`);
    }

    console.log('✅ Pruebas de endpoint completadas!');
    console.log('\nNOTA: Si algún endpoint falló con error 401, necesitas configurar');
    console.log('      el token de autenticación correctamente.');

  } catch (error) {
    console.error('\n❌ Error general:', error.message);
  }
}

// Solo ejecutar si el backend está corriendo
console.log('⚠️  ASEGÚRATE DE QUE EL BACKEND ESTÉ CORRIENDO!');
console.log('   Para iniciar el backend: cd backend && npm start\n');
console.log('Presiona Ctrl+C para cancelar, o espera 3 segundos...\n');

setTimeout(testEndpoint, 3000);
