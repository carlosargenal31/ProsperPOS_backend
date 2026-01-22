const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testArqueoCompleto() {
  try {
    console.log('=== PRUEBA COMPLETA DE ARQUEO DE CAJA ===\n');

    // Paso 1: Login
    console.log('1. Iniciando sesión...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@prosperpos.com',
      password: '123456'
    });

    const token = loginResponse.data.data.token;
    const userId = loginResponse.data.data.user.id;
    console.log(`   ✓ Login exitoso - User ID: ${userId}`);
    console.log(`   ✓ Token: ${token.substring(0, 20)}...`);

    const headers = {
      Authorization: `Bearer ${token}`
    };

    // Paso 2: Crear apertura de caja
    console.log('\n2. Creando apertura de caja...');
    const now = new Date();
    const dateFrom = now.toISOString().split('T')[0];
    const timeFrom = now.toTimeString().split(' ')[0].substring(0, 5);

    const aperturaData = {
      session_type: 'APERTURA',
      user_id: userId,
      branch_id: 1,
      agency: 'Sucursal Principal',
      date_from: dateFrom,
      time_from: timeFrom,
      opening_amount: 1000.00,
      currency: 'LEMPIRA',
      notes: 'Apertura de caja de prueba',
      status: 'ABIERTA'
    };

    console.log('   Datos de apertura:', JSON.stringify(aperturaData, null, 2));

    const aperturaResponse = await axios.post(
      `${API_URL}/cash-register/sessions`,
      aperturaData,
      { headers }
    );

    const sessionId = aperturaResponse.data.data.id;
    console.log(`   ✓ Apertura creada exitosamente`);
    console.log(`   ✓ ID de sesión: ${sessionId}`);
    console.log(`   ✓ Consecutivo: ${aperturaResponse.data.data.consecutive}`);
    console.log(`   ✓ Monto de apertura: L ${aperturaResponse.data.data.opening_amount}`);

    // Paso 3: Obtener sesión para verificar
    console.log('\n3. Verificando sesión creada...');
    const getSessionResponse = await axios.get(
      `${API_URL}/cash-register/sessions/${sessionId}`,
      { headers }
    );

    const session = getSessionResponse.data.data;
    console.log(`   ✓ Sesión obtenida exitosamente`);
    console.log(`   ✓ Estado: ${session.status}`);
    console.log(`   ✓ Totales del sistema:`);
    console.log(`      - Efectivo: L ${session.system_totals.total_cash}`);
    console.log(`      - Tarjeta: L ${session.system_totals.total_card}`);
    console.log(`      - Transferencia: L ${session.system_totals.total_transfer}`);
    console.log(`      - Total general: L ${session.system_totals.total_general}`);

    // Paso 4: Actualizar sesión con arqueo (denominaciones)
    console.log('\n4. Actualizando sesión con arqueo...');

    // Simular conteo de denominaciones
    const denominations = [
      { denomination: 'Billete 100.00', currency: 'LEMPIRA', quantity: 5, unit_value: 100.00, total_value: 500.00 },
      { denomination: 'Billete 50.00', currency: 'LEMPIRA', quantity: 4, unit_value: 50.00, total_value: 200.00 },
      { denomination: 'Billete 20.00', currency: 'LEMPIRA', quantity: 10, unit_value: 20.00, total_value: 200.00 },
      { denomination: 'Moneda 1.00', currency: 'LEMPIRA', quantity: 50, unit_value: 1.00, total_value: 50.00 },
      { denomination: 'Moneda 0.50', currency: 'LEMPIRA', quantity: 100, unit_value: 0.50, total_value: 50.00 }
    ];

    const totalEfectivo = denominations.reduce((sum, d) => sum + d.total_value, 0);

    // Pagos bancarios (tarjeta, transferencias)
    const bankPayments = [
      {
        payment_method: 'TARJ. CREDITO',
        bank: 'BAC',
        reference: 'REF-001',
        currency: 'LEMPIRA',
        total_ext: 500.00,
        total_local: 500.00
      },
      {
        payment_method: 'TRANSFERENCIA',
        bank: 'Banco Atlántida',
        reference: 'TRANS-001',
        currency: 'LEMPIRA',
        total_ext: 300.00,
        total_local: 300.00
      }
    ];

    const totalBankPayments = bankPayments.reduce((sum, p) => sum + p.total_local, 0);
    const totalByCount = totalEfectivo + totalBankPayments;

    const updateData = {
      date_to: dateFrom,
      time_to: now.toTimeString().split(' ')[0].substring(0, 5),
      total_cash: String(totalEfectivo.toFixed(2)),
      total_card: '0.00',
      total_transfer: '0.00',
      total_sum: String(totalByCount.toFixed(2)),
      opening_amount: '1000.00',
      final_total: String(totalByCount.toFixed(2)),
      currency: 'LEMPIRA',
      exchange_rate: '0.0000',
      total_by_count: String(totalByCount.toFixed(2)),
      total_by_system: String(session.system_totals.total_general.toFixed(2)),
      difference: String((totalByCount - session.system_totals.total_general).toFixed(2)),
      denominations: denominations.map(d => ({
        denomination: d.denomination,
        currency: d.currency,
        quantity: d.quantity,
        unit_value: String(d.unit_value.toFixed(2)),
        total_value: String(d.total_value.toFixed(2))
      })),
      bank_payments: bankPayments.map(p => ({
        payment_method: p.payment_method,
        bank: p.bank,
        reference: p.reference,
        currency: p.currency,
        total_ext: String(p.total_ext.toFixed(2)),
        total_local: String(p.total_local.toFixed(2))
      })),
      status: 'ABIERTA'
    };

    console.log('   Datos de actualización:', JSON.stringify(updateData, null, 2));

    const updateResponse = await axios.put(
      `${API_URL}/cash-register/sessions/${sessionId}`,
      updateData,
      { headers }
    );

    console.log(`   ✓ Arqueo actualizado exitosamente`);
    console.log(`   ✓ Total efectivo contado: L ${totalEfectivo.toFixed(2)}`);
    console.log(`   ✓ Total pagos bancarios: L ${totalBankPayments.toFixed(2)}`);
    console.log(`   ✓ Total según conteo: L ${totalByCount.toFixed(2)}`);
    console.log(`   ✓ Total según sistema: L ${session.system_totals.total_general.toFixed(2)}`);
    console.log(`   ✓ Diferencia: L ${(totalByCount - session.system_totals.total_general).toFixed(2)}`);

    // Paso 5: Obtener sesión actualizada para verificar
    console.log('\n5. Verificando sesión actualizada...');
    const getUpdatedResponse = await axios.get(
      `${API_URL}/cash-register/sessions/${sessionId}`,
      { headers }
    );

    const updatedSession = getUpdatedResponse.data.data;
    console.log(`   ✓ Sesión actualizada obtenida exitosamente`);
    console.log(`   ✓ Denominaciones guardadas: ${updatedSession.denominations.length}`);
    console.log(`   ✓ Pagos bancarios guardados: ${updatedSession.bank_payments.length}`);
    console.log(`   ✓ Total por conteo: L ${updatedSession.total_by_count}`);
    console.log(`   ✓ Total por sistema: L ${updatedSession.total_by_system}`);
    console.log(`   ✓ Diferencia: L ${updatedSession.difference}`);

    // Paso 6: Listar todas las sesiones
    console.log('\n6. Listando todas las sesiones...');
    const listResponse = await axios.get(
      `${API_URL}/cash-register/sessions`,
      { headers }
    );

    console.log(`   ✓ Total de sesiones: ${listResponse.data.data.length}`);
    if (listResponse.data.data.length > 0) {
      const lastSession = listResponse.data.data[0];
      console.log(`   ✓ Última sesión:`);
      console.log(`      - ID: ${lastSession.id}`);
      console.log(`      - Consecutivo: ${lastSession.consecutive}`);
      console.log(`      - Estado: ${lastSession.status}`);
      console.log(`      - Usuario: ${lastSession.user_name}`);
    }

    console.log('\n✅ TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE\n');
    console.log('Puedes ahora:');
    console.log('1. Ir a http://localhost:3000/cash-register');
    console.log('2. Ver la sesión creada en la lista');
    console.log('3. Hacer clic en "Editar" para ver el arqueo completo');
    console.log('4. Los denominaciones y pagos bancarios deben estar guardados correctamente');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('Respuesta del servidor:', error.response.status);
      console.error('Datos:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Ejecutar prueba
testArqueoCompleto();
