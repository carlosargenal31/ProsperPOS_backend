const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  let connection;

  try {
    // Conectar a MySQL
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '310104',
      database: 'prosperpos',
      multipleStatements: true
    });

    console.log('✓ Conectado a la base de datos');

    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, 'database', 'create-ecommerce-tables.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('✓ Archivo SQL leído');

    // Ejecutar las migraciones
    await connection.query(sql);

    console.log('✓ Migraciones aplicadas exitosamente');

    // Verificar tablas creadas
    const [tables] = await connection.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = 'prosperpos'
      AND (
        TABLE_NAME LIKE 'web_%'
        OR TABLE_NAME = 'shopping_cart'
        OR TABLE_NAME = 'customer_addresses'
        OR TABLE_NAME = 'customer_favorites'
        OR TABLE_NAME = 'ecommerce_settings'
        OR TABLE_NAME = 'banners'
      )
      ORDER BY TABLE_NAME
    `);

    console.log('\n✓ Tablas creadas:');
    tables.forEach(row => {
      console.log('  -', row.TABLE_NAME);
    });

    // Verificar configuración insertada
    const [settings] = await connection.query('SELECT * FROM ecommerce_settings');
    console.log(`\n✓ Configuración insertada: ${settings.length} registros`);

    console.log('\n🎉 Migración completada exitosamente!');

  } catch (error) {
    console.error('❌ Error aplicando migración:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

applyMigration();
