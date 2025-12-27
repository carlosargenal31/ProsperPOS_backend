// ===================================================================
// MIGRACIÓN: Crear tabla product_images para galería
// ===================================================================

require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔄 Creando tabla product_images...\n');

    // Crear tabla product_images
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS product_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        image_order INT DEFAULT 0,
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,

        INDEX idx_product_id (product_id),
        INDEX idx_is_primary (is_primary),
        INDEX idx_deleted_at (deleted_at),

        CONSTRAINT fk_product_images_product_id
          FOREIGN KEY (product_id) REFERENCES products(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Tabla product_images creada exitosamente\n');

    // Verificar estructura
    console.log('📊 Verificando estructura de la tabla...');
    const [columns] = await connection.execute(`SHOW COLUMNS FROM product_images`);

    console.log('Columnas creadas:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    console.log('');

    console.log('✅ Migración completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Ejecutar migración
migrate()
  .then(() => {
    console.log('\n🎉 Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
