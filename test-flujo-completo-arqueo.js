const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testFlujoCompletoArqueo() {
  try {
    console.log('🔐 Iniciando sesión...');

    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@prosperpos.com',
      password: 'Admin1234'
    });

    const token = loginResponse.data.data?.token || loginResponse.data.token;
    console.log('✅ Login exitoso\n');

    // Obtener sesiones
    console.log('📋 Obteniendo sesiones de caja...');
    const sessionsResponse = await axios.get(`${API_URL}/cash-register/sessions`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const sessions = sessionsResponse.data.data;
    const openSession = sessions.find(s => s.status === 'ABIERTA' || s.status === 'REVISADO');

    if (!openSession) {
      console.log('❌ No hay cajas abiertas o revisadas');
      return;
    }

    console.log(`📦 Caja encontrada: ${openSession.consecutive}`);
    console.log(`   Estado actual: ${openSession.status}`);
    console.log(`   Fecha hasta: ${openSession.date_to || 'NULL ✅'}`);
    console.log(`   Hora hasta: ${openSession.time_to || 'NULL ✅'}\n`);

    // Obtener detalles
    const sessionDetailResponse = await axios.get(
      `${API_URL}/cash-register/sessions/${openSession.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const sessionDetail = sessionDetailResponse.data.data;

    console.log('📊 TOTALES DEL SISTEMA:');
    console.log('========================================');
    console.log(`Total General: L ${sessionDetail.system_totals.total_general}`);
    console.log(`Apertura: L ${sessionDetail.opening_amount}`);
    console.log(`Ventas del día: L ${sessionDetail.system_totals.total_general - sessionDetail.opening_amount}\n`);

    // PASO 1: GUARDAR (debe cambiar a REVISADO)
    if (openSession.status === 'ABIERTA') {
      console.log('🔧 PASO 1: GUARDANDO ARQUEO (debe cambiar a REVISADO)...');
      console.log('========================================');

      const updateData = {
        total_cash: '1000.00',
        total_by_count: '4000.00',
        total_by_system: String(sessionDetail.system_totals.total_general),
        final_total: String(sessionDetail.system_totals.total_general),
        status: 'REVISADO',
        notes: 'Arqueo revisado - prueba automática'
      };

      const updateResponse = await axios.put(
        `${API_URL}/cash-register/sessions/${openSession.id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (updateResponse.data.success) {
        console.log('✅ Arqueo guardado exitosamente');
        console.log(`   Nuevo estado: ${updateResponse.data.data?.status || 'REVISADO'}`);
        console.log(`   Fecha hasta: ${updateResponse.data.data?.date_to || 'NULL ✅'}`);
        console.log(`   Hora hasta: ${updateResponse.data.data?.time_to || 'NULL ✅'}`);
        console.log(`   Total final: L ${updateResponse.data.data?.final_total || 'N/A'}\n`);
      }
    }

    // PASO 2: CERRAR CAJA (debe llenar date_to y time_to)
    console.log('🔒 PASO 2: CERRANDO CAJA (debe llenar fechas)...');
    console.log('========================================');

    const now = new Date();
    const closeData = {
      date_to: now.toISOString().split('T')[0],
      time_to: now.toTimeString().split(' ')[0].substring(0, 5),
      status: 'CERRADA'
    };

    console.log(`   Fecha a establecer: ${closeData.date_to}`);
    console.log(`   Hora a establecer: ${closeData.time_to}\n`);

    const closeResponse = await axios.put(
      `${API_URL}/cash-register/sessions/${openSession.id}`,
      closeData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (closeResponse.data.success) {
      console.log('✅ Caja cerrada exitosamente');
      console.log(`   Estado final: ${closeResponse.data.data?.status || 'CERRADA'}`);
      console.log(`   Fecha hasta: ${closeResponse.data.data?.date_to || 'ERROR'}`);
      console.log(`   Hora hasta: ${closeResponse.data.data?.time_to || 'ERROR'}`);
      console.log(`   Total final: L ${closeResponse.data.data?.final_total || 'N/A'}`);
    }

    console.log('\n✅ FLUJO COMPLETADO EXITOSAMENTE');

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Detalles:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testFlujoCompletoArqueo();
