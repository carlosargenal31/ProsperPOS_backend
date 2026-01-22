require('dotenv').config();
const EmailService = require('./src/services/email.service');

async function testEmailDirect() {
  console.log('🧪 PRUEBA DIRECTA DE ENVÍO DE EMAIL\n');

  try {
    console.log('1️⃣ Enviando email de prueba...\n');

    const result = await EmailService.sendOpinionResponse({
      customer_name: 'Carlos Mauricio',
      customer_email: 'gamaboy3101@gmail.com',
      inquiry_type: 'Prueba del Sistema',
      original_message: 'Este es un mensaje de prueba para verificar que el sistema de emails funciona correctamente.',
      admin_response: '¡Felicidades! Si recibes este email, significa que la configuración SMTP está funcionando correctamente. Ya puedes responder opiniones de clientes y ellos recibirán tus respuestas automáticamente.'
    });

    console.log('\n📊 RESULTADO:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ ¡Email enviado exitosamente!');
      console.log(`📬 Revisa tu bandeja de entrada: gamaboy3101@gmail.com`);
      console.log(`📧 Message ID: ${result.message_id || 'N/A'}`);
    } else {
      console.log('\n❌ Error al enviar email:');
      console.log(`   ${result.message || result.error}`);
    }

  } catch (error) {
    console.error('\n❌ ERROR FATAL:', error);
    console.error('Stack:', error.stack);
  }
}

testEmailDirect();
