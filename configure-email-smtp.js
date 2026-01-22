const mysql = require('mysql2/promise');
require('dotenv').config();

// CONFIGURACIÓN - Cambia estos valores por los tuyos
const EMAIL_CONFIG = {
  smtp_host: 'smtp.gmail.com',
  smtp_port: '587',
  smtp_user: 'tu_email@gmail.com',  // 👈 CAMBIA ESTO
  smtp_password: 'tu_contraseña_app_de_16_caracteres',  // 👈 CAMBIA ESTO (contraseña de aplicación de Google)
  store_email: 'tu_email@gmail.com'  // 👈 CAMBIA ESTO (el email que aparecerá como remitente)
};

async function configureEmail() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prosperpos'
  });

  try {
    console.log('📧 Configurando SMTP para envío de emails...\n');

    // Verificar si ya existen los registros
    for (const [key, value] of Object.entries(EMAIL_CONFIG)) {
      const [existing] = await connection.query(
        'SELECT * FROM ecommerce_settings WHERE setting_key = ?',
        [key]
      );

      if (existing.length > 0) {
        // Actualizar
        await connection.query(
          'UPDATE ecommerce_settings SET setting_value = ? WHERE setting_key = ?',
          [value, key]
        );
        console.log(`✅ Actualizado: ${key}`);
      } else {
        // Insertar
        await connection.query(
          'INSERT INTO ecommerce_settings (setting_key, setting_value) VALUES (?, ?)',
          [key, value]
        );
        console.log(`✅ Creado: ${key}`);
      }
    }

    console.log('\n✅ Configuración SMTP guardada exitosamente!\n');

    // Mostrar configuración (ocultando la contraseña)
    console.log('📋 Configuración aplicada:');
    console.log(`   SMTP Host: ${EMAIL_CONFIG.smtp_host}`);
    console.log(`   SMTP Port: ${EMAIL_CONFIG.smtp_port}`);
    console.log(`   SMTP User: ${EMAIL_CONFIG.smtp_user}`);
    console.log(`   SMTP Password: ${'*'.repeat(EMAIL_CONFIG.smtp_password.length)}`);
    console.log(`   Store Email: ${EMAIL_CONFIG.store_email}`);

    console.log('\n💡 Para probar el envío de email, ejecuta:');
    console.log('   node configure-email-smtp.js --test\n');

    // Si se pide test
    if (process.argv.includes('--test')) {
      console.log('\n🧪 Probando envío de email de prueba...\n');

      const EmailService = require('./src/services/email.service');

      try {
        const testResult = await EmailService.sendOpinionResponse({
          customer_name: 'Usuario de Prueba',
          customer_email: EMAIL_CONFIG.smtp_user, // Enviar a ti mismo
          inquiry_type: 'Prueba del Sistema',
          original_message: 'Este es un mensaje de prueba para verificar que el sistema de emails funciona correctamente.',
          admin_response: '¡Felicidades! Si recibes este email, significa que la configuración SMTP está funcionando correctamente. Ya puedes responder opiniones de clientes y ellos recibirán tus respuestas automáticamente.'
        });

        if (testResult.success) {
          console.log('✅ ¡Email de prueba enviado exitosamente!');
          console.log(`📬 Revisa tu bandeja de entrada: ${EMAIL_CONFIG.smtp_user}`);
          console.log(`📧 Message ID: ${testResult.message_id || 'N/A'}\n');
        } else {
          console.log('❌ Error al enviar email de prueba:');
          console.log(`   ${testResult.message || testResult.error}\n`);
        }
      } catch (error) {
        console.log('❌ Error al enviar email de prueba:');
        console.log(`   ${error.message}\n`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

// Verificar si se editó la configuración
if (EMAIL_CONFIG.smtp_user === 'tu_email@gmail.com') {
  console.log('⚠️  ATENCIÓN: Debes editar el archivo configure-email-smtp.js\n');
  console.log('📝 Abre el archivo y cambia estos valores:');
  console.log('   - smtp_user: tu email de Gmail');
  console.log('   - smtp_password: tu contraseña de aplicación de Google (16 caracteres)');
  console.log('   - store_email: el email que aparecerá como remitente\n');
  console.log('💡 Para obtener una contraseña de aplicación:');
  console.log('   1. Ve a https://myaccount.google.com/apppasswords');
  console.log('   2. Selecciona "Correo" y tu dispositivo');
  console.log('   3. Copia la contraseña de 16 caracteres');
  console.log('   4. Pégala en smtp_password (sin espacios)\n');
  process.exit(1);
}

configureEmail();
