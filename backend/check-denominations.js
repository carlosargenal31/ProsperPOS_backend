const axios = require('axios');

async function test() {
  try {
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'admin@prosperpos.com',
      password: 'Admin1234'
    });

    const token = loginResponse.data.data?.token || loginResponse.data.token;

    const sessionsResponse = await axios.get('http://localhost:3000/api/v1/cash-register/sessions', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const lastSession = sessionsResponse.data.data[0];
    console.log('Última sesión:', lastSession.consecutive);

    const sessionDetailResponse = await axios.get(
      `http://localhost:3000/api/v1/cash-register/sessions/${lastSession.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('\nDenominaciones:', JSON.stringify(sessionDetailResponse.data.data.denominations, null, 2));
    console.log('\nBank Payments:', JSON.stringify(sessionDetailResponse.data.data.bank_payments, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data?.message || error.message);
  }
}

test();
