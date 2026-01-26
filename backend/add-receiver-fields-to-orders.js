const mysql = require('mysql2/promise');

async function addReceiverFieldsToOrders() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '310104',
    database: 'prosperpos'
  });

  try {
    console.log('Agregando campos de persona que recibe a tabla orders...');

    // Verificar si las columnas ya existen
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'prosperpos'
      AND TABLE_NAME = 'orders'
      AND COLUMN_NAME IN ('receiver_name', 'receiver_phone')
    `);

    const existingColumns = columns.map(c => c.COLUMN_NAME);

    // Agregar receiver_name si no existe
    if (!existingColumns.includes('receiver_name')) {
      await connection.query(`
        ALTER TABLE orders
        ADD COLUMN receiver_name VARCHAR(255) NULL
        AFTER customer_phone
      `);
      console.log('✓ Columna receiver_name agregada');
    } else {
      console.log('✓ Columna receiver_name ya existe');
    }

    // Agregar receiver_phone si no existe
    if (!existingColumns.includes('receiver_phone')) {
      await connection.query(`
        ALTER TABLE orders
        ADD COLUMN receiver_phone VARCHAR(50) NULL
        AFTER receiver_name
      `);
      console.log('✓ Columna receiver_phone agregada');
    } else {
      console.log('✓ Columna receiver_phone ya existe');
    }

    console.log('\n¡Campos agregados exitosamente!');

  } catch (error) {
    console.error('Error al agregar campos:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

addReceiverFieldsToOrders();
