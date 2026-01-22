const axios = require('axios');

async function test() {
  try {
    // Login
    console.log('1. Iniciando sesión...');
    const loginRes = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'admin@prosperpos.com',
      password: 'Admin1234'
    });

    const token = loginRes.data.data.token;
    console.log('✓ Login exitoso');

    // Test endpoint con is_active=1
    console.log('\n2. Probando endpoint /offers?is_active=1...');
    const response = await axios.get('http://localhost:3000/api/v1/offers?is_active=1', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✓ Endpoint funciona correctamente!');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Message:', response.data.message);

    const offers = response.data.data;
    console.log('Total ofertas:', Array.isArray(offers) ? offers.length : 'No es array');

    if (Array.isArray(offers) && offers.length > 0) {
      console.log('\n✓ Primeras 3 ofertas:');
      offers.slice(0, 3).forEach((offer, i) => {
        console.log(`  ${i + 1}. ${offer.codigo} - ${offer.nombre} (Activa: ${offer.is_active})`);
      });
    } else {
      console.log('⚠ No se encontraron ofertas o la respuesta no es un array');
      console.log('Respuesta:', JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    console.error('\n✗ ERROR:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Message:', error.message);
    }
  }
}

test();
