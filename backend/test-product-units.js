const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prosper_pos'
  });

  // Obtener producto con su unidad
  const [products] = await conn.query(`
    SELECT p.id, p.name, p.unit_id, u.name as unit_name, u.symbol
    FROM products p
    LEFT JOIN measuring_units u ON p.unit_id = u.id
    LIMIT 5
  `);
  console.log('📦 Productos con unidades:');
  console.log(JSON.stringify(products, null, 2));

  await conn.end();
})();
