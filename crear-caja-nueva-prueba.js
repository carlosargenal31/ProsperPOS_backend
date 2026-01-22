const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function crearCajaNueva() {
  try {
    console.log('🔐 Iniciando sesión...');

    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@prosperpos.com',
      password: 'Admin1234'
    });

    const token = loginResponse.data.data?.token || loginResponse.data.token;
    console.log('✅ Login exitoso\n');

    console.log('📦 Creando nueva caja...');

    const now = new Date();
    const newSession = {
      session_type: 'APERTURA',
      date_from: now.toISOString().split('T')[0],
      time_from: now.toTimeString().split(' ')[0].substring(0, 5),
      opening_amount: 1000.00,
      agency: 'Agencia Principal',
      notes: 'Caja de prueba para flujo completo',
      status: 'ABIERTA'
    };

    const response = await axios.post(
      `${API_URL}/cash-register/sessions`,
      newSession,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.success) {
      console.log('✅ Caja creada exitosamente');
      console.log(`   Consecutivo: ${response.data.data.consecutive}`);
      console.log(`   Estado: ${response.data.data.status}`);
      console.log(`   Fecha desde: ${response.data.data.date_from}`);
      console.log(`   Hora desde: ${response.data.data.time_from}`);
      console.log(`   Apertura: L ${response.data.data.opening_amount}`);
      console.log(`   Fecha hasta: ${response.data.data.date_to || 'NULL ✅'}`);
      console.log(`   Hora hasta: ${response.data.data.time_to || 'NULL ✅'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Detalles:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

crearCajaNueva();
