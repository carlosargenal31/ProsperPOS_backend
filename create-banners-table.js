const mysql = require('mysql2/promise');
require('dotenv').config();

async function createBannersTable() {
  let connection;

  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosperpos'
    });

    console.log('Conectado a la base de datos');

    // Create banners table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS banners (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(100),
        subtitle VARCHAR(200),
        button_text VARCHAR(50),
        button_link VARCHAR(255) DEFAULT '/shop/catalog',
        image_url TEXT,
        is_active TINYINT(1) DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    await connection.execute(createTableSQL);
    console.log('✓ Tabla banners creada o ya existe');

    // Insert default 3 banner records if table is empty
    const [existing] = await connection.execute('SELECT COUNT(*) as count FROM banners');

    if (existing[0].count === 0) {
      const insertSQL = `
        INSERT INTO banners (id, title, subtitle, button_text, button_link, sort_order)
        VALUES
          (1, '', '', '', '/shop/catalog', 1),
          (2, '', '', '', '/shop/catalog', 2),
          (3, '', '', '', '/shop/catalog', 3)
      `;

      await connection.execute(insertSQL);
      console.log('✓ Registros iniciales de banners creados (3 slots)');
    } else {
      console.log(`✓ Ya existen ${existing[0].count} registros de banners`);
    }

    console.log('\n✅ Migración completada exitosamente');

  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createBannersTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
