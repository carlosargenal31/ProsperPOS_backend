// ===================================================================
// SCRIPT DE PRUEBA PARA ENDPOINTS DE CONSECUTIVOS
// ===================================================================

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Token de autenticación (deberás obtener uno válido primero)
let authToken = '';

async function testConsecutivesAPI() {
  console.log('🧪 INICIANDO PRUEBAS DE API DE CONSECUTIVOS\n');

  try {
    // 1. Login para obtener token
    console.log('1️⃣ Obteniendo token de autenticación...');
    const loginResponse = await axios.post(`${API_BASE}/v1/auth/login`, {
      email: 'admin@prosperpos.com',
      password: 'admin123'
    });

    authToken = loginResponse.data.data.token;
    console.log('✅ Token obtenido\n');

    const config = {
      headers: { Authorization: `Bearer ${authToken}` }
    };

    // 2. Obtener todos los consecutivos
    console.log('2️⃣ GET /api/v1/consecutives - Obtener todos los consecutivos');
    const getAllResponse = await axios.get(`${API_BASE}/v1/consecutives`, config);
    console.log('✅ Respuesta:', JSON.stringify(getAllResponse.data, null, 2));
    console.log('');

    // 3. Obtener consecutivo específico (quote)
    console.log('3️⃣ GET /api/v1/consecutives/quote - Obtener consecutivo de cotización');
    const getQuoteResponse = await axios.get(`${API_BASE}/v1/consecutives/quote`, config);
    console.log('✅ Respuesta:', JSON.stringify(getQuoteResponse.data, null, 2));
    console.log('');

    // 4. Incrementar consecutivo de cotización
    console.log('4️⃣ POST /api/v1/consecutives/quote/increment - Incrementar consecutivo');
    const incrementQuoteResponse = await axios.post(`${API_BASE}/v1/consecutives/quote/increment`, {}, config);
    console.log('✅ Respuesta:', JSON.stringify(incrementQuoteResponse.data, null, 2));
    console.log('');

    // 5. Verificar que se incrementó
    console.log('5️⃣ Verificando que el consecutivo se incrementó...');
    const verifyResponse = await axios.get(`${API_BASE}/v1/consecutives/quote`, config);
    console.log('✅ Nuevo valor:', JSON.stringify(verifyResponse.data, null, 2));
    console.log('');

    // 6. Obtener resolución activa
    console.log('6️⃣ GET /api/v1/resolutions/active - Obtener resolución activa');
    const resolutionResponse = await axios.get(`${API_BASE}/v1/resolutions/active`, config);
    console.log('✅ Respuesta:', JSON.stringify(resolutionResponse.data, null, 2));
    console.log('');

    // 7. Incrementar consecutivo de resolución
    console.log('7️⃣ PATCH /api/v1/resolutions/1/increment - Incrementar consecutivo de resolución');
    const incrementResolutionResponse = await axios.patch(`${API_BASE}/v1/resolutions/1/increment`, {}, config);
    console.log('✅ Respuesta:', JSON.stringify(incrementResolutionResponse.data, null, 2));
    console.log('');

    console.log('🎉 TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE\n');

  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
  }
}

testConsecutivesAPI();
