const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prosper_pos'
  });

  // Desactivar todas las resoluciones excepto la 6
  await conn.query('UPDATE resolutions SET is_active = 0 WHERE id != 6');

  // Activar solo la resolución 6
  await conn.query('UPDATE resolutions SET is_active = 1 WHERE id = 6');

  console.log('✅ Solo resolución 6 está activa ahora');

  // Verificar
  const [rows] = await conn.query('SELECT id, numero_resolucion, cai, is_active FROM resolutions');
  console.log('\nResoluciones:');
  rows.forEach(r => {
    console.log(`ID: ${r.id}, CAI: ${r.cai}, numero_resolucion: ${r.numero_resolucion}, activa: ${r.is_active}`);
  });

  await conn.end();
})();
