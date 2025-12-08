// Test simple de conexión a MySQL
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '310104',
      database: 'prosperpos'
    });

    console.log('✅ Conexión exitosa a MySQL');

    // Verificar tabla consecutives
    const [tables] = await connection.query("SHOW TABLES LIKE 'consecutives'");
    console.log(`📋 Tabla consecutives ${tables.length > 0 ? 'EXISTE' : 'NO EXISTE'}`);

    if (tables.length > 0) {
      // Mostrar datos
      const [data] = await connection.query("SELECT * FROM consecutives");
      console.log('\n📊 Datos en la tabla:');
      console.table(data);
    } else {
      console.log('\n⚠️  Creando tabla...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS consecutives (
          id INT AUTO_INCREMENT PRIMARY KEY,
          document_type VARCHAR(50) NOT NULL UNIQUE,
          current_number INT NOT NULL DEFAULT 1,
          prefix VARCHAR(20) NULL,
          suffix VARCHAR(20) NULL,
          padding INT DEFAULT 10,
          description VARCHAR(255) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await connection.query(`
        INSERT INTO consecutives (document_type, current_number, prefix, padding, description)
        VALUES
          ('quote', 1, NULL, 10, 'Consecutivo para cotizaciones'),
          ('pending_invoice', 1, NULL, 10, 'Consecutivo para facturas en espera'),
          ('invoice', 31839, '000-002-01-', 8, 'Consecutivo para facturas')
      `);

      const [data] = await connection.query("SELECT * FROM consecutives");
      console.log('\n✅ Tabla creada y datos insertados:');
      console.table(data);
    }

    await connection.end();
    console.log('\n✅ TODO CORRECTO');
    process.exit(0);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

testConnection();
