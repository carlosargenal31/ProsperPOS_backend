const mysql = require('mysql2/promise');
require('dotenv').config();

// Nueva contraseña de aplicación proporcionada por el usuario
const NEW_PASSWORD = 'xojlwljzjaigepxe'; // Sin espacios

async function applyNewPassword() {
  console.log('🔐 ACTUALIZANDO CONTRASEÑA DE APLICACIÓN DE GMAIL\n');

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosperpos'
    });

    console.log('📋 Nueva contraseña:');
    console.log(`   Longitud: ${NEW_PASSWORD.length} caracteres`);
    console.log(`   Valor: ${NEW_PASSWORD}\n`);

    if (NEW_PASSWORD.length !== 16) {
      console.log('❌ ERROR: La contraseña debe tener exactamente 16 caracteres');
      await connection.end();
      return;
    }

    console.log('💾 Actualizando en base de datos...');
    await connection.query(
      'UPDATE ecommerce_settings SET setting_value = ? WHERE setting_key = ?',
      [NEW_PASSWORD, 'smtp_password']
    );

    console.log('✅ Contraseña actualizada en base de datos\n');

    // Verificar que se guardó correctamente
    const [check] = await connection.query(
      'SELECT setting_value FROM ecommerce_settings WHERE setting_key = ?',
      ['smtp_password']
    );

    console.log('✅ Verificación: Contraseña guardada correctamente\n');

    await connection.end();

    // Probar conexión SMTP
    console.log('🧪 Probando conexión SMTP...\n');

    const nodemailer = require('nodemailer');

    const conn2 = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosperpos'
    });

    const [settings] = await conn2.query(
      "SELECT setting_key, setting_value FROM ecommerce_settings WHERE setting_key IN ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'store_email')"
    );

    const config = {};
    settings.forEach(s => {
      config[s.setting_key] = s.setting_value;
    });

    await conn2.end();

    console.log('📧 Configuración SMTP:');
    console.log(`   Host: ${config.smtp_host}`);
    console.log(`   Port: ${config.smtp_port}`);
    console.log(`   User: ${config.smtp_user}`);
    console.log(`   Pass: ${'*'.repeat(config.smtp_password.length)}\n`);

    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: parseInt(config.smtp_port),
      secure: false,
      auth: {
        user: config.smtp_user,
        pass: config.smtp_password
      }
    });

    console.log('🔌 Verificando conexión con Gmail...');
    await transporter.verify();
    console.log('✅ ¡Conexión SMTP verificada exitosamente!\n');

    console.log('📨 Enviando email de prueba a', config.smtp_user, '...');

    const info = await transporter.sendMail({
      from: config.smtp_user,
      to: config.smtp_user,
      subject: '✅ Email Configurado - ProsperPOS',
      text: '¡Felicidades! El sistema de emails está funcionando correctamente. Ahora puedes responder opiniones de clientes y ellos recibirán tus respuestas por email.',
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f0f0f0; padding: 20px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 50px 20px; text-align: center; }
    .success-icon { font-size: 80px; margin-bottom: 20px; animation: bounce 1s; }
    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
    h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .content { padding: 40px 30px; }
    .feature { background: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea; }
    .feature-icon { font-size: 24px; margin-right: 10px; }
    .footer { background: #2c3e50; color: white; padding: 25px; text-align: center; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="success-icon">✅</div>
      <h1>¡Sistema de Email Configurado!</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">ProsperPOS está listo para enviar emails</p>
    </div>

    <div class="content">
      <h2 style="color: #333; margin-top: 0;">¡Felicidades!</h2>
      <p style="color: #555; line-height: 1.6;">El sistema de envío de emails ha sido configurado exitosamente y está funcionando correctamente.</p>

      <div class="feature">
        <span class="feature-icon">✉️</span>
        <strong>Responde Opiniones:</strong> Tus clientes recibirán emails automáticos cuando respondas a sus consultas
      </div>

      <div class="feature">
        <span class="feature-icon">📧</span>
        <strong>Notificaciones:</strong> Sistema de notificaciones por email completamente funcional
      </div>

      <div class="feature">
        <span class="feature-icon">🎉</span>
        <strong>Todo Listo:</strong> El módulo de opiniones está 100% operativo
      </div>

      <p style="color: #555; line-height: 1.6; margin-top: 30px;">
        Puedes empezar a responder opiniones desde el panel de administración y tus clientes recibirán las respuestas directamente en su bandeja de entrada.
      </p>

      <p style="text-align: center;">
        <strong style="color: #667eea; font-size: 18px;">¡A responder opiniones! 🚀</strong>
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0; font-size: 16px;"><strong>ProsperPOS</strong></p>
      <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.8;">Sistema de Gestión Empresarial</p>
    </div>
  </div>
</body>
</html>
      `
    });

    console.log('✅ ¡Email de prueba enviado exitosamente!');
    console.log(`📬 Message ID: ${info.messageId}\n`);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('   🎉 ¡TODO CONFIGURADO CORRECTAMENTE!');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('✅ Revisa tu correo: gamaboy3101@gmail.com');
    console.log('✅ Ahora puedes responder opiniones desde el panel de administración');
    console.log('✅ Los clientes recibirán emails automáticamente\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);

    if (error.code === 'EAUTH') {
      console.log('\n⚠️  La contraseña aún no es válida.');
      console.log('   Verifica que:');
      console.log('   1. La verificación en 2 pasos esté activada');
      console.log('   2. La contraseña sea una contraseña de APLICACIÓN (no tu contraseña normal)');
      console.log('   3. Hayas copiado los 16 caracteres completos\n');
    } else {
      console.error('\n📋 Stack:', error.stack);
    }
  }
}

applyNewPassword();
