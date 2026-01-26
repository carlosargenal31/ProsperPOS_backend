const axios = require('axios');

async function testAPI() {
  try {
    // Primero obtener el token del localStorage de tu navegador
    // Por ahora probemos sin autenticación para ver el error
    console.log('🔍 Probando endpoint de opiniones SIN token...\n');

    try {
      const response = await axios.get('http://localhost:3000/api/v1/opinions?limit=1000');
      console.log('✅ Respuesta:', response.data);
    } catch (error) {
      console.log('❌ Error sin token:');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message);
      console.log('Error:', error.response?.data?.error);
    }

    console.log('\n🔍 Probando endpoint de estadísticas SIN token...\n');

    try {
      const response = await axios.get('http://localhost:3000/api/v1/opinions/stats');
      console.log('✅ Respuesta:', response.data);
    } catch (error) {
      console.log('❌ Error sin token:');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message);
      console.log('Error:', error.response?.data?.error);
    }

    // Probar con token falso para ver si es problema de autenticación
    console.log('\n🔍 Probando CON token falso...\n');

    try {
      const response = await axios.get('http://localhost:3000/api/v1/opinions?limit=1000', {
        headers: {
          'Authorization': 'Bearer fake-token-123'
        }
      });
      console.log('✅ Respuesta:', response.data);
    } catch (error) {
      console.log('❌ Error con token falso:');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message);

      if (error.response?.status === 500) {
        console.log('\n⚠️  ERROR 500 - Problema en el servidor');
        console.log('Error completo:', error.response?.data);
      }
    }

  } catch (error) {
    console.error('Error general:', error.message);
  }
}

testAPI();
