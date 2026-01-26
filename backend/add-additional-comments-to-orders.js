const mysql = require('mysql2/promise');

async function addAdditionalCommentsToOrders() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '310104',
    database: 'prosperpos'
  });

  try {
    console.log('Agregando columna additional_comments a tabla orders...');

    // Verificar si la columna ya existe
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'prosperpos'
      AND TABLE_NAME = 'orders'
      AND COLUMN_NAME = 'additional_comments'
    `);

    if (columns.length === 0) {
      await connection.query(`
        ALTER TABLE orders
        ADD COLUMN additional_comments TEXT NULL
        AFTER notes
      `);
      console.log('✓ Columna additional_comments agregada');
    } else {
      console.log('✓ Columna additional_comments ya existe');
    }

    console.log('\n¡Campo agregado exitosamente!');

  } catch (error) {
    console.error('Error al agregar campo:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

addAdditionalCommentsToOrders();
