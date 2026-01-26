const mysql = require('mysql2/promise');

async function createOrderStatusHistory() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '310104',
    database: 'prosperpos'
  });

  try {
    console.log('Creando tabla de historial de cambios de estado...');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_status_history (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        previous_status ENUM('pendiente', 'cotizado', 'cobrado') NOT NULL,
        new_status ENUM('pendiente', 'cotizado', 'cobrado') NOT NULL,
        notes TEXT NULL COMMENT 'Notas del proceso/cambio',
        changed_by INT NOT NULL COMMENT 'Usuario que hizo el cambio',
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (changed_by) REFERENCES users(id),
        INDEX idx_order_id (order_id),
        INDEX idx_changed_at (changed_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✓ Tabla order_status_history creada');
    console.log('\n¡Tabla creada exitosamente!');

  } catch (error) {
    console.error('Error al crear la tabla:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

createOrderStatusHistory();
