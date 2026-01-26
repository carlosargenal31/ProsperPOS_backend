const mysql = require('mysql2/promise');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function updateEmailPassword() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('   ACTUALIZAR CONTRASEÑA DE APLICACIÓN DE GMAIL');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('🔐 PASO 1: Obtén una nueva contraseña de aplicación\n');
  console.log('   1. Ve a: https://myaccount.google.com/apppasswords');
  console.log('   2. Elimina la contraseña anterior si existe');
  console.log('   3. Haz clic en "Crear"');
  console.log('   4. Nombre: ProsperPOS');
  console.log('   5. Copia la contraseña de 16 caracteres\n');

  console.log('⚠️  IMPORTANTE: La contraseña tiene este formato:');
  console.log('   xxxx xxxx xxxx xxxx');
  console.log('   (4 grupos de 4 letras separados por espacios)\n');

  const password = await question('✏️  Pega aquí la contraseña (con o sin espacios): ');

  // Remove all spaces
  const cleanPassword = password.replace(/\s+/g, '');

  console.log(`\n📋 Contraseña ingresada: "${password}"`);
  console.log(`📋 Contraseña limpia: "${cleanPassword}"`);
  console.log(`📋 Longitud: ${cleanPassword.length} caracteres\n`);

  if (cleanPassword.length !== 16) {
    console.log('❌ ERROR: La contraseña debe tener exactamente 16 caracteres.');
    console.log(`   Tiene: ${cleanPassword.length} caracteres\n`);
    rl.close();
    return;
  }

  const confirm = await question('¿Actualizar la contraseña en la base de datos? (s/n): ');

  if (confirm.toLowerCase() !== 's') {
    console.log('\n❌ Operación cancelada\n');
    rl.close();
    return;
  }

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosperpos'
    });

    await connection.query(
      'UPDATE ecommerce_settings SET setting_value = ? WHERE setting_key = ?',
      [cleanPassword, 'smtp_password']
    );

    await connection.end();

    console.log('\n✅ Contraseña actualizada exitosamente!\n');
    console.log('🧪 Probando conexión SMTP...\n');

    // Test the connection
    const nodemailer = require('nodemailer');

    const [configRows] = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosperpos'
    }).then(conn => {
      return conn.query("SELECT setting_key, setting_value FROM ecommerce_settings WHERE setting_key IN ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_password')");
    });

    const config = {};
    configRows.forEach(s => {
      config[s.setting_key] = s.setting_value;
    });

    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: parseInt(config.smtp_port),
      secure: false,
      auth: {
        user: config.smtp_user,
        pass: config.smtp_password
      }
    });

    await transporter.verify();
    console.log('✅ ¡Conexión SMTP verificada exitosamente!\n');

    console.log('📧 Enviando email de prueba a', config.smtp_user, '...');

    const info = await transporter.sendMail({
      from: config.smtp_user,
      to: config.smtp_user,
      subject: '✅ Configuración SMTP Exitosa - ProsperPOS',
      text: '¡Felicidades! La configuración de email está funcionando correctamente. Ahora puedes enviar respuestas a las opiniones de tus clientes y ellos recibirán emails automáticamente.',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f0f0f0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
            .content { padding: 30px; }
            .success-icon { font-size: 64px; margin-bottom: 20px; }
            h1 { margin: 0; font-size: 24px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">✅</div>
              <h1>Configuración SMTP Exitosa</h1>
            </div>
            <div class="content">
              <h2>¡Felicidades!</h2>
              <p>La configuración de email para ProsperPOS está funcionando correctamente.</p>
              <p>A partir de ahora:</p>
              <ul>
                <li>✉️ Puedes responder opiniones de clientes</li>
                <li>📧 Los clientes recibirán emails automáticamente</li>
                <li>🎉 El sistema está completamente funcional</li>
              </ul>
              <p><strong>Este email es una prueba del sistema.</strong></p>
            </div>
            <div class="footer">
              ProsperPOS - Sistema de Gestión
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log('✅ ¡Email de prueba enviado exitosamente!');
    console.log(`📬 Message ID: ${info.messageId}\n`);
    console.log('🎉 ¡TODO CONFIGURADO CORRECTAMENTE!\n');
    console.log('💡 Ahora puedes responder opiniones desde el panel de administración');
    console.log('   y los clientes recibirán tus respuestas por email.\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);

    if (error.code === 'EAUTH') {
      console.log('\n⚠️  La contraseña sigue sin funcionar.');
      console.log('   Por favor verifica que:');
      console.log('   1. Copiaste la contraseña completa (16 caracteres)');
      console.log('   2. La verificación en 2 pasos está activada en tu cuenta Gmail');
      console.log('   3. La contraseña de aplicación fue creada recientemente\n');
    }
  } finally {
    rl.close();
  }
}

updateEmailPassword();
