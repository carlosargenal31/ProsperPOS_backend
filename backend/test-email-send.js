const EmailService = require('./src/services/email.service');
const logger = require('./src/utils/logger');

async function testEmailSend() {
  console.log('🧪 PROBANDO ENVÍO DE EMAIL\n');
  console.log('Enviando email de prueba a: gamaboy3101@gmail.com\n');

  try {
    const result = await EmailService.sendOpinionResponse({
      customer_name: 'Carlos Mauricio',
      customer_email: 'gamaboy3101@gmail.com',
      inquiry_type: 'Prueba del Sistema',
      original_message: 'Este es un mensaje de prueba para verificar que el sistema de emails funciona correctamente.',
      admin_response: '¡Felicidades! Si recibes este email, significa que la configuración SMTP está funcionando correctamente. Ya puedes responder opiniones de clientes y ellos recibirán tus respuestas automáticamente por correo electrónico.'
    });

    console.log('\n📊 Resultado del envío:');
    console.log(`   Success: ${result.success}`);
    console.log(`   Message: ${result.message || 'Email enviado'}`);
    if (result.message_id) {
      console.log(`   Message ID: ${result.message_id}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }

    if (result.success) {
      console.log('\n✅ ¡Email enviado exitosamente!');
      console.log('\n📬 Revisa tu bandeja de entrada en: gamaboy3101@gmail.com');
      console.log('💡 Si no lo ves, revisa la carpeta de Spam\n');
    } else {
      console.log('\n❌ Error al enviar el email');
      console.log('Detalles:', result.message || result.error);
    }

  } catch (error) {
    console.error('\n❌ Error crítico:', error.message);
    console.error('Stack:', error.stack);
  }
}

testEmailSend();
