const nodemailer = require('nodemailer');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testSMTPConnection() {
  console.log('🔌 PROBANDO CONEXIÓN SMTP DIRECTA\n');

  try {
    // Get SMTP config from database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosperpos'
    });

    const [settings] = await connection.query("SELECT setting_key, setting_value FROM ecommerce_settings WHERE setting_key IN ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_password')");

    const config = {};
    settings.forEach(s => {
      config[s.setting_key] = s.setting_value;
    });

    await connection.end();

    console.log('📋 Configuración SMTP:');
    console.log(`   Host: ${config.smtp_host}`);
    console.log(`   Port: ${config.smtp_port}`);
    console.log(`   User: ${config.smtp_user}`);
    console.log(`   Pass: ${config.smtp_password ? '*'.repeat(config.smtp_password.length) : '(vacío)'}`);
    console.log(`   Pass length: ${config.smtp_password.length}\n`);

    console.log('1️⃣ Creando transporter...');
    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: parseInt(config.smtp_port),
      secure: false, // true for 465, false for other ports
      auth: {
        user: config.smtp_user,
        pass: config.smtp_password
      },
      debug: true, // Enable debug output
      logger: true // Enable logger
    });

    console.log('✅ Transporter creado\n');

    console.log('2️⃣ Verificando conexión...');
    await transporter.verify();
    console.log('✅ ¡Conexión SMTP exitosa!\n');

    console.log('3️⃣ Enviando email de prueba...');
    const info = await transporter.sendMail({
      from: config.smtp_user,
      to: config.smtp_user,
      subject: 'Prueba de SMTP - ProsperPOS',
      text: '¡La configuración SMTP funciona correctamente!',
      html: '<h1>✅ ¡Funciona!</h1><p>La configuración SMTP está correcta.</p>'
    });

    console.log('✅ ¡Email enviado exitosamente!');
    console.log(`📧 Message ID: ${info.messageId}\n`);
    console.log('🎉 TODO FUNCIONA CORRECTAMENTE!\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\n📋 Detalles del error:');
    console.error(`   Code: ${error.code}`);
    console.error(`   Response: ${error.response || 'N/A'}`);
    console.error(`   Command: ${error.command || 'N/A'}\n`);

    if (error.code === 'EAUTH') {
      console.log('💡 SOLUCIÓN:');
      console.log('   La contraseña de aplicación no es válida.');
      console.log('   Por favor:');
      console.log('   1. Ve a https://myaccount.google.com/apppasswords');
      console.log('   2. ELIMINA la contraseña de aplicación anterior (ProsperPOS)');
      console.log('   3. CREA UNA NUEVA contraseña de aplicación');
      console.log('   4. Copia la nueva contraseña de 16 caracteres');
      console.log('   5. Ejecuta: node apply-email-config.js con la nueva contraseña\n');
    }
  }
}

testSMTPConnection();
