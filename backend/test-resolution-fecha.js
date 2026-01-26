const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prosper_pos'
  });

  // Verificar configuración de fecha_fin en resolución 6
  const [res] = await conn.query('SELECT id, cai, numero_resolucion, fecha_fin, is_active FROM resolutions WHERE id = 6');
  console.log('\n📋 Resolución 6 en BD:');
  console.log(JSON.stringify(res[0], null, 2));

  // Simular lo que devuelve el endpoint
  const fecha_fin = res[0].fecha_fin;
  const d = new Date(fecha_fin);
  console.log('\n🔍 Procesamiento de fecha:');
  console.log('fecha_fin en BD:', fecha_fin);
  console.log('getUTCDate() original:', d.getUTCDate());
  d.setUTCDate(d.getUTCDate() + 1);
  console.log('getUTCDate() + 1:', d.getUTCDate());
  const formatted = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
  console.log('Fecha formateada para frontend:', formatted);

  // Cómo el frontend lo mostrará
  const [year, month, day] = formatted.split('-');
  const display = `${day}/${month}/${year}`;
  console.log('Fecha mostrada en frontend:', display);
  console.log('\n✅ Si sale 28/12/2026, está correcto\n');

  await conn.end();
})();
