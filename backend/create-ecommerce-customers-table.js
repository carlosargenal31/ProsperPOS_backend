const { getConnection } = require('./src/utils/database');

async function createEcommerceCustomersTable() {
  let connection;

  try {
    console.log('Creando tabla ecommerce_customers...');

    connection = await getConnection();

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ecommerce_customers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20),
        password VARCHAR(255) NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✓ Tabla ecommerce_customers creada exitosamente');

    if (connection) connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Error al crear la tabla:', error);
    if (connection) connection.release();
    process.exit(1);
  }
}

createEcommerceCustomersTable();
