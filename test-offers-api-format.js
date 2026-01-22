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
    console.log('✓ Login exitoso\n');

    // Test endpoint con is_active=1
    console.log('2. Probando endpoint /offers?is_active=1...');
    const response = await axios.get('http://localhost:3000/api/v1/offers?is_active=1', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✓ Status:', response.status);
    console.log('✓ Success:', response.data.success);

    const offers = response.data.data;
    console.log('✓ Total ofertas:', Array.isArray(offers) ? offers.length : 'No es array');

    if (Array.isArray(offers) && offers.length > 0) {
      console.log('\n✓ Primera oferta (formato completo):');
      const firstOffer = offers[0];
      console.log(JSON.stringify(firstOffer, null, 2));

      console.log('\n✓ Campos importantes para el frontend:');
      console.log('  - id:', firstOffer.id);
      console.log('  - code:', firstOffer.code);
      console.log('  - name:', firstOffer.name);
      console.log('  - description:', firstOffer.description);
      console.log('  - offer_type:', firstOffer.offer_type);
      console.log('  - discount_type:', firstOffer.discount_type);
      console.log('  - discount_value:', firstOffer.discount_value);
      console.log('  - applies_to:', firstOffer.applies_to);
      console.log('  - valid_until:', firstOffer.valid_until);
      console.log('  - is_active:', firstOffer.is_active);
      console.log('  - product_count:', firstOffer.product_count);
    }

  } catch (error) {
    console.error('\n✗ ERROR:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

test();
