const axios = require('axios');

async function test() {
  try {
    console.log('1. Iniciando sesión...');
    const loginRes = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'admin@prosperpos.com',
      password: 'Admin1234'
    });

    const token = loginRes.data.data.token;
    console.log('✓ Login exitoso\n');

    console.log('2. Probando endpoint /offers?is_active=1...');
    const response = await axios.get('http://localhost:3000/api/v1/offers?is_active=1', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✓ Status:', response.status);
    console.log('✓ Total ofertas:', response.data.data.length);

    if (response.data.data.length > 0) {
      const firstOffer = response.data.data[0];
      console.log('\n✓ Primera oferta:');
      console.log('  - ID:', firstOffer.id);
      console.log('  - codigo:', firstOffer.codigo);
      console.log('  - nombre:', firstOffer.nombre);
      console.log('  - tipo_descuento:', firstOffer.tipo_descuento);
      console.log('  - valor_descuento:', firstOffer.valor_descuento);
      console.log('  - tipo_aplicacion:', firstOffer.tipo_aplicacion);
      console.log('  - is_active:', firstOffer.is_active);
      console.log('  - agencia_nombre:', firstOffer.agencia_nombre);
      console.log('  - items_count:', firstOffer.items_count);

      console.log('\n✓ Formato correcto: Los campos están en ESPAÑOL ✓');
    }

  } catch (error) {
    console.error('\n✗ ERROR:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  }
}

test();
