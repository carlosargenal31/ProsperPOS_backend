const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupEmailConfig() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prosperpos'
  });

  try {
    console.log('📧 CONFIGURACIÓN DE EMAIL PARA OPINIONES\n');

    // 1. Verificar configuración actual
    console.log('1️⃣ Verificando configuración actual en la base de datos...');
    const [currentConfig] = await connection.query(`
      SELECT setting_key, setting_value
      FROM ecommerce_settings
      WHERE setting_key IN ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'store_email')
    `);

    console.log('\n📋 Configuración actual:');
    if (currentConfig.length === 0) {
      console.log('⚠️  No hay configuración SMTP en la base de datos');
    } else {
      currentConfig.forEach(setting => {
        if (setting.setting_key === 'smtp_password') {
          console.log(`   ${setting.setting_key}: ${'*'.repeat(setting.setting_value?.length || 0)}`);
        } else {
          console.log(`   ${setting.setting_key}: ${setting.setting_value || '(vacío)'}`);
        }
      });
    }

    console.log('\n\n🔧 OPCIONES DE CONFIGURACIÓN:\n');
    console.log('Opción 1: GMAIL (Recomendado)');
    console.log('   - Necesitas una cuenta de Gmail');
    console.log('   - Debes crear una "Contraseña de aplicación" en tu cuenta Google');
    console.log('   - Tutorial: https://support.google.com/accounts/answer/185833\n');

    console.log('Opción 2: Otro proveedor SMTP');
    console.log('   - Necesitas las credenciales SMTP de tu proveedor\n');

    console.log('Opción 3: Deshabilitar emails (solo guardar respuestas)');
    console.log('   - Las respuestas se guardarán pero NO se enviarán emails\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📝 PARA CONFIGURAR GMAIL:');
    console.log('\n1. Ve a https://myaccount.google.com/security');
    console.log('2. Activa la verificación en 2 pasos');
    console.log('3. Ve a "Contraseñas de aplicaciones"');
    console.log('4. Genera una contraseña para "Correo"');
    console.log('5. Usa esa contraseña de 16 caracteres aquí\n');

    console.log('📝 EJECUTA ESTE COMANDO para configurar:');
    console.log('\nnode setup-email-config.js --configure\n');

    console.log('O edita la tabla ecommerce_settings manualmente:');
    console.log(`
UPDATE ecommerce_settings SET setting_value = 'smtp.gmail.com' WHERE setting_key = 'smtp_host';
UPDATE ecommerce_settings SET setting_value = '587' WHERE setting_key = 'smtp_port';
UPDATE ecommerce_settings SET setting_value = 'tu_email@gmail.com' WHERE setting_key = 'smtp_user';
UPDATE ecommerce_settings SET setting_value = 'tu_contraseña_de_app' WHERE setting_key = 'smtp_password';
UPDATE ecommerce_settings SET setting_value = 'tu_email@gmail.com' WHERE setting_key = 'store_email';
    `);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Si se pasó --test, probar el envío
    if (process.argv.includes('--test')) {
      console.log('\n🧪 PROBANDO ENVÍO DE EMAIL...\n');

      const EmailService = require('./src/services/email.service');

      const testResult = await EmailService.sendOpinionResponse({
        customer_name: 'Carlos Mauricio',
        customer_email: 'gamaboy3101@gmail.com',
        inquiry_type: 'Solicitud de cotización',
        original_message: 'Prueba de envío de email desde el sistema de opiniones',
        admin_response: 'Esta es una prueba de respuesta automática. Si recibes este email, la configuración está correcta.'
      });

      if (testResult.success) {
        console.log('✅ Email enviado exitosamente!');
        console.log('Message ID:', testResult.message_id);
        console.log('\nRevisa el correo gamaboy3101@gmail.com');
      } else {
        console.log('❌ Error al enviar email:', testResult.message || testResult.error);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

setupEmailConfig();
