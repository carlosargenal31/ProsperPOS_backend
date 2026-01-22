const axios = require('axios');

async function testOpinionResponseAPI() {
  try {
    console.log('🧪 PROBANDO RESPUESTA DE OPINIÓN CON ENVÍO DE EMAIL\n');

    // 1. Login
    console.log('1️⃣ Obteniendo token...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'admin@prosperpos.com',
      password: 'Admin1234'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Token obtenido\n');

    // 2. Obtener la primera opinión pendiente
    console.log('2️⃣ Buscando opinión pendiente...');
    const opinionsResponse = await axios.get('http://localhost:3000/api/v1/opinions?status=pendiente&limit=1', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (opinionsResponse.data.data.length === 0) {
      console.log('⚠️  No hay opiniones pendientes para probar');
      console.log('💡 Crea una opinión desde el formulario de contacto primero');
      return;
    }

    const opinion = opinionsResponse.data.data[0];
    console.log(`✅ Opinión encontrada: ${opinion.name} ${opinion.lastname} (${opinion.email})\n`);

    // 3. Responder la opinión
    console.log('3️⃣ Enviando respuesta (esto también enviará el email)...');
    const responseData = {
      admin_response: 'Hola! Esta es una respuesta de prueba del sistema. Gracias por tu consulta, estaremos en contacto pronto. Saludos, Equipo ProsperPOS.'
    };

    const respondResult = await axios.post(
      `http://localhost:3000/api/v1/opinions/${opinion.id}/respond`,
      responseData,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    console.log('\n📊 Resultado de la respuesta:');
    console.log(`   Success: ${respondResult.data.success}`);
    console.log(`   Email enviado: ${respondResult.data.email_sent ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   Message: ${respondResult.data.message}`);

    if (respondResult.data.email_sent) {
      console.log('\n🎉 ¡ÉXITO! Email enviado correctamente');
      console.log(`📬 Revisa la bandeja de: ${opinion.email}`);
      console.log('💡 Si no lo ves, revisa Spam\n');
    } else {
      console.log('\n⚠️  La respuesta se guardó pero el email NO se envió');
      console.log('Revisa los logs del servidor para más detalles\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.log('Detalles:', error.response.data);
    }
  }
}

testOpinionResponseAPI();
