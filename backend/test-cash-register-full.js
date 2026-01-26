const axios = require('axios');

async function testFullCashRegisterModule() {
  const API_URL = 'http://localhost:3001/api/v1';
  let token;
  let sessionId;

  try {
    console.log('='.repeat(60));
    console.log('PRUEBA COMPLETA DEL MÓDULO DE ARQUEO DE CAJA');
    console.log('='.repeat(60));

    // Test 1: Login
    console.log('\n1. Testing login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@prosperpos.com',
      password: '123456'
    });
    token = loginResponse.data.data.token;
    const userId = loginResponse.data.data.user.id;
    console.log('✓ Login successful');
    console.log('  User ID:', userId);
    console.log('  Token obtained:', token.substring(0, 20) + '...');

    // Test 2: Get all sessions (should be empty initially)
    console.log('\n2. Testing GET /cash-register/sessions...');
    const sessionsResponse = await axios.get(`${API_URL}/cash-register/sessions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ Sessions endpoint works!');
    console.log('  Found', sessionsResponse.data.data.length, 'sessions');

    // Test 3: Get summary
    console.log('\n3. Testing GET /cash-register/summary...');
    const summaryResponse = await axios.get(`${API_URL}/cash-register/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ Summary endpoint works!');
    console.log('  Total sessions:', summaryResponse.data.data.total_sessions);
    console.log('  Open sessions:', summaryResponse.data.data.open_sessions || 0);

    // Test 4: Create a new cash register session (Apertura)
    console.log('\n4. Testing POST /cash-register/sessions (Apertura)...');
    const newSession = {
      session_type: 'APERTURA',
      user_id: userId,
      date_from: new Date().toISOString().split('T')[0],
      time_from: new Date().toTimeString().split(' ')[0],
      opening_amount: 5000.00,
      agency: 'Agencia Principal',
      notes: 'Apertura de caja de prueba'
    };

    const createResponse = await axios.post(`${API_URL}/cash-register/sessions`, newSession, {
      headers: { Authorization: `Bearer ${token}` }
    });
    sessionId = createResponse.data.data.id;
    console.log('✓ Session created successfully!');
    console.log('  Session ID:', sessionId);
    console.log('  Consecutive:', createResponse.data.data.consecutive);

    // Test 5: Get session by ID
    console.log('\n5. Testing GET /cash-register/sessions/:id...');
    const sessionDetailResponse = await axios.get(`${API_URL}/cash-register/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ Session detail retrieved!');
    console.log('  Session Type:', sessionDetailResponse.data.data.session_type);
    console.log('  Opening Amount:', sessionDetailResponse.data.data.opening_amount);
    console.log('  Status:', sessionDetailResponse.data.data.status);

    // Test 6: Create a transaction (Egreso)
    console.log('\n6. Testing POST /cash-register/transactions (Egreso)...');
    const transaction = {
      session_id: sessionId,
      transaction_type: 'EGRESO',
      amount: 500.00,
      description: 'Compra de suministros de oficina',
      payment_method: 'EFECTIVO',
      beneficiary: 'Papelería El Sol',
      user_id: userId
    };

    const transactionResponse = await axios.post(`${API_URL}/cash-register/transactions`, transaction, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ Transaction created successfully!');
    console.log('  Transaction ID:', transactionResponse.data.data.id);
    console.log('  Amount:', transactionResponse.data.data.amount);

    // Test 7: Get transactions for session
    console.log('\n7. Testing GET /cash-register/transactions/session/:sessionId...');
    const transactionsResponse = await axios.get(`${API_URL}/cash-register/transactions/session/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ Transactions retrieved!');
    console.log('  Found', transactionsResponse.data.data.length, 'transactions');

    // Test 8: Update session
    console.log('\n8. Testing PUT /cash-register/sessions/:id...');
    const updateData = {
      notes: 'Sesión actualizada con egreso registrado'
    };
    const updateResponse = await axios.put(`${API_URL}/cash-register/sessions/${sessionId}`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ Session updated successfully!');

    // Test 9: Close session
    console.log('\n9. Testing POST /cash-register/sessions/:id/close...');
    const closeData = {
      date_to: new Date().toISOString().split('T')[0],
      time_to: new Date().toTimeString().split(' ')[0],
      total_cash: 4500.00,
      total_card: 0.00,
      total_transfer: 0.00,
      total_by_count: 4500.00,
      notes: 'Cierre de caja de prueba'
    };
    const closeResponse = await axios.post(`${API_URL}/cash-register/sessions/${sessionId}/close`, closeData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ Session closed successfully!');
    console.log('  Final Status:', closeResponse.data.data.status);
    console.log('  Total by Count:', closeResponse.data.data.total_by_count);
    console.log('  Total by System:', closeResponse.data.data.total_by_system);
    console.log('  Difference:', closeResponse.data.data.difference);

    // Test 10: Get updated summary
    console.log('\n10. Testing GET /cash-register/summary (after operations)...');
    const finalSummaryResponse = await axios.get(`${API_URL}/cash-register/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ Final summary retrieved!');
    console.log('  Total sessions:', finalSummaryResponse.data.data.total_sessions);
    console.log('  Closed sessions:', finalSummaryResponse.data.data.closed_sessions);

    console.log('\n' + '='.repeat(60));
    console.log('✅ TODAS LAS PRUEBAS PASARON EXITOSAMENTE!');
    console.log('='.repeat(60));
    console.log('\n📊 RESUMEN:');
    console.log('  ✓ Autenticación funcionando');
    console.log('  ✓ Endpoints de sesiones funcionando');
    console.log('  ✓ Endpoint de resumen funcionando');
    console.log('  ✓ Creación de sesiones funcionando');
    console.log('  ✓ Creación de transacciones funcionando');
    console.log('  ✓ Actualización de sesiones funcionando');
    console.log('  ✓ Cierre de sesiones funcionando');
    console.log('\n🎉 El módulo de Arqueo de Caja está completamente funcional!\n');

    // Clean up - delete test session
    console.log('Limpiando datos de prueba...');
    await axios.delete(`${API_URL}/cash-register/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ Sesión de prueba eliminada\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    console.error('Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testFullCashRegisterModule();
