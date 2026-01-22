const axios = require('axios');

async function testArqueoAPI() {
  try {
    console.log('🔐 Iniciando sesión...\n');

    // Login
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'admin@prosperpos.com',
      password: 'Admin1234'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Login exitoso');
    console.log('Token:', token.substring(0, 20) + '...\n');

    // Get sessions list
    console.log('📋 Consultando lista de arqueos...\n');
    const listResponse = await axios.get(
      'http://localhost:3000/api/v1/cash-register/sessions',
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log(`Total de arqueos: ${listResponse.data.data.length}\n`);

    const session = listResponse.data.data[0];
    console.log('📄 Primer arqueo:');
    console.log('   ID:', session.id);
    console.log('   Consecutivo:', session.consecutive);
    console.log('   Estado:', session.status);
    console.log('');

    // Get session by ID
    console.log('🔍 Consultando detalles del arqueo...\n');
    const detailResponse = await axios.get(
      `http://localhost:3000/api/v1/cash-register/sessions/${session.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const detail = detailResponse.data.data;
    console.log('✅ Detalles del arqueo:');
    console.log('   Consecutivo:', detail.consecutive);
    console.log('   Fecha:', detail.date_from);
    console.log('   Hora:', detail.time_from);
    console.log('   Monto apertura:', `L. ${detail.opening_amount}`);
    console.log('');

    if (detail.system_totals) {
      console.log('💰 Totales del sistema:');
      console.log('   Efectivo:', `L. ${detail.system_totals.total_cash}`);
      console.log('   Tarjeta:', `L. ${detail.system_totals.total_card}`);
      console.log('   Transferencia:', `L. ${detail.system_totals.total_transfer}`);
      console.log('   Nota de Crédito:', `L. ${detail.system_totals.total_credit_note}`);
      console.log('   Cheque:', `L. ${detail.system_totals.total_check}`);
      console.log('   ─────────────────────────');
      console.log('   TOTAL GENERAL:', `L. ${detail.system_totals.total_general}`);
    } else {
      console.log('⚠️ No hay system_totals en la respuesta');
    }

    console.log('\n✅ API funcionando correctamente');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Detalles:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testArqueoAPI();
