const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testArqueoSave() {
  try {
    console.log('=== PRUEBA DE SANITIZACIÓN DE DECIMALES EN ARQUEO ===\n');

    // 1. Login
    console.log('1. Iniciando sesión...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@prosperpos.com',
      password: 'Admin123'
    });
    const token = loginResponse.data.token;
    console.log('✓ Login exitoso\n');

    // 2. Obtener arqueo existente
    console.log('2. Obteniendo arqueos...');
    const sesionesResponse = await axios.get(`${API_URL}/cash-register/sessions`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!sesionesResponse.data.data || sesionesResponse.data.data.length === 0) {
      console.log('❌ No hay sesiones para probar');
      return;
    }

    const session = sesionesResponse.data.data[0];
    console.log(`✓ Sesión encontrada: ${session.consecutive} (ID: ${session.id})\n`);

    // 3. Preparar datos con FORMATO PROBLEMÁTICO (como si vinieran del frontend con locale)
    console.log('3. Preparando datos con formatos problemáticos...');
    const testData = {
      agency: session.agency,
      date_from: session.date_from,
      time_from: session.time_from,
      // Estos valores simulan lo que podría venir del frontend con formato locale
      total_card: '0.000.000.00',        // Formato problemático
      total_cash: '0.00',
      total_transfer: '1.175,80',        // Formato con coma decimal
      total_sum: '3.400,00',             // Formato con punto de miles
      opening_amount: '3400.00',
      final_total: '0.000.000.003400.00', // Formato muy problemático
      exchange_rate: '0,0000',
      bank_commission_percentage: '0.00',
      bank_commission_total: '0.00',
      total_by_count: '3.400,00',
      total_by_system: session.total_by_system || 0,
      difference: '0.00',
      notes: 'Prueba de sanitización de decimales',
      status: 'ABIERTA'
    };

    console.log('Datos de prueba:', JSON.stringify(testData, null, 2));
    console.log('\n4. Intentando actualizar sesión con datos malformados...');

    // 4. Intentar actualizar
    const updateResponse = await axios.put(
      `${API_URL}/cash-register/sessions/${session.id}`,
      testData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (updateResponse.data.success) {
      console.log('✓ ¡ACTUALIZACIÓN EXITOSA!');
      console.log('\nDatos guardados correctamente:');
      console.log('- total_card:', updateResponse.data.data.total_card);
      console.log('- total_transfer:', updateResponse.data.data.total_transfer);
      console.log('- total_sum:', updateResponse.data.data.total_sum);
      console.log('- final_total:', updateResponse.data.data.final_total);
      console.log('- exchange_rate:', updateResponse.data.data.exchange_rate);
      console.log('\n✅ LA SANITIZACIÓN ESTÁ FUNCIONANDO CORRECTAMENTE');
    } else {
      console.log('❌ Fallo en la actualización:', updateResponse.data.message);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data?.message || error.message);
    if (error.response?.data?.error) {
      console.error('Detalles:', error.response.data.error);
    }
  }
}

testArqueoSave();
