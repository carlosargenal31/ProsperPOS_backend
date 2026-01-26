const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSMTPConfig() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prosperpos'
  });

  const [settings] = await connection.query("SELECT setting_key, setting_value FROM ecommerce_settings WHERE setting_key IN ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'store_email')");

  console.log('\n📧 Configuración SMTP en base de datos:\n');
  settings.forEach(s => {
    if (s.setting_key === 'smtp_password') {
      console.log(`${s.setting_key}:`);
      console.log(`  Valor: "${s.setting_value}"`);
      console.log(`  Longitud: ${s.setting_value.length}`);
      console.log(`  Tiene espacios: ${s.setting_value.includes(' ') ? 'SI ⚠️' : 'NO ✓'}`);
    } else {
      console.log(`${s.setting_key}: ${s.setting_value}`);
    }
  });

  await connection.end();
}

checkSMTPConfig().catch(console.error);
