// ===================================================================
// PROSPERPOS - MIGRACIÓN: TABLA DE OPINIONES DE CLIENTES
// ===================================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

async function createCustomerOpinionsTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prosperpos'
  });

  try {
    console.log('🔄 Creando tabla customer_opinions...');

    // Crear tabla de opiniones
    await connection.query(`
      CREATE TABLE IF NOT EXISTS customer_opinions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        lastname VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        inquiry_type VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        status ENUM('pendiente', 'respondido') DEFAULT 'pendiente',
        admin_response TEXT NULL,
        admin_user_id INT NULL,
        responded_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_email (email),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Tabla customer_opinions creada exitosamente');

    // Verificar la estructura
    const [columns] = await connection.query('DESCRIBE customer_opinions');
    console.log('\n📊 Estructura de la tabla:');
    console.table(columns);

  } catch (error) {
    console.error('❌ Error creando tabla:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Ejecutar migración
createCustomerOpinionsTable()
  .then(() => {
    console.log('\n✅ Migración completada exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en la migración:', error);
    process.exit(1);
  });
