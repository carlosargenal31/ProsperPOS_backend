const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración con tus datos
const EMAIL_CONFIG = {
  smtp_host: 'smtp.gmail.com',
  smtp_port: '587',
  smtp_user: 'gamaboy3101@gmail.com',
  smtp_password: 'dbpedtupeedmizyj', // Tu contraseña de aplicación
  store_email: 'gamaboy3101@gmail.com'
};

async function applyConfig() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prosperpos'
  });

  try {
    console.log('📧 Aplicando configuración de email...\n');

    for (const [key, value] of Object.entries(EMAIL_CONFIG)) {
      // Verificar si existe
      const [existing] = await connection.query(
        'SELECT * FROM ecommerce_settings WHERE setting_key = ?',
        [key]
      );

      if (existing.length > 0) {
        await connection.query(
          'UPDATE ecommerce_settings SET setting_value = ? WHERE setting_key = ?',
          [value, key]
        );
        console.log(`✅ Actualizado: ${key}`);
      } else {
        await connection.query(
          'INSERT INTO ecommerce_settings (setting_key, setting_value) VALUES (?, ?)',
          [key, value]
        );
        console.log(`✅ Creado: ${key}`);
      }
    }

    console.log('\n✅ Configuración guardada exitosamente!\n');

    // Verificar la configuración
    const [config] = await connection.query(`
      SELECT setting_key, setting_value
      FROM ecommerce_settings
      WHERE setting_key IN ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'store_email')
    `);

    console.log('📋 Configuración actual en la base de datos:');
    config.forEach(setting => {
      if (setting.setting_key === 'smtp_password') {
        console.log(`   ${setting.setting_key}: ${'*'.repeat(16)}`);
      } else {
        console.log(`   ${setting.setting_key}: ${setting.setting_value}`);
      }
    });

    console.log('\n🎉 Todo listo! Ahora cuando respondas una opinión, se enviará un email automáticamente.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

applyConfig();
