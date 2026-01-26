require('dotenv').config();
const mysql = require('mysql2/promise');

async function testJsonStorage() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosperpos'
    });

    console.log('✅ Conectado a la base de datos');

    // Insertar datos de prueba
    const testCoupons = [
      { code: 'TEST10', name: 'Test 10%', amount: 50.00 }
    ];

    console.log('\n📤 Datos a insertar:');
    console.log('testCoupons:', testCoupons);
    console.log('JSON.stringify(testCoupons):', JSON.stringify(testCoupons));

    const [insertResult] = await connection.query(`
      INSERT INTO quotes (
        quote_number, customer_name, branch_id, warehouse_id,
        subtotal, discount, tax, total, applied_coupons, quote_date, valid_until, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), ?)
    `, [
      'JSON-TEST-' + Date.now(),
      'Test Cliente',
      1, 1, 1000, 50, 142.5, 1092.5,
      JSON.stringify(testCoupons),
      1
    ]);

    const quoteId = insertResult.insertId;
    console.log(`\n✅ Cotización creada con ID: ${quoteId}`);

    // Recuperar con query normal
    console.log('\n📥 Recuperando datos...');
    const [quotes] = await connection.query(`
      SELECT applied_coupons FROM quotes WHERE id = ?
    `, [quoteId]);

    console.log('\nDatos recuperados:');
    console.log('Tipo de applied_coupons:', typeof quotes[0].applied_coupons);
    console.log('Valor:', quotes[0].applied_coupons);

    // Si ya es un objeto, no necesitamos parsear
    if (typeof quotes[0].applied_coupons === 'object') {
      console.log('\n✅ MySQL devuelve el JSON ya parseado como objeto');
      console.log('Contenido:', quotes[0].applied_coupons);
    } else if (typeof quotes[0].applied_coupons === 'string') {
      console.log('\n⚠️ MySQL devuelve el JSON como string');
      const parsed = JSON.parse(quotes[0].applied_coupons);
      console.log('Parseado:', parsed);
    }

    // Limpiar
    await connection.query('DELETE FROM quotes WHERE id = ?', [quoteId]);
    console.log('\n🧹 Datos de prueba eliminados');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testJsonStorage();
