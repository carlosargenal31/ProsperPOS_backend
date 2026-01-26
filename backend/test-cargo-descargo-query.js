const mysql = require('mysql2/promise');
require('dotenv').config();

async function testQuery() {
  let connection;

  try {
    console.log('🔄 Conectando a la base de datos...');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosperpos'
    });

    console.log('✅ Conexión establecida');
    console.log('🚀 Ejecutando consulta de prueba...');

    const query = `
      SELECT
        cd.*,
        w.nombre as warehouse_name,
        w2.nombre as warehouse_to_name,
        CONCAT(IFNULL(u.first_name, ''), ' ', IFNULL(u.last_name, '')) as registered_by_name,
        IFNULL(COUNT(cdd.id), 0) as total_items,
        IFNULL(SUM(cdd.quantity), 0) as total_quantity
      FROM cargo_descargo cd
      LEFT JOIN warehouses w ON cd.warehouse_id = w.id
      LEFT JOIN warehouses w2 ON cd.warehouse_to_id = w2.id
      LEFT JOIN users u ON cd.registered_by = u.id
      LEFT JOIN cargo_descargo_details cdd ON cd.id = cdd.cargo_descargo_id
      WHERE 1=1
      GROUP BY cd.id
      ORDER BY cd.registration_date DESC, cd.created_at DESC
      LIMIT 20 OFFSET 0
    `;

    const [results] = await connection.query(query);

    console.log('✅ Consulta ejecutada exitosamente');
    console.log(`📊 Documentos encontrados: ${results.length}`);

    if (results.length > 0) {
      console.log('\n📄 Primer documento:');
      console.log(JSON.stringify(results[0], null, 2));
    } else {
      console.log('\nℹ️  No hay documentos de cargo/descargo en la base de datos.');
      console.log('   Esto es normal si acabas de crear las tablas.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nDetalles completos:');
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n👋 Conexión cerrada');
    }
  }
}

testQuery();
