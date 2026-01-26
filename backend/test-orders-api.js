// Test del endpoint de pedidos
const axios = require('axios');

async function testOrdersAPI() {
  try {
    console.log('🧪 Probando endpoint de pedidos...\n');

    // Token de un cliente (debes tener uno válido)
    // Por ahora vamos a probar sin token para ver el error
    const response = await axios.get('http://localhost:3000/api/v1/ecommerce/orders', {
      headers: {
        'Authorization': 'Bearer tu_token_aqui'
      }
    });

    console.log('✅ Respuesta del servidor:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    if (error.response) {
      console.log('❌ Error del servidor:');
      console.log('Status:', error.response.status);
      console.log('Message:', error.response.data);
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testOrdersAPI();
