require('dotenv').config();
const mysql = require('mysql2/promise');

async function testQuery() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prosperpos'
  });

  try {
    console.log('=== TEST 1: Verificar bodegas ===');
    const [warehouses] = await connection.execute(
      'SELECT id, nombre, deleted_at, is_active FROM warehouses'
    );
    console.log('Bodegas en la BD:');
    console.log(JSON.stringify(warehouses, null, 2));
    console.log(`Total bodegas: ${warehouses.length}`);

    console.log('\n=== TEST 2: Verificar bodegas activas (deleted_at IS NULL) ===');
    const [activeWarehouses] = await connection.execute(
      'SELECT id, nombre, deleted_at, is_active FROM warehouses WHERE deleted_at IS NULL'
    );
    console.log('Bodegas activas:');
    console.log(JSON.stringify(activeWarehouses, null, 2));
    console.log(`Total bodegas activas: ${activeWarehouses.length}`);

    console.log('\n=== TEST 3: Verificar stock del producto 1017 ===');
    const [stock] = await connection.execute(
      'SELECT * FROM stock WHERE product_id = 1017'
    );
    console.log('Stock del producto 1017:');
    console.log(JSON.stringify(stock, null, 2));

    console.log('\n=== TEST 4: Query CROSS JOIN (la query actual) ===');
    const query = `
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.code as product_code,
        w.id as warehouse_id,
        w.nombre as warehouse_name,
        COALESCE(s.quantity, 0) as quantity,
        COALESCE(p.min_stock, 0) as min_stock,
        COALESCE(p.max_stock, 1000) as max_stock
      FROM products p
      CROSS JOIN warehouses w
      LEFT JOIN stock s ON p.id = s.product_id AND s.warehouse_id = w.id
      WHERE p.deleted_at IS NULL AND p.id = ? AND w.deleted_at IS NULL
      ORDER BY p.name, w.nombre
      LIMIT ? OFFSET ?
    `;
    const [result] = await connection.query(query, [1017, 20, 0]);
    console.log('Resultado de la query CROSS JOIN:');
    console.log(JSON.stringify(result, null, 2));
    console.log(`Total filas devueltas: ${result.length}`);
    console.log(`result es un array: ${Array.isArray(result)}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

testQuery();
