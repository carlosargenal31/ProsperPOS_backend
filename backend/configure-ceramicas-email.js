const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración con la cuenta de Cerámicas Universal
const EMAIL_CONFIG = {
  smtp_host: 'smtp.gmail.com',
  smtp_port: '587',
  smtp_user: 'ceramicasuniversal504@gmail.com',
  smtp_password: 'xojlwljzjaigepxe', // Contraseña sin espacios
  store_email: 'ceramicasuniversal504@gmail.com'
};

async function configureEmail() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('   CONFIGURANDO EMAIL DE CERÁMICAS UNIVERSAL');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosperpos'
    });

    console.log('📧 Configuración a aplicar:');
    console.log(`   Email: ${EMAIL_CONFIG.smtp_user}`);
    console.log(`   Host: ${EMAIL_CONFIG.smtp_host}`);
    console.log(`   Port: ${EMAIL_CONFIG.smtp_port}`);
    console.log(`   Pass: ${'*'.repeat(16)}\n`);

    console.log('💾 Actualizando configuración en base de datos...\n');

    for (const [key, value] of Object.entries(EMAIL_CONFIG)) {
      const [existing] = await connection.query(
        'SELECT * FROM ecommerce_settings WHERE setting_key = ?',
        [key]
      );

      if (existing.length > 0) {
        await connection.query(
          'UPDATE ecommerce_settings SET setting_value = ? WHERE setting_key = ?',
          [value, key]
        );
        console.log(`   ✅ Actualizado: ${key}`);
      } else {
        await connection.query(
          'INSERT INTO ecommerce_settings (setting_key, setting_value) VALUES (?, ?)',
          [key, value]
        );
        console.log(`   ✅ Creado: ${key}`);
      }
    }

    await connection.end();

    console.log('\n✅ Configuración guardada en base de datos\n');

    // Probar conexión SMTP
    console.log('🧪 PROBANDO CONEXIÓN SMTP...\n');

    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      host: EMAIL_CONFIG.smtp_host,
      port: parseInt(EMAIL_CONFIG.smtp_port),
      secure: false,
      auth: {
        user: EMAIL_CONFIG.smtp_user,
        pass: EMAIL_CONFIG.smtp_password
      }
    });

    console.log('🔌 Verificando conexión con Gmail...');
    await transporter.verify();
    console.log('✅ ¡Conexión SMTP verificada exitosamente!\n');

    console.log('📨 Enviando email de prueba...');

    const info = await transporter.sendMail({
      from: `"Cerámicas Universal" <${EMAIL_CONFIG.smtp_user}>`,
      to: EMAIL_CONFIG.smtp_user,
      subject: '✅ Sistema de Email Configurado - ProsperPOS',
      text: '¡Felicidades! El sistema de emails está funcionando correctamente con la cuenta de Cerámicas Universal.',
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 50px 20px; text-align: center; }
    .logo { font-size: 48px; margin-bottom: 20px; }
    h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .content { padding: 40px 30px; }
    .success-box { background: #dcfce7; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .info-box { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .feature { display: flex; align-items: center; margin: 15px 0; }
    .feature-icon { font-size: 24px; margin-right: 15px; }
    .footer { background: #1e293b; color: white; padding: 25px; text-align: center; }
    .email-address { color: #3b82f6; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🏢</div>
      <h1>Cerámicas Universal</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 18px;">Sistema de Email Configurado</p>
    </div>

    <div class="content">
      <div class="success-box">
        <h2 style="margin: 0 0 10px 0; color: #16a34a;">✅ ¡Configuración Exitosa!</h2>
        <p style="margin: 0; color: #166534;">El sistema de envío de emails ha sido configurado correctamente.</p>
      </div>

      <h3 style="color: #1e293b;">Email Configurado:</h3>
      <p class="email-address">${EMAIL_CONFIG.smtp_user}</p>

      <h3 style="color: #1e293b; margin-top: 30px;">Funcionalidades Activas:</h3>

      <div class="feature">
        <span class="feature-icon">✉️</span>
        <div>
          <strong>Respuestas a Opiniones</strong><br>
          <span style="color: #64748b; font-size: 14px;">Los clientes recibirán emails cuando respondas a sus consultas</span>
        </div>
      </div>

      <div class="feature">
        <span class="feature-icon">📧</span>
        <div>
          <strong>Notificaciones de Pedidos</strong><br>
          <span style="color: #64748b; font-size: 14px;">Recibirás notificaciones de nuevos pedidos en línea</span>
        </div>
      </div>

      <div class="feature">
        <span class="feature-icon">🎯</span>
        <div>
          <strong>Email Profesional</strong><br>
          <span style="color: #64748b; font-size: 14px;">Los emails se enviarán desde ceramicasuniversal504@gmail.com</span>
        </div>
      </div>

      <div class="info-box">
        <h3 style="margin: 0 0 10px 0; color: #1e40af;">💡 Próximos Pasos</h3>
        <p style="margin: 0; color: #1e3a8a;">
          Ya puedes empezar a responder opiniones de clientes desde el panel de administración.
          Cada respuesta se enviará automáticamente al email del cliente.
        </p>
      </div>

      <p style="text-align: center; margin-top: 40px;">
        <strong style="color: #3b82f6; font-size: 20px;">🎉 ¡Sistema Completamente Operativo!</strong>
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0; font-size: 18px; font-weight: bold;">Cerámicas Universal</p>
      <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.8;">ProsperPOS - Sistema de Gestión</p>
    </div>
  </div>
</body>
</html>
      `
    });

    console.log('✅ ¡Email de prueba enviado exitosamente!\n');
    console.log(`📬 Message ID: ${info.messageId}`);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('   🎉 ¡TODO CONFIGURADO CORRECTAMENTE!');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('✅ Email configurado: ceramicasuniversal504@gmail.com');
    console.log('✅ Revisa tu bandeja de entrada');
    console.log('✅ El sistema está listo para enviar emails a clientes\n');

    console.log('💡 Ahora cuando respondas opiniones:');
    console.log('   1. Ve a: http://localhost:8080/tienda-online/opiniones');
    console.log('   2. Haz clic en una opinión');
    console.log('   3. Escribe tu respuesta');
    console.log('   4. El cliente recibirá un email automáticamente\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);

    if (error.code === 'EAUTH') {
      console.log('\n⚠️  Error de autenticación.');
      console.log('   Verifica que la contraseña de aplicación sea correcta.');
      console.log('   Contraseña actual:', EMAIL_CONFIG.smtp_password);
    } else {
      console.error('\n📋 Stack:', error.stack);
    }
  }
}

configureEmail();
