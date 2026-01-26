const axios = require('axios');

async function testOpinionsEndpoint() {
  try {
    console.log('🔍 Probando endpoint de opiniones...\n');

    // Primero hacer login para obtener un token válido
    console.log('1️⃣ Haciendo login...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'admin@empresa.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Token obtenido:', token.substring(0, 20) + '...\n');

    // Probar endpoint de opiniones
    console.log('2️⃣ Consultando opiniones...');
    const opinionsResponse = await axios.get('http://localhost:3000/api/v1/opinions?limit=1000', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Respuesta exitosa:');
    console.log('Total opiniones:', opinionsResponse.data.data?.length || 0);
    console.log('Estructura de respuesta:', JSON.stringify(opinionsResponse.data, null, 2));

  } catch (error) {
    console.error('\n❌ ERROR:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    console.error('Error completo:', error.response?.data);

    if (error.response?.status === 500) {
      console.error('\n🔍 Error 500 - Problema en el servidor');
      console.error('Revisa los logs del backend para más detalles');
    }
  }
}

testOpinionsEndpoint();
