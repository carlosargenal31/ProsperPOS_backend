const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testArqueoVentasDia() {
  try {
    console.log('🔐 Iniciando sesión...');

    // Login
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@prosperpos.com',
      password: 'Admin1234'
    });

    const token = loginResponse.data.data?.token || loginResponse.data.token;
    console.log('✅ Login exitoso');
    console.log('Token:', token ? 'Obtenido' : 'No obtenido');
    console.log('');

    // Obtener lista de sesiones de caja
    console.log('📋 Obteniendo sesiones de caja...');
    const sessionsResponse = await axios.get(`${API_URL}/cash-register/sessions`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const sessions = sessionsResponse.data.data;
    console.log(`✅ Se encontraron ${sessions.length} sesiones\n`);

    // Buscar una caja abierta
    const openSession = sessions.find(s => s.status === 'ABIERTA');

    if (!openSession) {
      console.log('❌ No hay cajas abiertas. Crea una primero.');
      return;
    }

    console.log(`📦 Caja abierta encontrada: ${openSession.consecutive}`);
    console.log(`   Estado: ${openSession.status}`);
    console.log(`   Fecha desde: ${openSession.date_from}`);
    console.log(`   Hora desde: ${openSession.time_from}`);
    console.log(`   Fecha hasta: ${openSession.date_to || 'NO ESTABLECIDA ✅'}`);
    console.log(`   Hora hasta: ${openSession.time_to || 'NO ESTABLECIDA ✅'}`);
    console.log(`   Apertura: L ${openSession.opening_amount}\n`);

    // Obtener detalles completos de la sesión
    console.log('🔍 Obteniendo detalles completos de la sesión...');
    const sessionDetailResponse = await axios.get(
      `${API_URL}/cash-register/sessions/${openSession.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const sessionDetail = sessionDetailResponse.data.data;

    console.log('\n📊 TOTALES DEL SISTEMA (VENTAS DEL DÍA):');
    console.log('========================================');
    if (sessionDetail.system_totals) {
      console.log(`   💳 Tarjeta: L ${sessionDetail.system_totals.total_card || 0}`);
      console.log(`   💵 Efectivo: L ${sessionDetail.system_totals.total_cash || 0}`);
      console.log(`   🏦 Transferencia: L ${sessionDetail.system_totals.total_transfer || 0}`);
      console.log(`   📝 Nota de Crédito: L ${sessionDetail.system_totals.total_credit_note || 0}`);
      console.log(`   📄 Cheque: L ${sessionDetail.system_totals.total_check || 0}`);
      console.log(`   ─────────────────────────────────────`);
      console.log(`   🧾 TOTAL GENERAL: L ${sessionDetail.system_totals.total_general || 0}`);

      const ventasDelDia = parseFloat(sessionDetail.system_totals.total_general || 0) - parseFloat(openSession.opening_amount || 0);
      console.log(`   📈 VENTAS DEL DÍA: L ${ventasDelDia.toFixed(2)}`);
    } else {
      console.log('   ⚠️ No hay totales del sistema calculados');
    }

    console.log('\n📝 TOTALES DEL ARQUEO (LO QUE HAS CONTADO):');
    console.log('========================================');
    console.log(`   💰 Total según conteo: L ${sessionDetail.total_by_count || 0}`);
    console.log(`   🖥️  Total según sistema: L ${sessionDetail.total_by_system || 0}`);
    console.log(`   📊 Diferencia: L ${sessionDetail.difference || 0}`);

    console.log('\n✅ VALIDACIONES:');
    console.log('========================================');
    console.log(`   ${sessionDetail.date_to ? '❌' : '✅'} Fecha hasta está ${sessionDetail.date_to ? 'LLENA (INCORRECTO)' : 'VACÍA (CORRECTO)'}`);
    console.log(`   ${sessionDetail.time_to ? '❌' : '✅'} Hora hasta está ${sessionDetail.time_to ? 'LLENA (INCORRECTO)' : 'VACÍA (CORRECTO)'}`);
    console.log(`   ${sessionDetail.status === 'ABIERTA' ? '✅' : '❌'} Estado es ABIERTA: ${sessionDetail.status === 'ABIERTA' ? 'SÍ' : 'NO'}`);

    // Ahora probemos actualizar el arqueo
    console.log('\n🔧 PROBANDO ACTUALIZACIÓN DEL ARQUEO...');
    console.log('========================================');

    const updateData = {
      total_cash: '500.00',
      total_by_count: '500.00',
      denominations: [
        {
          denomination: 'Billete 100.00',
          currency: 'LEMPIRA',
          quantity: 5,
          unit_value: '100.00',
          total_value: '500.00'
        }
      ],
      bank_payments: [],
      notes: 'Prueba de actualización sin cerrar caja'
    };

    const updateResponse = await axios.put(
      `${API_URL}/cash-register/sessions/${openSession.id}`,
      updateData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (updateResponse.data.success) {
      console.log('✅ Actualización exitosa');
      console.log('   Estado después de actualizar:', updateResponse.data.data?.status);
      console.log('   Fecha hasta después de actualizar:', updateResponse.data.data?.date_to || 'NO ESTABLECIDA ✅');
      console.log('   Hora hasta después de actualizar:', updateResponse.data.data?.time_to || 'NO ESTABLECIDA ✅');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Detalles:', error.response.data);
    }
  }
}

testArqueoVentasDia();
