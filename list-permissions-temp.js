const mysql = require('mysql2/promise');
require('dotenv').config();

async function listAllPermissions() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prosperpos'
  });
  
  const [perms] = await conn.execute('SELECT id, slug, module, name FROM permissions ORDER BY module, slug');
  
  console.log('=== Todos los permisos ===\n');
  let currentModule = '';
  perms.forEach(p => {
    if (p.module !== currentModule) {
      currentModule = p.module;
      console.log('\n[' + currentModule + ']');
    }
    console.log('  ', p.id.toString().padStart(3), '-', p.slug.padEnd(40), p.name);
  });
  
  await conn.end();
}

listAllPermissions();
