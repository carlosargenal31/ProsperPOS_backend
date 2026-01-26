const axios = require('axios');
const fs = require('fs');

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

    // Test endpoint
    console.log('\n2. Probando endpoint /products/search/all...');
    const response = await axios.get('http://localhost:3000/api/v1/products/search/all', {
      params: { status: 'active', store_id: 1 },
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✓ Endpoint funciona correctamente!');
    console.log('Productos:', response.data.data ? response.data.data.length : 0);

    if (response.data.data && response.data.data.length > 0) {
      const p = response.data.data[0];
      console.log('\nPrimer producto:');
      console.log(JSON.stringify({
        id: p.id,
        code: p.code,
        name: p.name,
        price_1: p.price_1,
        stock: p.stock,
        image: p.image ? 'Sí' : 'No'
      }, null, 2));
    }

  } catch (error) {
    console.error('\n✗ ERROR:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));

      // Save full error to file
      fs.writeFileSync('error-detail.json', JSON.stringify({
        status: error.response.status,
        data: error.response.data,
        stack: error.stack
      }, null, 2));
      console.error('\n📝 Detalles guardados en error-detail.json');
    } else {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

test();
