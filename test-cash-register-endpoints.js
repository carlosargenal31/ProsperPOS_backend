const axios = require('axios');

async function testEndpoints() {
  const API_URL = 'http://localhost:3001/api/v1';

  try {
    // Test 1: Login to get token
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@prosperpos.com',
      password: '123456'
    });
    const token = loginResponse.data.data.token;
    console.log('✓ Login successful, token obtained');

    // Test 2: Get all sessions
    console.log('\n2. Testing GET /cash-register/sessions...');
    const sessionsResponse = await axios.get(`${API_URL}/cash-register/sessions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ Sessions endpoint works! Found', sessionsResponse.data.data.length, 'sessions');

    // Test 3: Get summary
    console.log('\n3. Testing GET /cash-register/summary...');
    const summaryResponse = await axios.get(`${API_URL}/cash-register/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ Summary endpoint works!');
    console.log('Summary data:', JSON.stringify(summaryResponse.data.data, null, 2));

    console.log('\n✅ ALL TESTS PASSED! Cash register module is working correctly.');
  } catch (error) {
    console.error('✗ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testEndpoints();
