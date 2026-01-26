const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prosper_pos'
  });

  // Ver estructura de units
  const [units] = await conn.query('SELECT * FROM units LIMIT 5');
  console.log('📦 Unidades disponibles:');
  console.log(JSON.stringify(units, null, 2));

  // Obtener producto con su unidad
  const [products] = await conn.query(`
    SELECT p.id, p.name, p.unit_id, u.name as unit_name, u.symbol
    FROM products p
    LEFT JOIN units u ON p.unit_id = u.id
    LIMIT 5
  `);
  console.log('\n📦 Productos con unidades:');
  console.log(JSON.stringify(products, null, 2));

  await conn.end();
})();
